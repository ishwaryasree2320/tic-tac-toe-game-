# 🔷 Tic-Tac-Toe Multiplayer Game (Firebase Powered)

A modern, real-time multiplayer Tic-Tac-Toe game with Firebase — play against a friend using private rooms, or challenge the AI. Styled with glowing neon glassmorphism and built with JavaScript and Firebase Realtime Database.

---

## 🚀 Features

- ✅ **Single Player (vs Computer)**
- ✅ **Pass and Play Mode**
- ✅ **Private Room Multiplayer (Realtime)**
- ✅ Round-based scoring (up to 5 rounds)
- ✅ Win/Tie detection with score tracking
- ✅ Secure turn-based logic (no cheating)
- ✅ Firebase Authentication (Login/Signup)
- ✅ Light/Dark Theme toggle

---

## 🧪 Technologies Used

- HTML, CSS, JavaScript  
- Firebase Realtime Database  
- Firebase Authentication  
- Vanilla JS DOM Manipulation  
- Responsive UI Design

---

## 📦 Folder Structure

```
/tic-tac-toe-game
│
├── index.html          # Main homepage with game modes
├── login.html          # Login page (styled)
├── signup.html         # Signup page
├── game.js             # Game logic for single & pass-and-play
├── room.js             # Real-time multiplayer logic
├── auth.js             # Login/Signup/Firebase auth logic
├── style.css           # Glowing neon theme
└── README.md           # This file
```

---

## 🔧 How to Run Locally

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/tic-tac-toe-game.git
   cd tic-tac-toe-game
   ```

2. **Setup Firebase**

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable **Authentication → Email/Password**
   - Enable **Realtime Database**
   - Firebase config in `auth.js`:
     
 ```js
   const firebaseConfig = {
  apiKey: "AIzaSyB2nEoXogVVvUqMqhO9TSJP5U_2PtJEC3k",
  authDomain: "tic-tac-toe-a0983.firebaseapp.com",
  databaseURL: "https://tic-tac-toe-a0983-default-rtdb.firebaseio.com",
  projectId: "tic-tac-toe-a0983",
  storageBucket: "tic-tac-toe-a0983.firebasestorage.app",
  messagingSenderId: "520288503873",
  appId: "1:520288503873:web:c87075174e902896e41ec0",
  measurementId: "G-L4FQE7H1QT"
 };
 ```
  

3. **Open with Live Server**
   - Use VS Code and open `index.html` with Live Server

---

## 🌐 Hosting on GitHub Pages

1. Push your code to GitHub
2. Go to Repo → Settings → Pages
3. Set source to `main` branch and root
4. Visit the live link

---

## 📸 Screenshots
###### signup page
<img hieght ="150" width="150" src="https://github.com/ishwaryasree2320/tic-tac-toe-game-/blob/main/assests/Screenshot%20(287).png?raw=true"/>

###### Login page
<img hieght ="150" width="150" src="https://github.com/ishwaryasree2320/tic-tac-toe-game-/blob/main/assests/Screenshot%20(288).png?raw=true"/>

###### Home page
<img hieght ="150" width="150" src="https://github.com/ishwaryasree2320/tic-tac-toe-game-/blob/main/assests/Screenshot%20(289).png?raw=true"/>

---
## 🙌 Credits

Built by **Ishwarya sree v** using Firebase & 💻 pure JavaScript.

---

## 📫 Contact Me

📧 Email: ishwaryasree.work@gmail.com 
🔗 LinkedIn: [linkedin.com/in/ishwarya-sree-v](https://www.linkedin.com/in/contactishwarya?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app)

Feel free to reach out for collaborations, feedback, or new opportunities!
