from firebase_admin.exceptions import FirebaseError

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
            return {
                "error": "Failed to add ride to user's posted rides",
                "details": str(e)
            }, 500

        except Exception as e:
            return {
                "error": "An unexpected error occurred",
                "details": str(e)
            }, 500

    def add_joined_ride(self, ride_id):
        """
        Add a ride to the iser's "rideJoined" list in Firestore.
        """
        try:
            user_doc = self.user_ref.get()
            if not user_doc.exists:
                return {"error": "User not found"}, 404

            user_data = user_doc.to_dict()
            rides_joined = user_data.get('ridesJoined', [])

            if ride_id in rides_joined:
                return {"message": "User has already joined this ride"}, 200

            rides_joined.append(ride_id)
            self.user_ref.update({"ridesJoined": rides_joined})

            return {
                "message": "Ride successfully added to user's joined rides"
            }, 200

        except FirebaseError as e:
            return {
                "error": "Failed to add ride to user's joined rides",
                "details": str(e)
            }, 500

        except Exception as e:
            return {
                "error": "An unexpected error occurred",
                "details": str(e)
            }, 500