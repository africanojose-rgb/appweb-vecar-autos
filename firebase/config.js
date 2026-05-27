var firebaseConfig = {
  apiKey: "AIzaSyDXHzQ0ZHo3plZ3UbXDGncpgMkKqp4XZsw",
  authDomain: "vercar-autos.firebaseapp.com",
  projectId: "vercar-autos",
  storageBucket: "vercar-autos.firebasestorage.app",
  messagingSenderId: "967994933227",
  appId: "1:967994933227:web:fed4898d1440aa6ee123ae"
};

firebase.initializeApp(firebaseConfig);

var auth = firebase.auth();
var db = firebase.firestore();
