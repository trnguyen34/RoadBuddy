from firebase_admin.exceptions import FirebaseError

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

    def delete_all_messages(self):
        """
        Delete all messages in a chat room.
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
