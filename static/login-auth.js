import { auth, provider } from "./firebase-config.js";

import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent form submission

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const errorMessageEl = document.getElementById("error-message");

    try {
        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get ID token and send to backend
        const idToken = await user.getIdToken();
        loginUser(user, idToken);

        console.log("User signed in: ", user);
    } catch (error) {
        // Handle errors and display messages
        const errorCode = error.code;
        errorMessageEl.textContent = "Incorrect email/password. Please try again.";
        console.error("Login error: ", error.message);
    }
});

function loginUser(user, idToken) {
    fetch('/auth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        credentials: 'same-origin',
    })
        .then((response) => {
            if (response.ok) {
                window.location.href = '/home';
            } else {
                document.getElementById("error-message").textContent = "Failed to login. Please try again.";
                console.error('Backend login failed.');
            }
        })
        .catch((error) => {
            document.getElementById("error-message").textContent = "An error occurred. Please try again.";
            console.error('Error with Fetch operation: ', error);
        });
}
