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