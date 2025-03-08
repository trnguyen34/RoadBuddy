from datetime import (
    timedelta, datetime
)

from functools import wraps
import os
import stripe
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
    is_duplicate_car, is_duplicate_ride, print_json, check_required_fields,
    remove_ride_from_user, remove_user_from_ride_passenger, add_user_to_ride_passenger,
    get_document_from_db, store_notification, add_user_ride_chat
)

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = os.getenv('SECRET_KEY')

app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)
app.config['SESSION_REFRESH_EACH_REQUEST'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Initialize Firebase
cred = credentials.Certificate("firebase-config.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

stripe_keys = {
    "secret_key": (
        "sk_test_51MjBbNDiM3EAos9ofwDzdsbJk97A0HgXhnhkSaBUDaISKbxxURNFZtXWIDST7"
        "ZWDWrCb4ZihCO2eLNZWjru4VKx000b02YyMeY"
    ),
    "publishable_key": (
        "pk_test_51MjBbNDiM3EAos9ocETiK2jsHzePLkUvL95YrsEwpCgThRFn4EI0eFyNl5"
        "5l7jsJzEHoHbGXOyfDm9HYTLKLsKHw00jukt7PIy"
    ),
}
stripe.api_key = stripe_keys["secret_key"]

def get_user_id():
    """Retrieve user ID"""
    return session.get('user', {}).get('uid')

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
    # Retrieve the token from the Authorization header.
    token = request.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        # Return a JSON error response if no valid token is provided.
        return jsonify({"error": "Unauthorized: No token provided"}), 401

    # Remove 'Bearer ' prefix from the token.
    token = token[7:]
    try:
        # Verify the token with Firebase.
        decoded_token = auth.verify_id_token(token)
        # Store the decoded token (user info) in the session.
        session['user'] = decoded_token

        # Create a JSON response indicating success.
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

    try:
        is_primary = data.get('isPrimary')
        if isinstance(is_primary, str):
            is_primary = is_primary.strip().lower() == "true"
        else:
            is_primary = bool(is_primary)

        car_details = {
            'make': data.get('make'),
            'model': data.get('model'),
            'licensePlate': data.get('licensePlate'),
            'vin': data.get('vin'),
            'year': int(data.get('year')),
            'color': data.get('color'),
            'isPrimary': is_primary
        }

        user_id = session['user'].get('uid')
        cars_ref = db.collection('users').document(user_id).collection('cars')

        if is_duplicate_car(db, user_id, car_details):
            return jsonify({"error": "Duplicate car detected"}), 400

        # If the new car is marked as primary, unset any existing primary car.
        if is_primary:
            existing_primary_cars = cars_ref.where('isPrimary', '==', True).stream()
            for car in existing_primary_cars:
                cars_ref.document(car.id).update({'isPrimary': False})

        cars_ref.document().set(car_details)

        return jsonify({"message": "Car added successfully", "car": car_details}), 201
    except FirebaseError as e:
        # Return a 500 error if something went wrong with Firebase.
        return jsonify({"error": "Failed to add car. Please try again.", "details": str(e)}), 500
    except Exception as e:
        # Catch-all for any other unexpected exceptions.
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500

@app.route('/api/post-ride', methods=['POST'])
@auth_required
def api_post_ride():
    """
    Post a ride.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    required_fields = [
      'car_select',
      'licebse_plate',
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

    try:
        owner_id = session['user'].get('uid')
        owner_name = session['user'].get('name')

        ride_details = {
            "car": data.get('car_select'),
            "licebsePlate": data.get('licebse_plate'),
            "from": data.get('from'),
            "to": data.get('to'),
            "date": data.get('date'),
            "departureTime": data.get('departure_time'),
            "maxPassengers": int(data.get('max_passengers')),
            "cost": float(data.get('cost'))
        }

        # Generate new ride document with an auto-generated ID.
        ride_ref = db.collection('rides').document()
        ride_id = ride_ref.id

        # Generate new rideChat document with rideID.
        db.collection("ride_chats").document(ride_id).set({
            'rideId': ride_id,
            'participants': [owner_id],
            'lastMessage': "",
            'from': ride_details['from'],
            'to': ride_details['to'],
            'lastMessageTimestamp': google.cloud.firestore.SERVER_TIMESTAMP,
        })

        # Get the user document from Firestore.
        user_ref = db.collection('users').document(owner_id)
        user_doc = user_ref.get()
        user_data = user_doc.to_dict() if user_doc.exists else {}
        rides_posted = user_data.get('ridesPosted', [])

        if is_duplicate_ride(db, rides_posted, ride_details):
            return jsonify({"error": "Duplicate ride post detected"}), 400

        # Create the ride data (car details can be updated later).
        ride_data = {
            'ownerID': owner_id,
            'ownerName': owner_name,
            'from': ride_details['from'],
            'to': ride_details['to'],
            'date': ride_details['date'],
            'departureTime': ride_details['departureTime'],
            'maxPassengers': ride_details['maxPassengers'],
            'cost': ride_details['cost'],
            'currentPassengers': [],
            'car': ride_details['car'],
            'licensePlate': ride_details['licebsePlate'],
            'status': 'open',
        }

        # Save the ride data to Firestore.
        ride_ref.set(ride_data)

        # Append the new ride ID to the user's posted rides and update Firestore.
        rides_posted.append(ride_id)
        user_ref.update({'ridesPosted': rides_posted})

        return jsonify({"message": "Ride posted successfully", "ride": ride_data}), 201

    except FirebaseError as e:
        return jsonify({"error": "Failed to post ride, please try again.", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500

@app.route('/api/request-ride', methods=['POST'])
@auth_required
def api_request_ride():
    """
    Request a ride.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    required_fields = [
      'rideId',
    ]

    missing_fields = [field for field in required_fields if field not in data or not data[field]]
    if missing_fields:
        return jsonify({
            "error": f'Missing required field(s): {", ".join(missing_fields)}'
        }), 400

    try:
        ride_id = data.get('rideId').strip()
        ride_doc_ref = db.collection('rides').document(ride_id)
        ride_doc = ride_doc_ref.get()

        user_id = session.get('user', {}).get('uid')

        curr_passengers = ride_doc.get('currentPassengers')

        curr_passengers.append(user_id)
        ride_doc_ref.update({'currentPassengers': curr_passengers})

        user_doc_ref = db.collection('users').document(user_id)
        user_doc = user_doc_ref.get()
        rides_joined = user_doc.get('ridesJoined')
        rides_joined.append(ride_id)
        user_doc_ref.update({'ridesJoined': rides_joined})

        add_user_ride_chat(db, user_id, ride_id)

        start = ride_doc.get("from")
        destination = ride_doc.get("to")
        ride_owner = ride_doc.get("ownerID")
        user_name = session.get('user', {}).get('name')
        message = f"{user_name} has booked a ride with you.\nFrom: {start}\nTo: {destination}"
        store_notification(db, ride_owner, ride_id, message)

        return jsonify({"message": "User has been added to the ride."}), 201

    except FirebaseError as e:
        return jsonify({
            "error": "Failed to look up ride with the given ride ID",
            "details": str(e)
        }), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500

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

    ride_id = data.get('rideId').strip()

    ride_doc = get_document_from_db(db, ride_id, "rides")
    if not ride_doc['success']:
        return jsonify({"error": ride_doc["error"]}), ride_doc["code"]

    ride_doc = ride_doc["document"]

    user_id = get_user_id()
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401

    ride_owner_id = ride_doc.get('ownerID')
    refund = data.get('refund', '').strip().lower() == 'true'

    if ride_owner_id == user_id and not refund:
        return jsonify({"error": "User cannot book its own ride."}), 400

    max_passengers = ride_doc.get('maxPassengers')
    curr_passengers = ride_doc.get('currentPassengers') or []
    if len(curr_passengers) >= max_passengers and not refund:
        return jsonify({"error": "Ride is full"}), 400

    if user_id in curr_passengers and not refund:
        return jsonify({"error": "User already a passenger of this ride."}), 400

    try:
        amount_cents = int(float(data.get('amount')) * 100)
    except ValueError:
        return jsonify({"error": "Invalid amount format."}), 400

    try:
        stripe_customer_id = session.get('stripe_customer_id')
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                description=f"Customer for user {user_id} (Ride: {ride_id})",
                metadata={'user_id': user_id}
            )
            stripe_customer_id = customer.id
            session['stripe_customer_id'] = stripe_customer_id

        ephemeral_key = stripe.EphemeralKey.create(
            customer=stripe_customer_id,
            stripe_version='2020-08-27'
        )

        payment_intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            customer=stripe_customer_id,
            payment_method_types=["card"],
            description="Payment for ride request"
        )

        return jsonify({
            "paymentIntent": payment_intent.client_secret,
            "ephemeralKey": ephemeral_key.secret,
            "customer": stripe_customer_id
        }), 200

    except stripe.error.StripeError as e:
        return jsonify({"error": f"Stripe error: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500

@app.route('/api/available-rides', methods=['GET'])
@auth_required
def get_all_rides():
    """Fetch all available rides with status 'open'."""
    user_id = get_user_id()
    if user_id is None:
        return jsonify({"error": "User not unauthorized"}), 401

    user_doc = get_document_from_db(db, user_id, "users")
    if not user_doc['success']:
        return jsonify({"error": user_doc["error"]}), user_doc["code"]

    user_doc = user_doc["document"]
    rides_joined = user_doc.get('ridesJoined') or []

    try:
        rides_ref = db.collection('rides').where('status', '==', 'open')
        rides_docs = rides_ref.stream()

        rides = []
        for doc in rides_docs:
            ride_data = doc.to_dict()
            if ride_data['ownerID'] != user_id and doc.id not in rides_joined:
                ride_data["id"] = doc.id
                rides.append(ride_data)

        return jsonify({"rides": rides}), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch rides", "details": str(e)}), 500

@app.route('/api/rides/<ride_id>', methods=['GET'])
@auth_required
def api_get_ride_details(ride_id):
    """Fetch a ride with the given ride id"""
    try:
        ride_doc_ref = db.collection('rides').document(ride_id)
        ride_doc = ride_doc_ref.get()
        if not ride_doc.exists:
            return jsonify({"error": "Ride not found"}), 404

        ride_data = ride_doc.to_dict()
        ride_data["id"] = ride_id
        return jsonify({"ride": ride_data}), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch ride details", "details": str(e)}), 500

@app.route('/api/coming-up-rides', methods=['GET'])
@auth_required
def api_get_coming_up_rides():
    """Fetch all the user coming up rides"""
    user_id = get_user_id()

    try:
        user_doc = get_document_from_db(db, user_id, "users")
        if not user_doc['success']:
            return jsonify({"error": user_doc["error"]}), user_doc["code"]

        user_doc = user_doc["document"]

        rides_joined = user_doc.get('ridesJoined')
        rides_posted = user_doc.get('ridesPosted')
        all_rides = (rides_joined or []) + (rides_posted or [])

        rides = []
        for ride_id in all_rides:
            ride_doc = get_document_from_db(db, ride_id, "rides")
            if not ride_doc['success']:
                continue

            ride_data = ride_doc["document"]
            ride_data["id"] = ride_id
            rides.append(ride_data)

        return jsonify({"rides": rides}), 200

    except FirebaseError as e:
        return jsonify({
            "error": "Failed to fetech coming up rides.",
            "details": str(e)
        }), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500

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

    try:
        user_id = get_user_id()
        if user_id is None:
            return jsonify({"error": "User not unauthorized"}), 401

        ride_id = data.get('rideId')

        ride_doc_ref = db.collection('rides').document(ride_id)
        ride_doc = ride_doc_ref.get()
        if not ride_doc.exists:
            return jsonify({"error": "Ride not found"}), 404

        ride_data = ride_doc.to_dict()
        ride_owner_id = ride_data.get("ownerID")
        current_passengers = ride_data.get("currentPassengers", [])

        if user_id == ride_owner_id:
            return jsonify({
                "error": "You cannot cancel your own ride, you must delete it."
                }), 400

        if user_id in current_passengers:
            remove_passengers = remove_user_from_ride_passenger(
                db, user_id, ride_id, "currentPassengers"
            )
            if remove_passengers:
                remove_ride_id = remove_ride_from_user(db, user_id, ride_id, "ridesJoined")
                if not remove_ride_id:
                    add_user_to_ride_passenger(db, user_id, ride_id, "currentPassengers")
                    return jsonify({"error": "Ride failed to cancel"}), 400

                start = ride_doc.get("from")
                destination = ride_doc.get("to")
                ride_owner = ride_doc.get("ownerID")
                user_name = session.get('user', {}).get('name')
                message = (
                f"{user_name} has cancelled a ride with you.\n"
                f"From: {start}\n"
                f"To: {destination}"
                )
                store_notification(db, ride_owner, ride_id, message)

                return jsonify({"message": "Ride successfully cancelled"}), 201
            return jsonify({"error": "Ride failed to cancell"}), 400

        return jsonify({"error": "User is not a passenger in this ride."}), 400

    except Exception as e:
        return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500

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

    user_id = get_user_id()
    if user_id is None:
        return jsonify({"error": "User not unauthorized"}), 401

    try:
        ride_id = data.get('rideId')
        ride_doc_ref = db.collection('rides').document(ride_id)
        ride_doc = ride_doc_ref.get()
        if not ride_doc.exists:
            return jsonify({"error": "Ride not found"}), 404

        ride_data = ride_doc.to_dict()
        ride_owner_id = ride_data.get("ownerID")
        current_passengers = ride_data.get("currentPassengers", [])

        if user_id != ride_owner_id:
            return jsonify({
                "error": "Only the owner of this ride can delete it."
                }), 400

        start = ride_doc.get("from")
        destination = ride_doc.get("to")
        user_name = session.get('user', {}).get('name')
        cost = ride_doc.get("cost") * 1.20
        message = (
            f"${cost:.2f} has been refunded to you.\n"
            f"{user_name} (ride's owner) has delete his ride.\n"
            f"From: {start}\n"
            f"To: {destination}"
        )

        for passenger_id in current_passengers:
            remove_user_from_ride_passenger(db, passenger_id, ride_id, "currentPassengers")
            remove_ride_from_user(db, passenger_id, ride_id, "ridesJoined")
            store_notification(db, passenger_id, ride_id, message)

        remove_ride_id = remove_ride_from_user(db, user_id, ride_id, "ridesPosted")
        if remove_ride_id:
            ride_doc_ref.delete()
            return jsonify({"message": "Ride successfully deleted"}), 201

        return jsonify({
            "error": "All passengers have been removed but ride failed to delete."
        }), 400

    except Exception as e:
        return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500

@app.route('/api/unread-notifications-count', methods=['GET'])
@auth_required
def api_get_unread_notifications_count():
    """
    Fetch the number of unread notifications.
    """
    try:
        user_id = get_user_id()
        if user_id is None:
            return jsonify({"error": "User not unauthorized"}), 401

        user_ref = db.collection('users').document(user_id).get()
        user_data = user_ref.to_dict()
        unread_count = user_data.get("unread_notification_count", 0)
        return jsonify({"unread_count": unread_count}), 200

    except FirebaseError as e:
        return jsonify({
            "error": "Failed to look up number of rnread notifications",
            "details": str(e)
        }), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500

@app.route('/api/get-notifications', methods=['GET'])
def api_get_all_notifications():
    """
    Fetch all notifications for a user.
    """
    user_id = get_user_id()
    if user_id is None:
        return jsonify({"error": "User not unauthorized"}), 401

    try:
        user_ref = db.collection('users').document(user_id)
        notifications_ref = user_ref.collection('notifications')
        notifications = (
            notifications_ref
            .order_by("createdAt", direction=google.cloud.firestore.Query.DESCENDING)
            .stream()
        )

        notifications_list = []
        batch = db.batch()

        pacific_tz = pytz.timezone("America/Los_Angeles")

        for doc in notifications:
            data = doc.to_dict()

            created_at = data.get("createdAt")
            utc_dt = datetime.utcfromtimestamp(created_at.timestamp()).replace(tzinfo=pytz.utc)
            pacific_dt = utc_dt.astimezone(pacific_tz)
            formatted_date = pacific_dt.strftime("%m-%d-%Y %I:%M %p PT")

            notifications_list.append({
                "id": doc.id,
                "message": data.get("message"),
                "read": data.get("read"),  # Keep original state in response
                "rideId": data.get("rideId"),
                "createdAt": formatted_date
            })

            if not data.get("read", False):
                batch.update(doc.reference, {"read": True})

        batch.commit()

        user_ref.update({"unread_notification_count": 0})

        return jsonify({"notifications": notifications_list}), 200

    except FirebaseError as e:
        return jsonify({
            "error": "Failed to look up number of rnread notifications",
            "details": str(e)
        }), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500

@app.route('/api/get-cars', methods=['GET'])
@auth_required
def api_get_cars():
    """
    Fetch all all cars were added.
    """
    try:
        user_id = get_user_id()
        if user_id is None:
            return jsonify({"error": "User not unauthorized"}), 401

        user_ref = db.collection('users').document(user_id)
        car_ref = user_ref.collection('cars')
        cars_docs = car_ref.stream()

        cars = []
        for doc in cars_docs:
            car_data = doc.to_dict()
            cars.append({
                "year": car_data.get("year", ""),
                "make": car_data.get("make", "").strip(),
                "model": car_data.get("model", "").strip(),
                "color": car_data.get("color", ""),
                "licensePlate": car_data.get("licensePlate", "")
            })

        if cars:
            return jsonify({"cars": cars}), 200

        return jsonify({"error": "No car have been added."}), 204

    except FirebaseError as e:
        return jsonify({
            "error": "Failed to fetech added cars.",
            "details": str(e)
        }), 500

    except Exception as e:
        return jsonify({"error": "Failed to fetch ride details", "details": str(e)}), 500

@app.route('/api/home', methods=['GET'])
@auth_required
def api_home():
    """
    Homepage when user logged in.
    """
    user = session.get('user', {})
    user_name = user.get('name', 'Guest')
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

    user_id = get_user_id()
    if user_id is None:
        return jsonify({"error": "User not unauthorized"}), 401

    user = session.get('user', {})
    user_name = user.get('name', 'Guest')

    try:
        ride_id = data.get('rideId')
        ride_chats_ref = db.collection('ride_chats').document(ride_id)
        ride_chat_doc = ride_chats_ref.get()
        ride_chat_data = ride_chat_doc.to_dict()
        participants = ride_chat_data.get('participants')

        if user_id not in participants:
            return jsonify({"error": "User is not participant of this chat."}), 400

        message_ref = ride_chats_ref.collection('messages').document()

        message_data = {
            "senderId": user_id,
            "senderName": user_name,
            "text": data.get('text'),
            "timestamp": google.cloud.firestore.SERVER_TIMESTAMP
        }

        message_ref.set(message_data)

        start = ride_chat_data.get('from')
        destination = ride_chat_data.get('to')
        notification_msg = (
            f"{user_name} has sent a message.\n"
            f"From: {start}\n"
            f"To: {destination}"
        )

        for participant_id in participants:
            print(participant_id)
            print(user_id)
            if participant_id != user_id:
                store_notification(db, participant_id, ride_id, notification_msg)

        return jsonify({"message": "Message has been sent"}), 201

    except Exception as e:
        return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500

def delete_past_rides():
    """
    Deletes past rides from Firestore.
    """
    try:
        print("Checking for past rides...")
        pacific_zone = pytz.timezone("America/Los_Angeles")
        now_pacific = datetime.now(pacific_zone)

        rides_ref = (
            db.collection("rides")
            .where("date", "<", now_pacific.strftime("%Y-%m-%d"))
            .stream()
        )

        for ride in rides_ref:
            print("Deleting ", ride.id)

            ride_id = ride.id
            ride_data = ride.to_dict()

            ride_owner = ride_data.get("ownerID")
            current_passengers = ride_data.get("currentPassengers", [])

            remove_ride_from_user(db, ride_owner, ride_id, "ridesPosted")

            for passenger_id in current_passengers:
                print("deleting passenger:", passenger_id)
                remove_ride_from_user(db, passenger_id, ride_id, "ridesJoined")

            db.collection("rides").document(ride_id).delete()

    except Exception as e:
        print(f"Error deleting past rides: {e}")

scheduler = BackgroundScheduler()
scheduler.add_job(delete_past_rides, "interval", minutes=5)
scheduler.start()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8090, debug=True, threaded=True)
