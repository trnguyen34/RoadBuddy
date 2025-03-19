from flask import jsonify
from firebase_admin.exceptions import FirebaseError
from utils import handle_firestore_error, handle_generic_error

class CarManager:
    """
    CarManager is responsible for handling car-related operations for a user.
    """
    def __init__(self, db, user_id):
        """
        Initialize the CarManager with Firestore reference and user ID.
        """
        self.db = db
        self.user_id = user_id
        self.cars_ref = db.collection("users").document(user_id).collection("cars")

    def add_car(self, data):
        """
        Add a new car to the user's collection.
        """
        try:
            is_primary = self.normalize_boolean(data.get("isPrimary"))
            car_details = {
                'make': data.get('make'),
                'model': data.get('model'),
                'licensePlate': data.get('licensePlate'),
                'vin': data.get('vin'),
                'year': int(data.get('year')),
                'color': data.get('color'),
                'isPrimary': is_primary
            }

            if self.is_duplicate_car(car_details):
                return jsonify({"error": "Duplicate car detected"}), 400

            if is_primary:
                self.unset_existing_primary_car()

            self.cars_ref.document().set(car_details)

            return jsonify({
                "message": "Car added successfully", 
                "car": car_details
            }), 201

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to add car. Please try again.")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    def is_duplicate_car(self, car_details):
        """
        Check if a car with the same VIN already exists.
        """
        duplicate_query = (
            self.cars_ref
            .where("vin", "==", car_details["vin"])
            .limit(1)
            .stream()
        )
        return any(duplicate_query)

    def get_cars_for_user(self):
        """
        Fetches all cars associated with the user.
        """
        try:
            cars_docs = self.cars_ref.stream()

            cars = []
            for car in cars_docs:
                car_data = car.to_dict()
                cars.append({
                "year": car_data.get("year"),
                "make": car_data.get("make"),
                "model": car_data.get("model"),
                "color": car_data.get("color"),
                "licensePlate": car_data.get("licensePlate")
            })

            if not cars:
                return {
                    "error": "No car have been added."
                }, 204

            return {
                "cars": cars
            }, 200

        except FirebaseError as e:
            return handle_firestore_error(e, "Failed to fetch added cars. Please try again.")

        except Exception as e:
            return handle_generic_error(e, "An unexpected error occurred")

    @staticmethod
    def normalize_boolean(value):
        """Convert different boolean formats to Python bool."""
        if isinstance(value, str):
            return value.strip().lower() == "true"
        return bool(value)

    def unset_existing_primary_car(self):
        """Unset existing primary car if a new one is marked as primary."""
        existing_primary_cars = self.cars_ref.where("isPrimary", "==", True).stream()
        for car in existing_primary_cars:
            self.cars_ref.document(car.id).update({"isPrimary": False})
