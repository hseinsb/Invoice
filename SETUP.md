# Firebase Project Setup Guide

This guide walks you through setting up the Firebase project for the Whittico Collision Invoice Management System.

## 🎯 Quick Start Checklist

- [ ] Create Firebase project
- [ ] Configure authentication
- [ ] Set up Firestore database
- [ ] Configure Cloud Storage
- [ ] Deploy Cloud Functions
- [ ] Set up hosting
- [ ] Create initial users
- [ ] Configure company settings

## 📋 Detailed Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Project name: `whitticocollision-invoices`
4. Disable Google Analytics (not needed)
5. Choose region: `us-central1` (closest to Michigan)

### 2. Configure Authentication

1. Go to **Authentication** > **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** (recommended):
   - Click Google provider
   - Enable it
   - Add your domain `whitticocollision.co` to authorized domains
   - Set hd parameter restriction in code (already configured)

### 3. Set Up Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in production mode"
4. Select location: `us-central1` (same as project)

### 4. Configure Cloud Storage

1. Go to **Storage**
2. Click "Get started"
3. Choose same location: `us-central1`
4. Security rules will be deployed via CLI

### 5. Deploy Firebase Configuration

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize project** (in your project directory):
   ```bash
   firebase init
   ```
   - Select: Firestore, Functions, Hosting, Storage
   - Use existing project: `whitticocollision-invoices`
   - Accept default settings

4. **Deploy security rules and functions**:
   ```bash
   # Deploy everything
   firebase deploy
   ```

### 6. Create Initial Users

#### Method 1: Firebase Console
1. Go to **Authentication** > **Users**
2. Click "Add user"
3. Enter email (must end with `@whitticocollision.co`)
4. Set temporary password
5. User will be prompted to change password on first login

#### Method 2: Invite via Google SSO
1. Users with `@whitticocollision.co` Google accounts can sign in directly
2. No additional setup required

### 7. Configure Company Settings

1. **Start local development**:
   ```bash
   npm run dev
   ```

2. **Sign in** with an admin user

3. **Go to Settings page** and configure:
   - Company legal name
   - Business address
   - Phone and email
   - Invoice prefix (e.g., "WC")
   - Starting invoice sequence number
   - Tax rate (6% for Michigan)
   - Default terms

4. **Upload company logo** (optional)

### 8. Create Sample Data

#### Create Test Customer
1. Go to **Customers** page
2. Click "Add Customer"
3. Fill in sample customer information

#### Create Test Invoice
1. Go to **Invoices** > "New Invoice"
2. Select the test customer
3. Add vehicle information
4. Add line items
5. Save as draft, then finalize to test numbering

## 🔐 Security Configuration

### Firebase Project Settings

1. **Go to Project Settings** (gear icon)
2. **General tab**:
   - Note down your config values for `.env` file
   - Set default GCP resource location to `us-central1`

3. **Service Accounts tab**:
   - Firebase Functions will use default service account
   - No additional configuration needed

### Domain Restrictions

The app is configured to only allow users from `whitticocollision.co` domain:
- Email/password users must have `@whitticocollision.co` email
- Google SSO is restricted to the business domain
- Domain validation happens in the authentication hook

## 🏗️ Environment Setup

### Local Development

1. **Copy environment template**:
   ```bash
   cp env.example .env
   ```

2. **Update `.env` with your Firebase config**:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=whitticocollision-invoices.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=whitticocollision-invoices
   VITE_FIREBASE_STORAGE_BUCKET=whitticocollision-invoices.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

3. **Install dependencies**:
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

### Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Firebase Hosting**:
   ```bash
   firebase deploy --only hosting
   ```

## 🎛️ Firebase Console Configuration

### Firestore Indexes

The required composite indexes are automatically created via `firestore.indexes.json`. Monitor the Firestore console for index creation status.

### Cloud Functions

Monitor function performance and logs:
1. Go to **Functions** in Firebase console
2. Check function execution logs
3. Monitor performance metrics

### Storage

Monitor file uploads and storage usage:
1. Go to **Storage** in Firebase console
2. Check uploaded files in `/branding/` and `/invoices/` folders

## 🚨 Common Setup Issues

### Authentication Issues
- **Problem**: Users can't sign in
- **Solution**: Check domain restrictions and Firebase config

### Permission Denied Errors
- **Problem**: Firestore operations fail
- **Solution**: Ensure security rules are deployed (`firebase deploy --only firestore`)

### Function Deployment Errors
- **Problem**: Cloud Functions not deploying
- **Solution**: Check Node.js version (requires Node 18) and function code

### Missing Indexes
- **Problem**: Firestore queries fail
- **Solution**: Deploy indexes (`firebase deploy --only firestore`)

## 📞 Support

If you encounter issues during setup:
1. Check the Firebase Console for error messages
2. Review browser console for client-side errors
3. Check Cloud Functions logs for server-side issues
4. Refer to the main README.md for troubleshooting tips

## ✅ Post-Setup Verification

After completing setup, verify:
- [ ] Users can sign in with business email
- [ ] Company settings can be updated
- [ ] Customers can be created
- [ ] Invoices can be created and finalized
- [ ] Invoice numbering works correctly
- [ ] Payments can be recorded
- [ ] CSV export works
- [ ] Print functionality works

Your Whittico Collision Invoice Management System is now ready for use! 🎉
