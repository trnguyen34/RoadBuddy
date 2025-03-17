import google.cloud
from firebase_admin.exceptions import FirebaseError

class RideChatManager:
    """
    RideChatManger is responsible for handling chat-related operation.
    """
    def __init__(self, db, user_id, user_name):
        """
        Initialize the RideChatManager.
        """
        self.db = db
        self.user_id = user_id
        self.user_name = user_name
        self.ride_chat_ref = db.collection("ride_chats")

    def create_ride_chat(self, ride_id, data):
        """
        Creates a new chat room for a ride.
        """
        try:
            chat_room_doc = self.ride_chat_ref.document(ride_id)

            room_data = {
                "rideId": ride_id,
                "participants": [self.user_id],
                "lastMessage": "",
                "from": data.get('from'),
                "to": data.get('to'),
                "owner": self.user_id,
                "ownerName": self.user_name,
                'date': data.get('date'),
                'departureTime': data.get('departureTime'),
                "lastMessageTimestamp": google.cloud.firestore.SERVER_TIMESTAMP,
                "UsernameLastMessage": "",
            }

            chat_room_doc.set(room_data)

            return {
                "message": "Ride chat created successfully",
                "chat": room_data
            }, 201

        except FirebaseError as e:
            return {
                "error": "Failed to create chat",
                "details": str(e)
            }, 500

        except Exception as e:
            return {
                "error": "An unexpected error occurred",
                "details": str(e)
            }, 500

    def add_participant(self, ride_id):
        """
        Add a user to a ride chat.
        """
        try:
            chat_room_doc = self.ride_chat_ref.document(ride_id).get()

            if not chat_room_doc.exists:
                return {"error": "Chat ride not found."}, 404

            chat_data = chat_room_doc.to_dict()
            participants = chat_data.get("participants", [])

            if self.user_id in participants:
                return {"message": "User is already a participant of this ride chat."}, 200

            participants.append(self.user_id)
            self.ride_chat_ref.document(ride_id).update({"participants": participants})

            return {
                "message": "User successfully added as a participant of this chat.",
            }, 200

        except FirebaseError as e:
            return {
                "error": "Failed to add user as a participant of this chat.",
                "details": str(e)
            }, 500

        except Exception as e:
            return {
                "error": "An unexpected error occurred",
                "details": str(e)
            }, 500
