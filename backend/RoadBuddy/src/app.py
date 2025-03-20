from datetime import (
    timedelta, datetime
)
from functools import wraps
import os
import pytz
from flask import (
    Flask, request, session, jsonify
)
import google.cloud
import firebase_admin
from firebase_admin import credentials, firestore, auth
from firebase_admin.auth import InvalidIdTokenError, EmailAlreadyExistsError
from firebase_admin.exceptions import FirebaseError
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from utils import (
    print_json, check_required_fields,
)
from services.car_manager import CarManager
from services.chat_messages_manager import ChatMessagesManager
from services.notification_manager import NotificationManager
from services.payment_manager import PaymentManager
from services.ride_chat_manager import RideChatManager
from services.ride_manager import RideManager
from services.user_manager import UserManager

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = os.getenv('SECRET_KEY')

app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)
app.config['SESSION_REFRESH_EACH_REQUEST'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

cred = credentials.Certificate("../config/firebase-config.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def get_user_id():
    """
    Retrieve user's ID
    """
    return session.get('user', {}).get('uid')

def get_user_name():
    """
    Retrieve user's name
    """
    return session.get('user').get('name')

def auth_required(f):
    """
    Decorator to enforce user authentication for a route.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({"error": "User is not logged in"}), 401
        return f(*args, **kwargs)

    return decorated_function

@app.route('/auth', methods=['POST'])
def authorize():
    """
    Authorizes a user based on a Bearer token in the request header.
    """
    token = request.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        return jsonify({"error": "Unauthorized: No token provided"}), 401

    token = token[7:]
    try:
        decoded_token = auth.verify_id_token(token)
        session['user'] = decoded_token

        response = jsonify({"message": "Logged in successfully", "cookie": decoded_token})
        return response, 200
    except InvalidIdTokenError:
        return jsonify({"error": "Unauthorized: Invalid token"}), 401

@app.route('/api/signup', methods=['POST'])
def api_signup():
    """
    Create a user account
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    required_fields = [
      'name',
      'email',
      'password'
    ]

    missing_response = check_required_fields(data, required_fields)
    if missing_response:
        return jsonify(missing_response[0]), missing_response[1]

    name = data.get('name').strip()
    email = data.get('email').strip()
    password = data.get('password').strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        user = auth.create_user(
            email=email,
            password=password,
            display_name=name
        )
        db.collection('users').document(user.uid).set({
            'name': name,
            'email': email,
            'ridesPosted': [],
            'ridesJoined': [],
            'ridesRequested': []
        })
        return jsonify({"message": "Signup successful"}), 201

    except EmailAlreadyExistsError:
        return jsonify({"error": "The email entered already exists."}), 400
    except FirebaseError:
        return jsonify({"error": "Signup failed, please try again."}), 500

@app.route('/api/logout', methods=['POST'])
def api_logout():
    """
    Delete user from session
    """
    session.pop('user', None)
    response = jsonify({"message": "Logged out successfully"})
    response.set_cookie('session', '', expires=0)
    return response, 200

@app.route('/api/add-car', methods=['POST'])
@auth_required
def api_add_car():
    """
    Add a vehicale
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    required_fields = [
      'make',
      'model',
      'licensePlate',
      'vin',
      'year',
      'color'
    ]

    missing_response = check_required_fields(data, required_fields)
    if missing_response:
        return jsonify(missing_response[0]), missing_response[1]

    user_id = get_user_id()
    car_manager = CarManager(db, user_id)
    return car_manager.add_car(data)

@app.route('/api/post-ride', methods=['POST'])
@auth_required
def api_post_ride():
    """
    API Post a ride.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    required_fields = [
      'car_select',
      'license_plate',
      'from',
      'to',
      'date',
      'departure_time',
      'max_passengers',
      'cost'
    ]

    missing_response = check_required_fields(data, required_fields)
    if missing_response:
        return jsonify(missing_response[0]), missing_response[1]

    user_id = get_user_id()
    user_name = get_user_name()

    user_manager = UserManager(db, user_id)
    rides_posted = user_manager.get_rides_posted()

    ride_manager = RideManager(db, user_id, user_name)
    post_ride_response_data, post_ride_response_status_code = (
        ride_manager.post_ride(rides_posted, data)
    )

    if post_ride_response_status_code != 201:
        return jsonify(post_ride_response_data), post_ride_response_status_code

    ride_id = post_ride_response_data.get("rideId")

    user_manager.add_posted_ride(ride_id)

    ride_chat_manager = RideChatManager(db, user_id, user_name)
    ride_chat_manager.create_ride_chat(ride_id, data)

    return jsonify(post_ride_response_data), post_ride_response_status_code

@app.route('/api/request-ride', methods=['POST'])
@auth_required
def api_request_ride():
    """
    API Request a ride.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    required_fields = [
      'rideId',
    ]

    missing_response = check_required_fields(data, required_fields)
    if missing_response:
        return jsonify(missing_response[0]), missing_response[1]

    user_id = get_user_id()
    user_name = get_user_name()
    ride_id = data.get('rideId').strip()

    ride_manager = RideManager(db, user_id, user_name)
    get_ride_response_data, get_ride_repsosne_status_code = (
        ride_manager.get_ride(ride_id)
    )

    if get_ride_repsosne_status_code != 200:
        return jsonify(get_ride_response_data), get_ride_repsosne_status_code

    add_passenger_response_data, add_passenger_response_status_code = (
        ride_manager.add_passenger(ride_id)
    )

    if add_passenger_response_status_code != 200:
        return jsonify(add_passenger_response_data), add_passenger_response_status_code

    user_manager = UserManager(db, user_id)
    user_manager.add_joined_ride(ride_id)

    ride_chat_manager = RideChatManager(db, user_id, user_name)
    ride_chat_manager.add_participant(ride_id)

    ride_data = get_ride_response_data.get("ride")
    ride_owner_id = ride_data['ownerID']
    message = {
        f"{user_name} has booked a ride with you\n"
        f"From: {ride_data['from']}\n"
        f"To: {ride_data['to']}"
    }

    notification_manager = NotificationManager(db)
    notification_manager.store_notification(ride_owner_id, ride_id, message)

    return jsonify(get_ride_response_data), get_ride_repsosne_status_code

@app.route('/api/payment-sheet', methods=['POST'])
@auth_required
def create_payment_sheet():
    """
    Striple payment sheet.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    required_fields = [
      'rideId',
      'amount',
      'refund'
    ]

    missing_response = check_required_fields(data, required_fields)
    if missing_response:
        return jsonify(missing_response[0]), missing_response[1]

    ride_id = data.get("rideId").strip()
    refund = data.get('refund').strip().lower() == 'true'

    user_id = get_user_id()
    user_name = get_user_name()

    ride_manager = RideManager(db, user_id, user_name)
    get_ride_response_message, get_ride_response_status_code = (
        ride_manager.get_ride(ride_id)
    )

    if get_ride_response_status_code != 200:
        return jsonify(get_ride_response_message), get_ride_response_status_code

    ride_data = get_ride_response_message.get("ride")
    ride_owner_id = ride_data["ownerID"]

    if ride_owner_id == user_id and not refund:
        return jsonify({"error": "User cannot book its own ride."}), 400

    max_passengers = ride_data["maxPassengers"]
    curr_passengers = ride_data["currentPassengers"] or []
    if len(curr_passengers) >= max_passengers and not refund:
        return jsonify({"error": "Ride is full"}), 400

    ride_date = ride_data["date"]
    ride_time = ride_data["departureTime"]

    pacific_zone = pytz.timezone("America/Los_Angeles")
    ride_datetime = datetime.strptime(f"{ride_date} {ride_time}", "%Y-%m-%d %I:%M %p")
    ride_datetime = pacific_zone.localize(ride_datetime)

    if ride_datetime <= datetime.now(pacific_zone):
        return jsonify({"error": "This ride is no longer available."}), 400

    amount = data.get("amount")
    stripe_customer_id = session.get("stripe_customer_id")

    if user_id in curr_passengers and not refund:
        return jsonify({"error": "User already a passenger of this ride."}), 400

    payment_manager = PaymentManager(user_id)
    payment_sheet_response_message, payment_sheet_repsonse_status_code = (
        payment_manager.create_payment_sheet(ride_id, amount, stripe_customer_id)
    )

    if payment_sheet_repsonse_status_code != 200:
        return jsonify(payment_sheet_response_message), payment_sheet_repsonse_status_code

    session['stripe_customer_id'] = payment_sheet_response_message.get("customer")

    return jsonify(payment_sheet_response_message), payment_sheet_repsonse_status_code

@app.route('/api/available-rides', methods=['GET'])
@auth_required
def get_available_rides():
    """Fetch all available rides with status 'open'."""
    user_id = get_user_id()
    user_name = get_user_name()

    user_manger = UserManager(db, user_id)
    user_ride_response_message, user_ride_response_status_code = (
        user_manger.get_user_ride()
    )

    if user_ride_response_status_code != 200:
        return jsonify({"Error": "Failed to fetch rides"}), 400

    excluded_rides = user_ride_response_message.get("rides")

    ride_manager = RideManager(db, user_id, user_name)
    avaiable_rides_response_message, avaiable_rides_response_status_code = (
        ride_manager.get_avaiable_rides(excluded_rides)
    )

    if avaiable_rides_response_status_code != 200:
        return jsonify(avaiable_rides_response_message), avaiable_rides_response_status_code

    return jsonify(avaiable_rides_response_message), avaiable_rides_response_status_code

@app.route('/api/rides/<ride_id>', methods=['GET'])
@auth_required
def api_get_ride_details(ride_id):
    """Fetch a ride with the given ride id"""
    user_id = get_user_id()
    user_name = get_user_name()

    ride_manager = RideManager(db, user_id, user_name)
    get_ride_response_message, get_ride_response_status_code = (
        ride_manager.get_ride(ride_id)
    )

    if get_ride_response_status_code != 200:
        return jsonify(get_ride_response_message), get_ride_response_status_code

    ride_data = get_ride_response_message.get("ride")
    ride_data["id"] = ride_id

    return jsonify({"ride": ride_data}), 200

@app.route('/api/coming-up-rides', methods=['GET'])
@auth_required
def api_get_coming_up_rides():
    """Fetch all the user coming up rides"""
    user_id = get_user_id()
    user_name = get_user_name()

    user_manager = UserManager(db, user_id)
    user_ride_response_message, user_ride_response_status_code = (
        user_manager.get_user_ride()
    )

    if user_ride_response_status_code != 200:
        return jsonify(user_ride_response_message), user_ride_response_status_code

    user_rides = user_ride_response_message.get("rides")

    ride_manager = RideManager(db, user_id, user_name)

    rides_by_ids_response_message, rides_by_ids_response_status_code = (
        ride_manager.get_rides_by_ids(user_rides)
    )

    if rides_by_ids_response_status_code != 200:
        return jsonify(rides_by_ids_response_message), rides_by_ids_response_status_code

    return jsonify(rides_by_ids_response_message), rides_by_ids_response_status_code

@app.route('/api/user-id', methods=['GET'])
@auth_required
def api_get_user_id():
    """Return the authenticated user's ID"""
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({"error": "User ID not found"}), 404

        return jsonify({"userId": user_id}), 200

    except Exception as e:
        return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500

@app.route('/api/cancel-ride', methods=['POST'])
@auth_required
def api_cancel_ride():
    """Cancel a ride"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    required_fields = [
      'rideId',
    ]

    missing_response = check_required_fields(data, required_fields)
    if missing_response:
        return jsonify(missing_response[0]), missing_response[1]

    user_id = get_user_id()
    user_name = get_user_name()
    ride_id = data.get("rideId")

    ride_manager = RideManager(db, user_id, user_name)
    remove_passenger_response_message, remove_passenger_response_status_code = (
        ride_manager.remove_passenger(ride_id)
    )

    if remove_passenger_response_status_code != 200:
        return jsonify(remove_passenger_response_message), remove_passenger_response_status_code

    user_manager = UserManager(db, user_id)
    user_manager.remove_joined_ride(ride_id)

    ride_chat_mamager = RideChatManager(db, user_id, user_name)
    ride_chat_mamager.remove_participant(ride_id)

    get_ride_response = ride_manager.get_ride(ride_id)
    ride_data = get_ride_response[0].get("ride")

    ride_owner_id = ride_data.get("ownerID")
    start = ride_data.get("from")
    destination = ride_data.get("to")

    message = (
        f"{user_name} has cancelled a ride with you.\n"
        f"From: {start}\n"
        f"To: {destination}"
    )
    notification_manager = NotificationManager(db)
    notification_manager.store_notification(ride_owner_id, ride_id, message)

    return jsonify({"message": "Ride successfully cancelled"}), 200

@app.route('/api/delete-ride', methods=['POST'])
def api_delete_ride():
    """
    Delete a ride
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    required_fields = [
      'rideId',
    ]

    missing_response = check_required_fields(data, required_fields)
    if missing_response:
        return jsonify(missing_response[0]), missing_response[1]

    ride_id = data.get("rideId")
    user_id = get_user_id()
    user_name = get_user_name()

    ride_manager = RideManager(db, user_id, user_name)
    delete_ride_response_message, delete_ride_response_status_code = (
        ride_manager.delete_ride(ride_id)
    )

    if delete_ride_response_status_code != 200:
        return jsonify(delete_ride_response_message), delete_ride_response_status_code

    user_manager = UserManager(db, user_id)
    user_manager.remove_posted_ride(ride_id)

    deleted_ride_data = delete_ride_response_message.get("deletedRide")
    passengers = deleted_ride_data.get("currentPassengers")

    for passenger in passengers:
        user_manager = UserManager(db, passenger)
        user_manager.remove_joined_ride(ride_id)

    chat_messages_manager = ChatMessagesManager(db, ride_id, user_id, user_name)
    chat_messages_manager.delete_all_messages()

    ride_chat_manager = RideChatManager(db, user_id, user_name)
    response_message, response_status = ride_chat_manager.delete_ride_chat(ride_id)
    if response_status != 200:
        print(response_message.get("details"))

    start = deleted_ride_data.get("from")
    destination = deleted_ride_data.get("to")
    date = deleted_ride_data.get("date")
    cost = deleted_ride_data.get("cost") * 1.20

    message = (
        f"${cost:.2f} has been refunded to you.\n"
        f"{user_name} (ride's owner) has delete this ride.\n"
        f"From: {start}\n"
        f"To: {destination}\n"
        f"To: {date}"
    )

    notification_manager = NotificationManager(db)
    notification_manager.store_notification_for_users(passengers, ride_id, message)

    return jsonify(delete_ride_response_message), delete_ride_response_status_code

@app.route('/api/unread-notifications-count', methods=['GET'])
@auth_required
def api_get_unread_notifications_count():
    """
    Fetch the number of unread notifications.
    """
    user_id = get_user_id()
    user_manager = UserManager(db, user_id)

    response_message, response_status_code = (
        user_manager.get_unread_notification_count()
    )

    return jsonify(response_message), response_status_code

@app.route('/api/get-notifications', methods=['GET'])
def api_get_all_notifications():
    """
    Fetch all notifications for a user.
    """
    user_id = get_user_id()
    notification_manager = NotificationManager(db)

    response_message, response_status_code = (
        notification_manager.get_all_notifications_for_user(user_id)
    )

    return jsonify(response_message), response_status_code

@app.route('/api/get-cars', methods=['GET'])
@auth_required
def api_get_cars():
    """
    Fetches all cars associated with the user.
    """
    user_id = get_user_id()

    car_manager = CarManager(db, user_id)
    response_message, response_status_code = (
        car_manager.get_cars_for_user()
    )

    return jsonify(response_message), response_status_code

@app.route('/api/home', methods=['GET'])
@auth_required
def api_home():
    """
    Homepage when user logged in.
    """
    user = session.get('user')
    user_name = get_user_name()
    print_json(user)

    return jsonify({"message": f"Welcome {user_name}!"}), 200

@app.route('/api/send-message', methods=['POST'])
@auth_required
def api_send_message():
    """
    Send a message.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    required_fields = [
      'rideId',
      'text'
    ]

    missing_response = check_required_fields(data, required_fields)
    if missing_response:
        return jsonify(missing_response[0]), missing_response[1]

    ride_id = data.get("rideId")
    text = data.get("text").strip()

    user_id = get_user_id()
    user_name = get_user_name()
    timestamp = google.cloud.firestore.SERVER_TIMESTAMP

    ride_chat_manager = RideChatManager(db, user_id, user_name)
    ride_chat_response_message, ride_chat_response_status_code = (
        ride_chat_manager.update_last_message(ride_id, text, timestamp)
    )

    if ride_chat_response_status_code != 200:
        return jsonify(ride_chat_response_message), ride_chat_response_status_code

    ride_chat_details = ride_chat_response_message.get("rideChat")
    owner_id = ride_chat_details.get("owner")
    is_owner = user_id == owner_id

    chat_message_manager = ChatMessagesManager(db, ride_id, user_id, user_name)
    chat_message_response_message, chat_message_status_code = (
        chat_message_manager.send_message(text, timestamp, is_owner)
    )

    if chat_message_status_code != 201:
        print(chat_message_response_message)
        return jsonify(chat_message_response_message), chat_message_status_code

    participants = ride_chat_details.get("participants", [])
    participants = [p for p in participants if p != user_id]

    start = ride_chat_details.get('from')
    destination = ride_chat_details.get('to')
    notification_message = (
        f"{user_name} has sent a message.\n"
        f"From: {start}\n"
        f"To: {destination}"
    )

    print(participants)
    notification_manager = NotificationManager(db)
    notification_manager.store_notification_for_users(participants, ride_id, notification_message)

    return jsonify(chat_message_response_message), chat_message_status_code

@app.route('/api/get-messages/<ride_chat_id>', methods=['GET'])
@auth_required
def api_get_messages(ride_chat_id):
    """
    Fetch all messages from a rideChat.
    """
    user_id = get_user_id()
    user_name = get_user_name()

    ride_chat_manager = RideChatManager(db, user_id, user_name)
    ride_chat_response_message, ride_chat_response_status_code = (
        ride_chat_manager.get_ride_chat_details(ride_chat_id)
    )

    if ride_chat_response_status_code != 200:
        return jsonify(ride_chat_response_message), ride_chat_response_status_code

    chat_message_manager = ChatMessagesManager(db, ride_chat_id, user_id, user_name)
    chat_message_response_message, chat_message_response_status_code = (
        chat_message_manager.get_messages_sorted_by_timestamp_asc()
    )

    return jsonify(chat_message_response_message), chat_message_response_status_code

@app.route('/api/check-ride-chat/<ride_chat_id>', methods=['GET'])
@auth_required
def api_check_ride_chat(ride_chat_id):
    """
    Check if a rideChat document exists.
    """
    user_id = get_user_id()
    user_name = get_user_name()

    ride_chat_manager = RideChatManager(db, user_id, user_name)
    ride_chat_response = ride_chat_manager.get_ride_chat_details(ride_chat_id)
    response_status_code = ride_chat_response[1]

    if response_status_code != 200:
        return jsonify({"exists": False, "error": "Ride chat not found"}), 404

    return jsonify({"exists": True}), 200

@app.route('/api/get-all-user-ride-chats', methods=['GET'])
@auth_required
def api_get_all_user_ride_chats():
    """
    Fetch all the ride chats for the user.
    """
    user_id = get_user_id()
    user_name = get_user_name()

    user_manager = UserManager(db, user_id)
    response = user_manager.get_user_ride()
    ride_ids = response[0].get("rides")

    ride_chat_manager = RideChatManager(db,  user_id, user_name)
    ride_chat_response_message, ride_chat_response_status_code = (
        ride_chat_manager.get_all_user_ride_chats(ride_ids)
    )

    return jsonify(ride_chat_response_message), ride_chat_response_status_code

def delete_past_rides():
    """
    Deletes past rides from Firestore.
    """
    print("Checking for past rides...")

    ride_manager = RideManager(db, None, None)
    response = ride_manager.delete_past_rides()

    deleted_rides = response[0].get("deletedRides")

    for ride in deleted_rides:
        ride_id = ride.get("id")
        owner_id = ride.get("ownerID")
        owner_name = ride.get("ownerName")
        passenger_ids = ride.get("currentPassengers")

        print("Deleting ", ride_id)

        owner_user_manager = UserManager(db, owner_id)
        owner_user_manager.remove_posted_ride(ride_id)

        for passenger_id in passenger_ids:
            passenger_user_manager = UserManager(db, passenger_id)
            passenger_user_manager.remove_joined_ride(ride_id)

        chat_message_manager = ChatMessagesManager(db, ride_id, owner_id, owner_name)
        chat_message_manager.delete_all_messages()

        ride_chat_manager = RideChatManager(db, owner_id, owner_name)
        ride_chat_manager.delete_ride_chat(ride_id)

scheduler = BackgroundScheduler()
scheduler.add_job(delete_past_rides, "interval", minutes=10)
scheduler.start()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8090, debug=True, threaded=True)
