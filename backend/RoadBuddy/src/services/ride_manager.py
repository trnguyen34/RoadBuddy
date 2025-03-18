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

    def get_ride(self, ride_id):
        """
        Fetch a ride.
        """
        try:
            ride_doc = self.ride_ref.document(ride_id).get()

            if not ride_doc.exists:
                return {"error": "Ride not found"}, 404

            ride_data = ride_doc.to_dict()
            return {
                "ride": ride_data,
            }, 200

        except FirebaseError as e:
            return {
                "error": "Failed to fetch ride details.",
                "details": str(e)
            }, 500

        except Exception as e:
            return {
                "error": "An unexpected error occurred.",
                "details": str(e)
            }, 500

    def get_rides_by_ids(self, ride_ids):
        """
        Fetch multiple rides based on a list of ride IDs.
        """
        try:
            # Convert ride IDs to document references
            ride_refs = [self.ride_ref.document(ride_id) for ride_id in ride_ids]
            ride_docs = self.db.get_all(ride_refs)

            rides = []
            for ride_doc in ride_docs:
                ride_data = ride_doc.to_dict()
                ride_data["id"] = ride_doc.id
                rides.append(ride_data)

            return {
                "rides": rides
            }, 200


        except FirebaseError as e:
            return {
                "error": "Failed to fetch rides.",
                "details": str(e)
            }, 500

        except Exception as e:
            return {
                "error": "An unexpected error occurred.",
                "details": str(e)
            }, 500

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

    def add_passenger(self, ride_id):
        """
        Add a user to the ride as a passenger.
        """
        try:
            ride_doc = self.ride_ref.document(ride_id).get()

            if not ride_doc.exists:
                return {"error": "Ride not found"}, 404

            ride_data = ride_doc.to_dict()
            current_passengers = ride_data.get("currentPassengers", [])
            max_passengers = ride_data.get("maxPassengers", 0)

            if self.user_id in current_passengers:
                return {"message": "User is already a passenger"}, 200

            if len(current_passengers) >= max_passengers:
                return {"error": "Ride is full"}, 400

            current_passengers.append(self.user_id)

            if len(current_passengers) == max_passengers:
                self.ride_ref.document(ride_id).update({"status": "closed"})

            self.ride_ref.document(ride_id).update({"currentPassengers": current_passengers})

            return {
                "message": "User successfully booked this ride.",
            }, 200

        except FirebaseError as e:
            return {
                "error": "Failed to add user to this ride, please try again.",
                "details": str(e)
            }, 500

        except Exception as e:
            return {
                "error": "An unexpected error occurred.",
                "details": str(e)
            }, 500

    def get_avaiable_rides(self, excluded_rides):
        """
        Fetch all available rides with status 'open', excluding rides the user has joined or posted.
        """
        try:
            available_rides_query = (
                self.ride_ref
                .where("status", "==", "open")
                .stream()
            )

            available_rides = []
            for ride_doc in available_rides_query:
                ride_data = ride_doc.to_dict()
                ride_id = ride_doc.id

                if ride_id not in excluded_rides:
                    ride_data["id"] = ride_id
                    available_rides.append(ride_data)

            return {
                "rides": available_rides
            }, 200

        except FirebaseError as e:
            return {
                "error": "Failed to fetch all available rides.",
                "details": str(e)
            }, 500

        except Exception as e:
            return {
                "error": "An unexpected error occurred.",
                "details": str(e)
            }, 500
