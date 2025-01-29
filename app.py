from datetime import timedelta
from functools import wraps
import os
from flask import (
    Flask, redirect, render_template, request,
    make_response, session, url_for, jsonify
)
import firebase_admin
from firebase_admin import credentials, firestore, auth
from firebase_admin.auth import InvalidIdTokenError
from firebase_admin.exceptions import FirebaseError

from utils import is_duplicate_ride

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')


app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)
app.config['SESSION_REFRESH_EACH_REQUEST'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Initialize Firebase
cred = credentials.Certificate("firebase-config.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def auth_required(f):
    """
    Decorator to enforce user authentication for a route.

    Checks if 'user' exists in the session. If not, redirects to the login page. Otherwise, 
    executes the wrapped function.

    Args:
        f (function): The route function to wrap and execute if authentication passes.

    Returns:
        function: The wrapped function if authenticated, or a redirect to the login page.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)

    return decorated_function

@app.route('/auth', methods=['POST'])
def authorize():
    """
    Authorizes a user based on a Bearer token in the request header.

    Validates the token using Firebase. If valid, adds the user to the session 
    and redirects to the home page. If invalid, returns a 401 Unauthorized response.

    Returns:
        Response: A redirect to the home page if authentication succeeds, or a 
        401 Unauthorized response if it fails.
    """
    token = request.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        return "Unauthorized", 401

    token = token[7:]

    try:
        decoded_token = auth.verify_id_token(token) # Validate token here
        session['user'] = decoded_token # Add user to session
        return redirect(url_for('home'))
    except InvalidIdTokenError:
        return "Unauthorized", 401

@app.route('/', methods=['GET'])
def index():
    """
    Redirects users to the appropriate page based on authentication status.

    If the user is logged in (exists in the session), redirects to the home page. 
    Otherwise, redirects to the login page.

    Returns:
        Response: A redirect to the home page for authenticated users, or the 
        login page for unauthenticated users.
    """
    if 'user' in session:
        return redirect(url_for('home'))
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    """
    Handles user login and redirects if already authenticated.

    If the user is already logged in (exists in the session), redirects to the index page. 
    Otherwise, renders the login page.

    Returns:
        Response: A redirect to the index page if authenticated, or the rendered login page.
    """
    if 'user' in session:
        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    """
    Handles user registration.

    If the user is already logged in, redirects to the index page. For POST requests, 
    collects user details, validates them, and creates a new user in Firestore. 
    On success, adds the user to the session and redirects to the index page. 
    On failure, displays an error message. For GET requests, renders the signup page.

    Returns:
        Response: A redirect to the index page for logged-in or newly registered users, 
        or the rendered signup page with or without an error message.
    """
    if 'user' in session:
        return redirect(url_for('index'))

    if request.method == 'POST':
        name = request.form.get('name')
        address = request.form.get('address')
        email = request.form.get('email')
        username = request.form.get('username')
        password = request.form.get('password')

        if not email or not password:
            return render_template('signup.html', error="Email and password are required")

        try:
            user = auth.create_user(
                email=email,
                password=password,
                display_name=name
            )
            db.collection('users').document(user.uid).set({
                'name': name,
                'username': username,
                'address': address,
                'email': email
            })
            session['user'] = {
                'uid': user.uid,
                'email': user.email,
                'display_name': user.display_name
            }
            return redirect(url_for('index'))
        except FirebaseError:
            return render_template('signup.html', error="error")

    return render_template('signup.html')

@app.route('/logout', methods=['POST'])
def logout():
    """
    Logs out the current user by clearing session and cookies.

    Removes the 'user' key from the session and invalidates the session cookie. 
    Redirects the user to the login page.

    Returns:
        Response: A redirect to the login page with the session and cookies cleared.
    """
    session.pop('user', None)
    response = make_response(redirect(url_for('login')))
    response.set_cookie('session', '', expires=0)
    return response

@app.route('/post-ride', methods=['GET', 'POST'])
@auth_required
def post_ride():
    """
    Handles ride posting by authenticated users.

    For POST requests, gathers ride details from the form, and saves the
    ride information to Firestore. Updates the user's profile with
    the posted ride ID. For GET requests, renders the ride posting form.

    Returns:
        Response: JSON response with the ride details and a success message (status 201)
        for successful POST requests, or renders the ride posting form (status 200).
        On error, renders the form with an error message.
    """
    if request.method == 'POST':
        owner_id = session['user'].get('uid')
        owner_name = session['user'].get('name')

        ride_details = {
            "start": request.form.get('from'),
            "destination": request.form.get('to'),
            "date": request.form.get('date'),
            "departureTime": request.form.get('departure_time'),
            "maxPassengers": int(request.form.get('max_passengers')),
            "cost": float(request.form.get('cost'))
        }

        try:
            # Generate new ride document
            ride_ref = db.collection('rides').document() # Auto-generated ID
            ride_id = ride_ref.id

            ride_data = ({
                'ownerID': owner_id,
                'ownerName': owner_name,
                'from': ride_details['start'],
                'to': ride_details['destination'],
                'date': ride_details['date'],
                'departureTime': ride_details['departureTime'],
                'maxPassengers': ride_details['maxPassengers'],
                'cost': ride_details['cost'],
                'currentPassengers': [],
                'status': 'open'
            })

            # Access the 'users' collection in Firestore with the owner_id
            user_ref = db.collection('users').document(owner_id)
            # Fecth the user's document data
            user_doc = user_ref.get()
            # Convert the Firestore document into a Python dictionary
            user_data = user_doc.to_dict()
            # Get existing rides or empty list
            rides_posted = user_data.get('ridesPosted', [])

            if is_duplicate_ride(db, rides_posted, ride_details):
                return jsonify({"error": "Duplicate ride post detected"}), 400

            # Save the ride data to Firestore
            ride_ref.set(ride_data)

            # Append new ride ID and update Firestore
            rides_posted.append(ride_id)
            user_ref.update({'ridesPosted': rides_posted})

            return jsonify({"message": "Ride posted successfully", "ride": ride_data}), 201
        except FirebaseError:
            return render_template('ridePost.html', error="Please try again.")

    return render_template('ridePost.html')

@app.route('/home')
@auth_required
def home():
    """
    Renders the home page for authenticated users.

    Retrieves the user's name from the session (defaults to 'User' if not available) and 
    passes it to the home page template.

    Returns:
        Response: The rendered home page for the authenticated user.
    """
    user_name = session['user'].get('name', 'User')
    return render_template('home.html', user_name=user_name)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8090, debug=True)
