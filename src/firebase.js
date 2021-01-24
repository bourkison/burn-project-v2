import firebase from 'firebase'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
var firebaseConfig = {
    apiKey: "AIzaSyD34Lvj0Q-Wm0o9CULDKXucRw_eLSnPnBE",
    authDomain: "burn-project-f8493.firebaseapp.com",
    projectId: "burn-project-f8493",
    storageBucket: "burn-project-f8493.appspot.com",
    messagingSenderId: "737450034110",
    appId: "1:737450034110:web:c526ade8c43730adf02fef",
    measurementId: "G-P5MMTY71BB"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

const userCollection = db.collection("users");
const exerciseCollection = db.collection("exercises");

// Function waits for login to happen, and is called in guarded routes.
// Fixes the problem of instantly getting redirected on guarded routes when
// firebase hasn't had time to log in yet.
firebase.getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user)
        }, reject);
    })
};

export { db, auth, userCollection, exerciseCollection, storage }