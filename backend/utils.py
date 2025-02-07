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
