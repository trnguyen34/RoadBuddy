def is_duplicate_ride(db, ride_ids, ride_details):
    """
    Checks if a ride with the same owner, route, and time already exists.
    
    Args:
        ride_ids: A list of rideIDs post by the owner.
        start (str): Starting location.
        destination (str): Destination.
        date (str): Ride date.
        time (str): Departure time.
    
    Returns:
        bool: True if a duplicate ride exists, False otherwise.
    """
    for ride_id in ride_ids:
        ride_doc = db.collection('rides').document(ride_id).get()

        if not ride_doc.exists:
            continue    # Skip to the next ride if the document doesn't exist

        ride_data = ride_doc.to_dict()

        if (
            ride_data.get('from') == ride_details['start'] and
            ride_data.get('to') == ride_details['destination'] and
            ride_data.get('date') == ride_details['date'] and
            ride_data.get('departureTime') == ride_details['departureTime']
        ):
            return True

    return False
