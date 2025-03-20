from datetime import datetime
import pytz
from firebase_admin.exceptions import FirebaseError
from utils import handle_firestore_error, handle_generic_error

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
            return handle_firestore_error(e, "Failed to fetch ride details.")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

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
            return handle_firestore_error(e, "Failed to fetch rides.")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

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
            return handle_firestore_error(e, "Failed to post ride, please try again.")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def delete_ride(self, ride_id):
        """
        Delete a ride.
        """
        try:
            ride_doc = self.ride_ref.document(ride_id).get()

            if not ride_doc.exists:
                return {"error": "Ride not found"}, 404

            ride_data = ride_doc.to_dict()
            ride_owner_id = ride_data.get("ownerID")

            if self.user_id != ride_owner_id:
                return {
                    "error": "Only the owner of this ride can delete it."
                }, 400

            self.ride_ref.document(ride_id).delete()

            return {
                "message": "Ride successfully deleted",
                "deletedRide": ride_data
            }, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to delete ride. Please try again.")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

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
            return handle_firestore_error(e, "Failed to add user to this ride, please try again.")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def remove_passenger(self, ride_id):
        """
        Remove a passenger from a ride.
        """
        try:
            ride_doc = self.ride_ref.document(ride_id).get()

            if not ride_doc.exists:
                return {"error": "Ride not found"}, 404

            ride_data = ride_doc.to_dict()
            current_passengers = ride_data.get("currentPassengers", [])
            ride_owner_id = ride_data.get("ownerID")

            if self.user_id == ride_owner_id:
                return {
                    "error": "User cannot remove themselves from their own ride, must delete it."
                }, 400

            if self.user_id not in current_passengers:
                return {
                    "error": "User is not a passenger of the ride."
                }, 400

            current_passengers.remove(self.user_id)
            self.ride_ref.document(ride_id).update({"currentPassengers": current_passengers})

            if ride_data.get("status") == "closed":
                self.ride_ref.document(ride_id).update({"status": "open"})

            return {
                "message": "User successfully removed from the ride.",
            }, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to remove user from this ride.")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def get_avaiable_rides(self, excluded_rides):
        """
        Fetch all available rides with status 'open', excluding rides the user has joined or posted.
        """
        pacific_zone = pytz.timezone("America/Los_Angeles")
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

                ride_date = ride_data["date"]
                ride_time = ride_data["departureTime"]
                ride_datetime = datetime.strptime(f"{ride_date} {ride_time}", "%Y-%m-%d %I:%M %p")
                ride_datetime = pacific_zone.localize(ride_datetime)

                if ride_datetime >= datetime.now(pacific_zone):
                    if ride_id not in excluded_rides:
                        ride_data["id"] = ride_id
                        available_rides.append(ride_data)

            return {
                "rides": available_rides
            }, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to fetch all available rides.")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def delete_past_rides(self):
        """
        Deletes all rides that have already passed based on the date and time.
        """
        pacific_zone = pytz.timezone("America/Los_Angeles")
        now_pacific = datetime.now(pacific_zone)
        today_date = now_pacific.strftime("%Y-%m-%d")

        try:
            deleted_rides = []
            batch = self.db.batch()

            rides_query = (
                self.ride_ref
                .where("date", "<=", today_date)
                .stream()
            )

            for ride_doc in rides_query:
                ride_data = ride_doc.to_dict()
                ride_id = ride_doc.id
                ride_data["id"] = ride_id

                ride_date = ride_data.get("date")
                ride_time = ride_data.get("departureTime")

                ride_datetime = datetime.strptime(f"{ride_date} {ride_time}", "%Y-%m-%d %I:%M %p")
                ride_datetime = pacific_zone.localize(ride_datetime)

                if ride_datetime < datetime.now(pacific_zone):
                    deleted_rides.append(ride_data)
                    batch.delete(self.ride_ref.document(ride_id))

            batch.commit()

            return {
                "deletedRides": deleted_rides
            }, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to delete past rides")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")
