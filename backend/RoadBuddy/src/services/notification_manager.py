
from datetime import datetime

import google.cloud
import pytz
from firebase_admin.exceptions import FirebaseError
from google.cloud import firestore
from utils import handle_firestore_error, handle_generic_error

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
            return handle_firestore_error(e, "Failed to store notification")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

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
            return handle_firestore_error(e, "Failed to store notification")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def get_all_notifications_for_user(self, user_id):
        """
        Fetches all notifications for a user, marks them as read, and resets the unread count.
        """
        try:
            user_ref = self.users_ref.document(user_id)
            notifications_ref = user_ref.collection("notifications")

            notifications = (
                notifications_ref
                .order_by("createdAt", direction=google.cloud.firestore.Query.DESCENDING)
                .stream()
            )

            pacific_tz = pytz.timezone("America/Los_Angeles")
            notifications_list = []
            batch = self.db.batch()

            for notification in notifications:
                data = notification.to_dict()

                created_at = data.get("createdAt")
                utc_dt = (
                    datetime.utcfromtimestamp(created_at.timestamp()).replace(tzinfo=pytz.utc)
                )
                pacific_dt = utc_dt.astimezone(pacific_tz)
                formatted_date = pacific_dt.strftime("%m-%d-%Y %I:%M %p PT")

                notifications_list.append({
                    "id": notification.id,
                    "message": data.get("message"),
                    "read": data.get("read"),
                    "rideId": data.get("rideId"),
                    "createdAt": formatted_date
                })

                if not data.get("read", False):
                    batch.update(notification.reference, {"read": True})

            batch.commit()

            user_ref.update({"unread_notification_count": 0})

            return {"notifications": notifications_list}, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to fetch user notifications.")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")
