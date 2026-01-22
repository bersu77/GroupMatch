# Firebase Setup Guide

This guide will walk you through setting up Firebase Authentication and Firestore in your Next.js project.

## Prerequisites

1. A Firebase project created at [Firebase Console](https://console.firebase.google.com/)
2. Firebase Authentication and Firestore enabled in your Firebase project

## Step 1: Install Dependencies

```bash
npm install firebase
```

## Step 2: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. If you don't have a web app yet, click "Add app" and select the web icon `</>`
7. Copy the configuration values from the Firebase SDK snippet

## Step 3: Set Up Environment Variables

Create a `.env.local` file in the root of your project with the following:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Replace the placeholder values with your actual Firebase configuration values.

## Step 4: Enable Firebase Services

### Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started" if prompted
3. Go to "Sign-in method" tab
4. Enable "Email/Password" authentication (and any other methods you want to use)

### Enable Firestore

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development) or "Start in production mode" (for production)
4. Select a location for your database
5. Click "Enable"

### Enable Storage (for group/member photos)

1. In Firebase Console, go to **"Storage"** (in the left sidebar under **Build**)
2. Click **"Get started"**
3. When the security rules modal appears:
   - Select **"Start in test mode"** (allows authenticated users to read/write)
   - Click **"Next"**
4. Choose a **location** for your Storage bucket (use the same region as Firestore if possible)
5. Click **"Done"**
6. Wait for setup to finish (usually 10–30 seconds)
7. You should see "Your Cloud Storage is ready to use"

**Optional – Check rules:** Go to the **Rules** tab and ensure you have:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Storage is used in GroupMatch for group photos and member photos when creating a group.

## Step 5: Usage Examples

### Using Authentication

```tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { user, signIn, signUp, logout, loading } = useAuth();

  const handleSignUp = async () => {
    try {
      await signUp('user@example.com', 'password123', 'John Doe');
      console.log('User signed up successfully');
    } catch (error) {
      console.error('Sign up error:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn('user@example.com', 'password123');
      console.log('User signed in successfully');
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.email}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div>
          <button onClick={handleSignUp}>Sign Up</button>
          <button onClick={handleSignIn}>Sign In</button>
        </div>
      )}
    </div>
  );
}
```

### Using Firestore

```tsx
'use client';

import { useState, useEffect } from 'react';
import { createDocument, getDocument, getCollection } from '@/lib/firebase/firestore';

interface UserData {
  id?: string;
  email: string;
  displayName?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);

  // Create a user document
  const createUser = async () => {
    try {
      await createDocument('users', 'user123', {
        email: 'user@example.com',
        displayName: 'John Doe',
      });
      console.log('User created');
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  // Get a single user
  const getUser = async () => {
    try {
      const user = await getDocument<UserData>('users', 'user123');
      console.log('User:', user);
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  // Get all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await getCollection<UserData>('users');
        setUsers(allUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div>
      <button onClick={createUser}>Create User</button>
      <button onClick={getUser}>Get User</button>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.displayName} - {user.email}</li>
        ))}
      </ul>
    </div>
  );
}
```

## File Structure

```
src/
├── lib/
│   └── firebase/
│       ├── config.ts      # Firebase initialization
│       ├── auth.ts        # Authentication functions
│       └── firestore.ts   # Firestore helper functions
└── contexts/
    └── AuthContext.tsx    # React context for authentication state
```

## Available Functions

### Authentication (`@/lib/firebase/auth`)
- `signUp(email, password, displayName?)` - Create a new user account
- `signIn(email, password)` - Sign in with email and password
- `logout()` - Sign out the current user
- `resetPassword(email)` - Send password reset email
- `getCurrentUser()` - Get the current authenticated user

### Firestore (`@/lib/firebase/firestore`)
- `createDocument(collection, id, data)` - Create a new document
- `getDocument(collection, id)` - Get a document by ID
- `updateDocument(collection, id, data)` - Update a document
- `deleteDocument(collection, id)` - Delete a document
- `getCollection(collection, constraints?)` - Get all documents from a collection
- `getDocumentsByField(collection, field, value, orderBy?, direction?)` - Query documents by field

### Auth Context (`@/contexts/AuthContext`)
- `useAuth()` - React hook to access authentication state and functions
  - `user` - Current user object or null
  - `loading` - Loading state
  - `signIn(email, password)` - Sign in function
  - `signUp(email, password, displayName?)` - Sign up function
  - `logout()` - Logout function
  - `resetPassword(email)` - Password reset function

## Security Rules (Firestore)

For production, make sure to set up proper Firestore security rules. Example rules for authenticated users:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Add more rules for your collections here
  }
}
```

## Next Steps

- Set up Firestore security rules for production
- Add more authentication methods (Google, GitHub, etc.)
- Create type definitions for your Firestore documents
- Add error handling and user feedback in your UI
- Implement protected routes using the AuthContext

