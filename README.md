# MoneyMate — Personal Finance Dashboard

MoneyMate is a sleek, modern personal finance dashboard that helps you manage your bills, income, expenses, and financial records all in one place. It features user authentication with Firebase, dynamic charts with Chart.js, and real-time data syncing using Firestore. Designed to be mobile-friendly and easy to use, MoneyMate is perfect for anyone wanting a straightforward way to track their money.

---

## Features

- **User Authentication** powered by Firebase Auth  
- **Secure Data Storage** in Firebase Firestore, tied to each user  
- Add, edit, delete **Income**, **Expenses**, and **Bills**  
- Real-time **financial stats** and **doughnut chart** visualization  
- Export and import your data as JSON files  
- Responsive design for desktop and mobile  
- Dark mode toggle for eye comfort  
- Bill reminders and notifications (planned for future)  
- Intuitive sidebar navigation and modal forms  

---

## Installation & Setup

1. Clone or download this repo.  
2. Create a Firebase project at [firebase.google.com](https://firebase.google.com) and enable Authentication (Email/Password) and Firestore database.  
3. Update the `firebaseConfig` object in the HTML/JS with your Firebase project credentials.  
4. Adjust Firestore security rules to restrict access to authenticated users only:
   ```js
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/records/{recordId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
