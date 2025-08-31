# 🔥 Firebase Setup Guide

This guide will help you set up Firebase for authentication and Firestore database in your Astro Oracle app.

## 🎯 What We're Setting Up

1. **Firebase Authentication** - Email/password and Google sign-in
2. **Firestore Database** - Store user data, Kundli, and question history
3. **Security Rules** - Protect your data

## 🛠️ Step-by-Step Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `astro-oracle` (or your preferred name)
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**:
   - Click "Email/Password"
   - Toggle "Enable"
   - Click "Save"
3. Enable **Google**:
   - Click "Google"
   - Toggle "Enable"
   - Add your authorized domain (localhost for development)
   - Click "Save"

### 3. Set Up Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** (we'll add security rules later)
3. Select a location close to your users
4. Click "Done"

### 4. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Click **Web** icon (</>)
4. Register app with name: `astro-oracle-web`
5. Copy the configuration object

### 5. Update Environment Variables

Create `.env` file in your project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Other configurations...
VITE_PROKERALA_API_KEY=your_prokerala_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_BACKEND_URL=http://localhost:3001
```

### 6. Set Up Firestore Security Rules

Go to **Firestore Database** → **Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Kundli data - users can only access their own
    match /kundlis/{kundliId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Question history - users can only access their own
    match /question_history/{historyId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### 7. Create Firestore Indexes (Optional)

For better query performance, create these indexes in **Firestore Database** → **Indexes**:

**Collection:** `kundlis`
- Fields: `userId` (Ascending), `createdAt` (Descending)

**Collection:** `question_history`
- Fields: `userId` (Ascending), `createdAt` (Descending)
- Fields: `userId` (Ascending), `questionCategory` (Ascending), `createdAt` (Descending)

## 🔧 Testing the Setup

### 1. Test Authentication
```bash
# Start your app
npm run dev

# Try to sign up with email/password
# Try to sign in with Google
```

### 2. Test Firestore
- Generate a Kundli
- Check Firestore Database to see if data is stored
- Ask questions and check if history is saved

### 3. Check Console for Errors
- Open browser DevTools
- Look for any Firebase-related errors

## 🚀 Production Deployment

### 1. Update Security Rules
For production, update Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // More restrictive rules for production
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId &&
        request.auth.token.email_verified == true;
    }
    
    match /kundlis/{kundliId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId &&
        request.auth.token.email_verified == true;
    }
    
    match /question_history/{historyId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId &&
        request.auth.token.email_verified == true;
    }
  }
}
```

### 2. Enable Email Verification
1. Go to **Authentication** → **Settings**
2. Enable "Email verification"
3. Customize email templates if needed

### 3. Set Up Custom Domain
1. Go to **Authentication** → **Settings**
2. Add your production domain to authorized domains

### 4. Monitor Usage
- Go to **Usage and billing** to monitor API calls
- Set up alerts for quota limits

## 🔒 Security Best Practices

1. **Never expose Firebase config in client-side code** (it's okay for web apps, but be careful)
2. **Use security rules** to protect your data
3. **Enable email verification** for production
4. **Monitor authentication attempts** in Firebase Console
5. **Regularly review security rules**

## 🐛 Troubleshooting

### Common Issues

1. **"Firebase App not initialized"**
   - Check if Firebase config is correct
   - Ensure all environment variables are set

2. **"Permission denied"**
   - Check Firestore security rules
   - Verify user is authenticated

3. **"Google sign-in not working"**
   - Check authorized domains in Firebase Console
   - Verify Google OAuth is enabled

4. **"Cannot read properties of undefined"**
   - Check if user object exists before accessing properties
   - Add proper null checks

### Debug Mode
Add this to your Firebase config for debugging:

```javascript
// In src/lib/firebase.ts
if (import.meta.env.DEV) {
  console.log('Firebase config:', firebaseConfig);
}
```

## 📚 Next Steps

1. **Set up Firebase Analytics** (optional)
2. **Configure Firebase Hosting** for deployment
3. **Set up Firebase Functions** for server-side logic
4. **Add Firebase Performance Monitoring**

---

**Your Firebase setup is complete! 🔥**

Your app now has:
- ✅ Secure authentication (email/password + Google)
- ✅ Real-time database with Firestore
- ✅ User data protection with security rules
- ✅ Scalable cloud infrastructure
