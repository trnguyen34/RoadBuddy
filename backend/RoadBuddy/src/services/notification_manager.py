from firebase_admin.exceptions import FirebaseError
from google.cloud import firestore

class NotificationManager:
    """
    otificationManager handles storing and managing notifications in Firestore.
    """

    def __init__(self, db):
        """
        Initialize the NotificationManager.
        """
        self.db = db
        self.users_ref = db.collection("users")

    def store_notification(self, ride_owner_id, ride_id, message):
        """
        Stores a notification inside the user's document and increments unread count.
        """
        try:
            user_ref = self.users_ref.document(ride_owner_id)
            notification_ref = user_ref.collection("notifications").document()

            notification_ref.set({
                "message": message,
                "rideId": ride_id,
                "read": False,
                "createdAt": firestore.SERVER_TIMESTAMP
            })

            user_ref.set({"unread_notification_count": firestore.Increment(1)}, merge=True)

            return {"message": "Notification stored successfully"}, 201

        except FirebaseError as e:
            return {
                "error": "Failed to store notification",
                "details": str(e)
            }, 500

        except Exception as e:
            return {
                "error": "An unexpected error occurred",
                "details": str(e)
            }, 500

    def store_notification_for_users(self, user_ids, ride_id, message):
        """
        Stores a notification for multiple users in Firestore using batch operation.
        """
        try:
            if not user_ids:
                return {"error": "No user IDs provided."}, 400

            batch = self.db.batch()

            for user_id in user_ids:
                user_ref = self.users_ref.document(user_id)
                notification_ref = user_ref.collection("notifications").document()

                batch.set(notification_ref, {
                    "message": message,
                    "rideId": ride_id,
                    "read": False,
                    "createdAt": firestore.SERVER_TIMESTAMP
                })

                batch.set(
                    user_ref,
                    {"unread_notification_count": firestore.Increment(1)},
                    merge=True
                )

            batch.commit()

            return {
                "message": "Notifications stored successfully for all users."
            }, 200

        except FirebaseError as e:
            return {
                "error": "Failed to store notification",
                "details": str(e)
            }, 500

        except Exception as e:
            return {
                "error": "An unexpected error occurred",
                "details": str(e)
            }, 500
