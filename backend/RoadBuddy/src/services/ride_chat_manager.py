import google.cloud
from firebase_admin.exceptions import FirebaseError
import pytz
from utils import handle_firestore_error, handle_generic_error


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
            return handle_firestore_error(e, "Failed to create chat")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def get_ride_chat_details(self, ride_id):
        """
        Fetches the ride chat details.
        """
        try:
            ride_chat_doc = self.ride_chat_ref.document(ride_id).get()

            if not ride_chat_doc.exists:
                return {"error": "Chat ride not found."}, 404

            ride_chat_data = ride_chat_doc.to_dict()
            participants = ride_chat_data.get("participants")

            if self.user_id not in participants:
                return {
                    "error": "User is not a participant of this chat."
                }, 403

            return {
                "rideChat": ride_chat_data,
            }, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to fetch ride chat")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def get_all_user_ride_chats(self, ride_chat_ids):
        """
        Fetches all ride chats for the user using a Firestore batch read.
        """
        pacific_tz = pytz.timezone("America/Los_Angeles")

        try:
            if not ride_chat_ids:
                return {"ride_chats": []}, 200

            ride_chat_refs = [self.ride_chat_ref.document(ride_id) for ride_id in ride_chat_ids]
            ride_chat_docs = self.db.get_all(ride_chat_refs)

            ride_chats = []
            for chat_doc in ride_chat_docs:
                if chat_doc.exists:
                    chat_data = chat_doc.to_dict()
                    chat_data["id"] = chat_doc.id

                    timestamp = chat_data.get("lastMessageTimestamp")
                    utc_dt = timestamp.astimezone(pytz.utc)
                    pacific_dt = utc_dt.astimezone(pacific_tz)
                    chat_data["lastMessageTimestamp"] = (
                        pacific_dt.strftime("%Y-%m-%d %I:%M %p PT")
                    )

                    chat_data["sort_timestamp"] = timestamp
                    ride_chats.append(chat_data)

            ride_chats.sort(key=lambda x: x["sort_timestamp"], reverse=True)

            return {"ride_chats": ride_chats}, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to fetch user ride chats.")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def delete_ride_chat(self, ride_id):
        """
        Delete a ride chat room.
        """
        try:
            chat_room_doc = self.ride_chat_ref.document(ride_id)
            chat_room_doc.delete()

            return {
                "message": "Ride chat successfully deleted."
            }, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to create chat")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def add_participant(self, ride_id):
        """
        Add a user to the ride chat.
        """
        try:
            chat_room_doc = self.ride_chat_ref.document(ride_id).get()

            if not chat_room_doc.exists:
                return {"error": "Chat ride not found."}, 404

            chat_data = chat_room_doc.to_dict()
            participants = chat_data.get("participants", [])

            if self.user_id in participants:
                return {
                    "message": "User is already a participant of this ride chat."
                }, 200

            participants.append(self.user_id)
            self.ride_chat_ref.document(ride_id).update({"participants": participants})

            return {
                "message": "User successfully added as a participant of this chat.",
            }, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to add user as a participant of this chat.")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def remove_participant(self, ride_id):
        """
        Remove a user from the ride chat
        """
        try:
            chat_room_doc = self.ride_chat_ref.document(ride_id).get()

            if not chat_room_doc.exists:
                return {"error": "Chat ride not found."}, 404

            chat_data = chat_room_doc.to_dict()
            participants = chat_data.get("participants", [])

            if self.user_id not in participants:
                return {
                    "message": "User is not a particpant of this ride chat."
                }, 400

            participants.remove(ride_id)
            self.ride_chat_ref.document(ride_id).update({"participants": participants})

            return {
                "message": "User successfully removed as a participant of this chat.",
            }, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to remove user as a participant of this chat.")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def update_last_message(self, ride_id, text, time):
        """
        Fetches the ride chat document, extracts metadata, and updates last message info.
        """
        try:
            ride_chat_doc = self.ride_chat_ref.document(ride_id).get()

            if not ride_chat_doc.exists:
                return {"error": "Ride chat not found."}, 404

            if not text.strip():
                return {"error": "Message cannot be empty."}, 400

            ride_chat_data = ride_chat_doc.to_dict()
            participants = ride_chat_data.get("participants", [])

            if self.user_id not in participants:
                return {"error": "User is not a participant of this chat."}, 400

            self.ride_chat_ref.document(ride_id).update({
                "lastMessageTimestamp": time,
                "lastMessage": text,
                "UsernameLastMessage": self.user_name
            })

            return {
                "rideChat": ride_chat_data,
            }, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to update ride chat.")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")
