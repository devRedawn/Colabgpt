# Firebase Setup Instructions

This document provides step-by-step instructions for setting up Firebase Authentication and Firestore for the OpenChat application.

## Firebase Authentication Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Navigate to "Authentication" in the left sidebar
4. Click on the "Sign-in method" tab
5. Enable "Email/Password" authentication:
   - Click on "Email/Password"
   - Toggle the "Enable" switch to the ON position
   - Click "Save"

## Firestore Database Setup

1. In the Firebase Console, navigate to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose either "Start in production mode" or "Start in test mode" (you'll add security rules later)
4. Select a location for your database (choose the region closest to your users)
5. Click "Enable"

## Security Rules Setup

1. In the Firestore Database section, click on the "Rules" tab
2. Replace the default rules with the contents of the `firestore.rules` file in this project
3. Click "Publish"

For testing purposes, we've included simplified security rules that allow authenticated users to read and write all documents. In a production environment, you would want to use more restrictive rules like:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // User rules
    match /users/{userId} {
      allow read, write: if isSignedIn() && isOwner(userId);
    }
    
    // Conversation rules
    match /conversations/{conversationId} {
      allow read, write: if isSignedIn() && isOwner(resource.data.userId);
    }
  }
}
```

## Firebase Configuration

1. In the Firebase Console, navigate to Project Settings (gear icon in the top left)
2. Scroll down to the "Your apps" section
3. If you haven't added a web app yet, click on the web icon (</>) to add one
4. Register your app with a nickname (e.g., "OpenChat")
5. Copy the Firebase configuration object
6. Update your `.env` file with these values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Testing Your Setup

1. Start your Next.js application with `npm run dev`
2. Navigate to the registration page
3. Create a new user account (this will automatically become the admin)
4. Verify that the user appears in the Firebase Authentication console
5. Check that user data is created in Firestore
6. Add your OpenAI API key in the profile section
7. Create a new chat to test the conversation functionality
8. As admin, try inviting a team member

## Troubleshooting

If you encounter issues:

1. **Authentication Errors**:
   - Ensure Email/Password authentication is enabled
   - Check browser console for specific error messages
   - Verify your Firebase configuration in `.env` matches the console

2. **Firestore Errors**:
   - Check that Firestore is enabled and initialized
   - Verify security rules are published
   - Look for permission denied errors in the browser console

3. **API Key Issues**:
   - Ensure the OpenAI API key is valid
   - Check that it's being properly stored in localStorage
   - Verify the API key is being passed to the OpenAI API calls