import json

def handle_firestore_error(error, message="Firestore operation failed"):
    """
    Handles errors related to Firestore operations.
    """
    return {
        "error": message,
        "details": str(error)
    }, 500

def handle_generic_error(error, message="An unexpected error occurred"):
    """
    Handles generic exceptions not specific to Firestore.
    """
    return {
        "error": message,
        "details": str(error)
    }, 500

def print_json(data, indent=4, sort_keys=False):
    """
    Pretty prints a dictionary (JSON) to the console.
    """
    try:
        formatted_json = json.dumps(data, indent=indent, sort_keys=sort_keys, ensure_ascii=False)
        print(formatted_json)
    except (TypeError, ValueError) as e:
        print(f"Error formatting JSON: {e}")

def check_required_fields(data, required_fields):
    """
    Ensure that all required fields are present in the JSON payload.
    """
    missing_fields = []
    for field in required_fields:
        if field not in data or not data.get(field):
            missing_fields.append(field)

    if missing_fields:
        return {"error": f"Missing or empty required field(s): {', '.join(missing_fields)}"}, 400
    return None
