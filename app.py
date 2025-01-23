from flask import Flask, redirect, render_template, request, make_response, session, abort, jsonify, url_for
import secrets
from functools import wraps
import firebase_admin
from firebase_admin import credentials, firestore, auth
from datetime import timedelta
import os
from dotenv import load_dotenv

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

@app.route('/')
def index():
    if 'user' not in session:
        return render_template('signup.html')
    else:
        return render_template('home.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
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
                'email': email,
                'created_at': firestore.SERVER_TIMESTAMP
            })

            session['user'] = {
                'uid': user.uid,
                'email': user.email,
                'display_name': user.display_name
            }

            return redirect(url_for('index'))

        except Exception as e:
            return render_template('signup.html', error=str(e))

    return render_template('signup.html')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8090, debug=True)