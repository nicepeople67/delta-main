const firebaseConfig = {
    apiKey: "AIzaSyAaHeMAY83A4xH8u6-r58VsFCPvzvWNq5E",
    authDomain: "delta-42a39.firebaseapp.com",
    databaseURL: "https://delta-42a39-default-rtdb.firebaseio.com",
    projectId: "delta-42a39",
    storageBucket: "delta-42a39.firebasestorage.app",
    messagingSenderId: "195563321584",
    appId: "1:195563321584:web:e165313415041461cdaa35",
    measurementId: "G-RH60HFPM0N"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

console.log('Firebase app initialized');
if (firebase.auth) {
    firebase.auth().onAuthStateChanged((u) => {
        if (!u) {
            firebase.auth().signInAnonymously().catch(e => console.warn('Anonymous sign-in failed:', e));
        }
    });
}

window.firebaseInitialized = true;
