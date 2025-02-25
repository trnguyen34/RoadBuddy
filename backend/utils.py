from datetime import datetime
import json
from google.cloud.firestore import (
    ArrayRemove, ArrayUnion
)

def is_duplicate_car(db, user_id, car_details):
    """
    Checks if a car with the same license plate or VIN already exists for a user.
    If the user has no cars collection, return False.

    Args:
        db (Firestore Client): Firestore database instance.
        user_id (str): The ID of the user.
        car_details (dict): Dictionary containing the car details
    """
    user_ref = db.collection('users').document(user_id)
    cars_ref = user_ref.collection('cars').stream()

    for car_doc in cars_ref:
        car_data = car_doc.to_dict()

        if (
            car_data['licensePlate'] == car_details['licensePlate'] and
            car_data['vin'] == car_details['vin']
        ):
            return True

    return False

def is_duplicate_ride(db, ride_ids, ride_details):
    """
    Checks if a ride with the same owner, route, and time already exists.
    
    Args:
        db: Firestore database
        ride_ids: A list of rideIDs post by the owner.
        ride_details: A list of fields to check for duplicates
    
    Returns:
        bool: True if a duplicate ride exists, False otherwise.
    """
    for ride_id in ride_ids:
        ride_doc = db.collection('rides').document(ride_id).get()

        if not ride_doc.exists:
            continue    # Skip to the next ride if the document doesn't exist

        ride_data = ride_doc.to_dict()

        if (
            ride_data.get('from') == ride_details['from'] and
            ride_data.get('to') == ride_details['to'] and
            ride_data.get('date') == ride_details['date'] and
            ride_data.get('departureTime') == ride_details['departureTime']
        ):
            return True

    return False

def validate_payment_data(data):
    """
    Validates the card.
    """
    errors = []

    card_number = data.get('cardNumber')
    if not card_number.isdigit() or (len(card_number) != 16):
        errors.append("Card number must be 16 digits.")

    cvv = str(data.get('cvv'))
    if len(cvv) != 3:
        errors.append("CVV must be either 3 digits.")

    exp_month = int(data.get('expMonth'))
    if exp_month < 1 or exp_month > 12:
        errors.append("Expiration month must be a valid number between 1 and 12.")

    exp_year = int(data.get('expYear'))
    current_year = datetime.now().year
    if exp_year < current_year:
        errors.append("Expiration year must be the current year or later.")

    if isinstance(exp_month, int) and isinstance(exp_year, int):
        now = datetime.now()
        if exp_year == now.year and exp_month < now.month:
            errors.append("Card is expired.")

    return errors

def is_duplicate_card(db, user_id, card_details):
    """
    Checks if a card number already exists.
    """
    user_ref = db.collection('users').document(user_id)
    cards_ref = user_ref.collection('cards').stream()

    for card_doc in cards_ref:
        card_data =  card_doc.to_dict()

        if card_data['cardNumber'] == card_details['cardNumber']:
            return True

    return False

def print_json(data, indent=4, sort_keys=False):
    """
    Pretty prints a dictionary (JSON) to the console.
    """
    try:
        formatted_json = json.dumps(data, indent=indent, sort_keys=sort_keys, ensure_ascii=False)
        print(formatted_json)
    except (TypeError, ValueError) as e:
        print(f"Error formatting JSON: {e}")

def safe_int(value):
    """
    Safely converts a value to an integer.
    If conversion fails, returns the provided default value.
    """
    try:
        return int(value)
    except (ValueError, TypeError):
        return None

def is_valid_boolean(value):
    """Check if the given value is a valid boolean."""
    if isinstance(value, bool):
        return True
    if isinstance(value, str):
        return value.strip().lower() in ["true", "false"]
    return False

def check_required_fields(data, required_fields):
    """
    Ensure that all required fields are present in the JSON payload.
    """
    missing_fields = []
    for field in required_fields:
        if field not in data or not data.get(field):
            missing_fields.append(field)

    if missing_fields:
        return {"error": f"Missing or empty required field(s): {', '.join(missing_fields)}"}, 400
    return None

def remove_ride_from_user(db, user_id, ride_id, field):
    """Removes a rideId from user's ridesPosted field."""
    try:
        user_doc_ref = db.collection("users").document(user_id)
        user_doc_ref.update({
            field: ArrayRemove([ride_id])
        })
        return True
    except Exception:
        return False

def remove_user_from_ride_passenger(db, user_id, ride_id, field):
    """Removes a user from the passenger field in Rides document"""
    try:
        user_doc_ref = db.collection("rides").document(ride_id)
        user_doc_ref.update({
            field: ArrayRemove([user_id])
        })
        return True
    except Exception:
        return False

def add_user_to_ride_passenger(db, user_id, ride_id, field):
    """Adds a user to the passenger field in the Rides document"""
    try:
        ride_doc_ref = db.collection("rides").document(ride_id)
        ride_doc = ride_doc_ref.get()
        if not ride_doc.exists:
            return {"success": False, "error": "Ride not found"}

        ride_data = ride_doc.to_dict()
        max_passengers = ride_data.get("maxPassengers", 0)
        current_passengers = ride_data.get(field, [])

        if len(current_passengers) >= max_passengers:
            return {"success": False, "error": "Ride is full"}

        if user_id in current_passengers:
            return {"success": False, "error": "User is already in the ride"}

        ride_doc_ref.update({
            field: ArrayUnion([user_id])
        })
    except Exception as e:
        return {"success": False, "error": str(e)}
