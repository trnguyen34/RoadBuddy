import axios from "axios";

// 🔹 Change 'localhost' to your computer's IP if using a real device
const BASE_URL = "http://127.0.0.1:8090"; // Replace with your Flask server IP

export const fetchIndex = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    return null;
  }
};