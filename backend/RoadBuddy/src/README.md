## Adding a Car to User Profile
The `/add-car` endpoint allows authenticated users to add a car to their Firestore profile under the `cars` subcollection.

### **Endpoint**
- **URL**: `/add-car`
- **Methods**: `GET`, `POST`
- **Authentication**: Required

### **Request Details**

#### **GET Request**
- **Purpose**: Renders a form for users to input car details.
- **Response**: HTML form.

#### **POST Request**
- **Purpose**: Handles car creation by saving car details in the `cars` subcollection of the users profile

- **Request Body** (Form Data):
Each user has a **`cars` subcollection** containing individual **car documents**:

| Field          | Type    | Description                                      |
|---------------|--------|--------------------------------------------------|
| `make`        | String | The brand of the car                                 |
| `model`       | String | The model of the car                                 |
| `licensePlate`| String | The car's license plate number                       |
| `vin`         | String | The car's unique Vehicle Identification Number (VIN) |
| `year`        | Number | The car's manufacturing year                         |
| `color`       | String | The color of the car                                 |
| `isPrimary`   | Boolean | Whether the car is the **primary** car for the user |

### **Handling Primary Car Updates**
- if the user adds a ***new primary car***, the system automatically updates the previous primary car to `isPrimary: false`.
- Ensures only one car can be primary at a time.

### **Response Details**

#### **Successful POST Request**:
- **Status Code**: `201 Created`
- **Response Body** (JSON):
  ```json
  {
    "message": "Car added successfully",
    "car": {
        "make": "Toyota",
        "model": "Camry",
        "licensePlate": "ABC123",
        "vin": "1HGCM82633A123456",
        "year": 2022,
        "color": "Black",
        "isPrimary": true
    }
  }
  ```
#### **Duplicate Car Submission**:
- **Status Code**: `400 Bad Request`
- **Response Body** (JSON):
  ```json
  {
    "error": "Duplicate car detected"
  }
  ```

### **Firestore Structure for Cars Collection**
```
Firestore Root
│── users
│   ├── {userID1}
│   │   ├── name: “Banana Slug”
│   │   ├── email: “bananaslug@gmail.com”
│   │   ├── ridesPosted: []
│   │   ├── ridesJoined: []
│   │   ├── cars (Subcollection)
│   │   │   ├── {carID1}
│   │   │   │   ├── make: “Toyota”
│   │   │   │   ├── model: “Camry”
│   │   │   │   ├── licensePlate: “ABC123”
│   │   │   │   ├── vin: “1HGCM82633A123456”
│   │   │   │   ├── year: 2022
│   │   │   │   ├── color: “Black”
│   │   │   │   ├── isPrimary: true
```