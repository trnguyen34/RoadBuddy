from firebase_admin.exceptions import FirebaseError

class RideManager:
    """
    RideManager is responsible for handling ride-related operation for a user.
    """
    def __init__(self, db, user_id, user_name):
        """
        Initialize the RideManager.
        """
        self.db = db
        self.user_id = user_id
        self.user_name = user_name
        self.ride_ref = db.collection("rides")

    def is_duplicate_ride(self, rides_posted, ride_details):
        """
        Check if a duplicate ride post already exists for the user.
        """
        for ride_id in rides_posted:
            ride_doc = self.ride_ref.document(ride_id).get()
            if ride_doc.exists:
                existing_ride = ride_doc.to_dict()
                if (
                    existing_ride["from"] == ride_details["from"]
                    and existing_ride["to"] == ride_details["to"]
                    and existing_ride["date"] == ride_details["date"]
                    and existing_ride["departureTime"] == ride_details["departureTime"]
                ):
                    return True

        return False

    def post_ride(self, rides_posted, data):
        """
        Post a new ride.
        """
        try:
            ride_ref = self.ride_ref.document()
            ride_id = ride_ref.id

            if self.is_duplicate_ride(rides_posted, data):
                return {"error": "Duplicate ride post detected"}, 400

            ride_data = {
                "ownerID": self.user_id,
                "ownerName": self.user_name,
                "from": data.get('from'),
                "to": data.get('to'),
                "date": data.get('date'),
                "departureTime": data.get('departure_time'),
                "maxPassengers": data.get('max_passengers'),
                "cost": data.get('cost'),
                "currentPassengers": [],
                "car": data.get('car_select'),
                "licensePlate": data.get('license_plate'),
                "status": "open",
            }

            ride_ref.set(ride_data)

            return {
                "message": "Ride posted successfully",
                "ride": ride_data,
                "rideId": ride_id
            }, 201

        except FirebaseError as e:
            return {
                "error": "Failed to post ride, please try again.",
                "details": str(e)
            }, 500

        except Exception as e:
            return {
                "error": "An unexpected error occurred.",
                "details": str(e)
            }, 500
