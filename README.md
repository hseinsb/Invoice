# Whittico Collision Invoice Management System

A comprehensive invoice management system built with React, TypeScript, and Firebase for Whittico Collision. This system provides secure, authenticated access for managing customers, creating invoices, tracking payments, and generating reports.

## 🚀 Features

- **Authentication**: Email/password and Google SSO with domain restriction
- **Invoice Management**: Create, edit, finalize, and track invoices
- **Customer Database**: Manage customer information and insurance details
- **Payment Tracking**: Record and track payments with automatic balance calculation
- **PDF Generation**: Generate branded invoice PDFs
- **Secure Access**: Role-based access control with business domain restriction
- **Real-time Data**: Live updates with Firebase Firestore
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🏗️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Functions, Storage, Hosting)
- **Authentication**: Firebase Auth with business domain restriction
- **Database**: Cloud Firestore with comprehensive security rules
- **File Storage**: Firebase Cloud Storage for logos and PDFs
- **Build Tool**: Vite
- **Form Handling**: React Hook Form
- **Date Handling**: date-fns
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project with the following services enabled:
  - Authentication
  - Firestore Database
  - Cloud Storage
  - Cloud Functions
  - Hosting

## 🛠️ Setup Instructions

### 1. Firebase Project Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Project name: `whitticocollision-invoices`
3. Choose region: `us-central1` or `us-east1` (close to Michigan)
4. Disable Google Analytics (not needed for private tool)

### 2. Enable Firebase Services

#### Authentication
1. Go to Authentication > Sign-in method
2. Enable Email/Password
3. Enable Google (optional, recommended)
4. For Google SSO: Add `whitticocollision.co` to authorized domains

#### Firestore Database
1. Go to Firestore Database
2. Create database in production mode
3. Choose same region as your project (us-central1 or us-east1)

#### Cloud Storage
1. Go to Storage
2. Get started with default settings
3. Choose same region as your project

#### Cloud Functions
1. Functions will be deployed via Firebase CLI

### 3. Local Development Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd whitticocollision-invoices
   npm install
   ```

2. **Install Functions Dependencies**
   ```bash
   cd functions
   npm install
   cd ..
   ```

3. **Firebase Configuration**
   ```bash
   firebase login
   firebase use --add  # Select your project
   ```

4. **Environment Variables**
   - Copy `env.example` to `.env`
   - Update Firebase configuration values from your project settings

5. **Deploy Firebase Configuration**
   ```bash
   # Deploy Firestore rules and indexes
   firebase deploy --only firestore

   # Deploy Storage rules
   firebase deploy --only storage

   # Deploy Cloud Functions
   firebase deploy --only functions
   ```

6. **Initialize Company Settings**
   - Run the app locally: `npm run dev`
   - Navigate to Settings page and configure company information

### 4. Production Deployment

```bash
# Build and deploy everything
npm run build
firebase deploy
```

## 🔐 Security Features

### Authentication Policy
- Only users with `@whitticocollision.co` email addresses can access the system
- Google SSO restricted to business domain
- No public sign-ups allowed

### Firestore Security Rules
- All operations require authentication
- Server-only fields protected (invoice numbers, sequences)
- Audit trails enforced (createdAt, updatedAt)
- Role-based access can be extended

### Storage Security Rules
- Only authenticated users can access files
- Separate folders for branding and invoices
- No public file access

## 📊 Data Structure

### Collections

#### `/settings/company`
- Company profile information
- Invoice numbering configuration
- Tax settings and terms

#### `/customers/{customerId}`
- Customer contact information
- Insurance company details
- Address information

#### `/invoices/{invoiceId}`
- Invoice header data (dates, customer, vehicle)
- Line items with quantities and pricing
- Payment history and balance tracking
- Status workflow (draft → finalized → paid)

#### `/users/{uid}` (Optional)
- User profile and role information

## 🔧 Key Functions

### Invoice Numbering
- Automatic sequential numbering via Cloud Function
- Format: `WC-YYYY-#####` (configurable prefix)
- Atomic increment prevents duplicate numbers

### Payment Processing
- Record payments with multiple methods
- Automatic balance calculation
- Status updates (finalized → partial → paid)

### PDF Generation
- Server-side PDF generation (planned)
- Print-optimized HTML views available

## 👥 User Management

### Adding Users
1. Go to Firebase Console > Authentication > Users
2. Add user with email/password
3. Ensure email domain is `@whitticocollision.co`
4. Users can also sign up via Google SSO (if enabled)

### User Roles
- **Owner**: Full access to all features
- **Staff**: Standard invoice and customer management

## 📈 Operational Procedures

### Creating Invoices
1. Navigate to Invoices > New Invoice
2. Select customer (create new if needed)
3. Add vehicle and claim information
4. Add line items with labor/parts
5. Save as draft or finalize immediately

### Invoice Lifecycle
1. **Draft**: Editable, no invoice number assigned
2. **Finalized**: Invoice number assigned, totals calculated
3. **Partial**: Partial payment received
4. **Paid**: Full payment received

### Payment Recording
1. Open finalized invoice
2. Click "Record Payment"
3. Enter amount, method, and date
4. System automatically updates balance and status

### Monthly Reports
1. Go to Invoices page
2. Filter by date range or status
3. Click "Export CSV" for accounting records

## 🔄 Backup and Recovery

### Automated Backups
- Firestore automatically backs up data
- Cloud Functions can export data to Storage (optional)

### Manual Export
- Use CSV export feature for invoice data
- Firebase Console provides database export options

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check domain restriction settings
   - Verify Firebase config values

2. **Permission Denied**
   - Ensure Firestore rules are deployed
   - Check user authentication status

3. **Invoice Numbering Issues**
   - Verify Cloud Functions are deployed
   - Check function logs in Firebase Console

### Getting Help
- Check browser console for detailed error messages
- Review Firebase Console logs
- Contact system administrator

## 🔧 Maintenance

### Regular Tasks
- Monitor Firebase usage and billing
- Review user access quarterly
- Update dependencies monthly
- Backup critical data monthly

### Scaling Considerations
- Current setup supports hundreds of concurrent users
- Firestore scales automatically
- Consider Cloud Functions concurrency for high volume

## 📝 License

Private software for Whittico Collision. All rights reserved.

## 🤝 Support

For technical support or feature requests, contact the development team or system administrator.
