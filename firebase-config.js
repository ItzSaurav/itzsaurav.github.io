// Firebase Configuration for Portfolio Visitor Tracking
// Replace the placeholder values below with your Firebase Project Configuration from the Firebase Console (https://console.firebase.google.com/)
// 1. Create a Firebase project
// 2. Add a Web App
// 3. Create a Cloud Firestore database (in test mode or production with open writes for 'portfolio_visits')
// 4. Paste your firebaseConfig values here or configure them via the Analytics Dashboard UI.

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Check if Firebase is properly configured with real keys
function isFirebaseConfigured() {
    // Check if user saved custom config in localStorage from the UI
    const savedConfig = localStorage.getItem('custom_firebase_config');
    if (savedConfig) {
        try {
            const parsed = JSON.parse(savedConfig);
            if (parsed.projectId && parsed.projectId !== "YOUR_PROJECT_ID" && parsed.apiKey !== "YOUR_API_KEY") {
                return parsed;
            }
        } catch (e) {
            console.error("Invalid saved Firebase config in localStorage:", e);
        }
    }

    // Check code-level config
    if (firebaseConfig.projectId && firebaseConfig.projectId !== "YOUR_PROJECT_ID" && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        return firebaseConfig;
    }

    return null;
}

// Global accessor
window.PORTFOLIO_FIREBASE_CONFIG = firebaseConfig;
window.isFirebaseConfigured = isFirebaseConfigured;
