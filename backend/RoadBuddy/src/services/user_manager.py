from firebase_admin.exceptions import FirebaseError
from utils import handle_firestore_error, handle_generic_error

class UserManager:
    """
    UserManager handles user-related operations in Firestore.
    """

    def __init__(self, db, user_id):
        """
        Initialize the UserManager.
        """
        self.db = db
        self.user_id = user_id
        self.user_ref = db.collection("users").document(user_id)

    def get_rides_posted(self):
        """
        Retrieves rides posted by the user.
        """
        user_doc = self.user_ref.get()
        user_data = user_doc.to_dict()
        rides_posted = user_data.get('ridesPosted', [])

        return rides_posted

    def get_user_ride(self):
        """
        Fetches all rides that the user has joined and posted.
        """
        try:
            user_doc = self.db.collection("users").document(self.user_id).get()

            if not user_doc.exists:
                return {"error": "User not found"}, 404

            user_data = user_doc.to_dict()
            rides_joined = user_data.get("ridesJoined", [])
            rides_posted = user_data.get("ridesPosted", [])

            rides = rides_joined + rides_posted

            return {
                "rides": rides
            }, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to fetch user rides.")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def add_posted_ride(self, ride_id):
        """
        Add a ride to the user's "ridesPosted" list in Firestore.
        """
        try:
            user_doc = self.user_ref.get()
            if not user_doc.exists:
                return {"error": "User not found"}, 404

            user_data = user_doc.to_dict()
            rides_posted = user_data.get('ridesPosted', [])

            if ride_id in rides_posted:
                return {"message": "User has already posted this ride"}, 200

            rides_posted.append(ride_id)
            self.user_ref.update({"ridesPosted": rides_posted})

            return {
                "message": "Ride successfully added to user's posted rides"
            }, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to add ride to user's posted rides")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def add_joined_ride(self, ride_id):
        """
        Add a ride to the iser's "rideJoined" list in Firestore.
        """
        try:
            user_doc = self.user_ref.get()
            if not user_doc.exists:
                return {"error": "User not found"}, 404

            user_data = user_doc.to_dict()
            rides_joined = user_data.get("ridesJoined", [])

            if ride_id in rides_joined:
                return {"message": "User has already joined this ride"}, 200

            rides_joined.append(ride_id)
            self.user_ref.update({"ridesJoined": rides_joined})

            return {
                "message": "Ride successfully added to user's joined rides"
            }, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to add ride to user's joined rides")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def remove_joined_ride(self, ride_id):
        """
        Remove a joined ride.
        """
        try:
            user_doc = self.user_ref.get()
            if not user_doc.exists:
                return {"error": "User not found"}, 404

            user_data = user_doc.to_dict()
            rides_joined = user_data.get("ridesJoined", [])
            rides_joined.remove(ride_id)
            self.user_ref.update({"ridesJoined": rides_joined})

            return {
                "message": "Ride successfully removed from user's joined rides"
            }, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to remove ride from user's joined rides")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def remove_posted_ride(self, ride_id):
        """
        Remove a posted ride.
        """
        try:
            user_doc = self.user_ref.get()
            if not user_doc.exists:
                return {"error": "User not found"}, 404

            user_data = user_doc.to_dict()
            rides_joined = user_data.get("ridesPosted", [])
            rides_joined.remove(ride_id)
            self.user_ref.update({"ridesPosted": rides_joined})

            return {
                "message": "Ride successfully removed from user's posted rides"
            }, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to remove ride from user's joined rides")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def get_unread_notification_count(self):
        """
        Fetch the number of unread notification count
        """
        try:
            user_doc = self.db.collection("users").document(self.user_id).get()

            if not user_doc.exists:
                return {"error": "User not found"}, 404

            user_data = user_doc.to_dict()
            unread_count = user_data.get("unread_notification_count")

            return {
                "unread_count": unread_count
            }, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to look up number of unread notifications")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")
