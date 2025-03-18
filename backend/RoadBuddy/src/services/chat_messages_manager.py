from google.cloud import firestore
from firebase_admin.exceptions import FirebaseError
import pytz

class ChatMessagesManager:
    """
    ChatMessagesManager is responsible for handling messages-related operation for a ride chat room
    """

    def __init__(self, db, ride_id, user_id, user_name):
        """
        Initialize the ChatMesssagesManager.
        """
        self.db = db
        self.ride_id = ride_id
        self.user_id = user_id
        self.user_name = user_name
        self.messages_ref = (
            db.collection("ride_chats").document(ride_id).collection("messages")
        )

    def send_message(self, text, time, is_owner):
        """
        Sends a message in a ride chat.
        """
        try:
            message_data = {
                "senderId": self.user_id,
                "senderName": self.user_name,
                "text": text,
                "timestamp": time,
                "isOwner": is_owner
            }

            self.messages_ref.document().set(message_data)

            return {
                "message": "Message has been sent"
            }, 201

        except FirebaseError as e:
            return {
                "error": "Failed to send message.",
                "details": str(e)
            }, 500

        except Exception as e:
            return {
                "error": "An unexpected error occurred.",
                "details": str(e)
            }, 500

    def delete_all_messages(self):
        """
        Fetch all messages for a ride chat, sorted by timestamp.
        """
        try:
            messages = self.messages_ref.stream()
            batch = self.db.batch()

            for message in messages:
                batch.delete(message.reference)

            batch.commit()

            return {
                "message": "All messages successfully deleted."
            }, 200

        except FirebaseError as e:
            return {
                "error": "Failed to delete messages.",
                "details": str(e)
            }, 500

        except Exception as e:
            return {
                "error": "An unexpected error occurred",
                "details": str(e)
            }, 500

    def get_messages_sorted_by_timestamp_asc(self):
        """
        Fetches all messages in a chat room.
        """
        try:
            pacific_tz = pytz.timezone("America/Los_Angeles")

            messages_query = (
                self.messages_ref.order_by("timestamp", direction=firestore.Query.ASCENDING)
            )
            messages_docs = messages_query.stream()

            sorted_messages = {}
            for index, doc in enumerate(messages_docs, start=1):
                message_data = doc.to_dict()
                message_data["id"] = doc.id

                utc_dt = message_data["timestamp"].replace(tzinfo=pytz.utc)
                pacific_dt = utc_dt.astimezone(pacific_tz)

                message_data["timestamp"] = pacific_dt.strftime("%Y-%m-%d %I:%M %p PT")
                sorted_messages[index] = message_data

            return {"messages": sorted_messages}, 200

        except FirebaseError as e:
            return {
                "error": "Failed to fetch messages.",
                "details": str(e)
            }, 500

        except Exception as e:
            return {
                "error": "An unexpected error occurred",
                "details": str(e)
            }, 500
