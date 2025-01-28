# RoadBuddy

## Getting Started

### 1. Clone the repository
```bash
git clone git@github.com:trnguyen34/RoadBuddy.git
cd RoadBuddy
```

### 2. Create a python3.10 virtual environments and activate it
```bash
python3.10 -m venv .venv
source .venv/bin/activate
```

### 3.Install dependencies
```bash
pip3 install -r requirements.txt
```

### 4. Create a environment variable
```bash
echo "SECRET_KEY=nasdbjwefudsvkjwefoui" > .env
```

### 5. Run the application
```bash
python3 app.py
```

## **Posting a Ride**

The `/post-ride` endpoint allows authenticated users to post rides to the carpooling application. This endpoint accepts both `GET` and `POST` requests.

### **Endpoint**
- **URL**: `/post-ride`
- **Methods**: `GET`, `POST`
- **Authentication**: Required

---

### **Request Details**

#### **GET Request**
- **Purpose**: Renders a form for users to input ride details.
- **Response**: HTML form.

#### **POST Request**
- **Purpose**: Handles ride creation by saving ride details to Firestore and updating the user's profile with the ride ID.

- **Request Body** (Form Data):
  | Field            | Type    | Description                          |
  |------------------|---------|--------------------------------------|
  | `from`           | String  | The starting location of the ride.  |
  | `to`             | String  | The destination of the ride.        |
  | `date`           | Date    | The date of the ride.               |
  | `departure_time` | Time    | The departure time of the ride.     |
  | `max_passengers` | Integer | Maximum number of passengers allowed.|
  | `cost`           | Float   | Cost per passenger.                 |

---

### **Response Details**

#### **Successful POST Request**:
- **Status Code**: `201 Created`
- **Response Body** (JSON):
  ```json
  {
    "message": "Ride posted successfully",
    "ride": {
      "ownerID": "user123",
      "ownerName": "Banana Slug",
      "from": "San Jose",
      "to": "Santa Cruz",
      "date": "2025-02-15",
      "departureTime": "08:00",
      "maxPassengers": 4,
      "cost": 20.0,
      "currentPassengers": [],
      "status": "open"
    }
  }
  ```

  ---

### **Firestore Structure**

1. **`rides` Collection**
   Each ride is stored as a document in the `rides` collection:
   ```json
   {
     "ownerID": "user123",
     "ownerName": "Banana Slug",
     "from": "San Jose",
     "to": "Santa Cruz",
     "date": "2025-02-15",
     "departureTime": "08:00",
     "maxPassengers": 3,
     "cost": 10.0,
     "currentPassengers": [],
     "status": "open"
   }
   ```

2. **`users` Collection**
   The user's document is updated with the `ridesPosted` field:
   ```json
   {
     "name": "Banana Slug",
     "ridesPosted": ["rideID123"]
   }
   ```