# Client & Admin Portal

A comprehensive portal built with Next.js 14, Firebase, and Vercel Blob Storage for managing clients, projects, invoices, documents, and service requests.

## Features

### 🔐 Authentication

- **Google OAuth** for client login
- **Admin access** via predefined email list
- **Role-based routing** (Client vs Admin dashboards)

### 👤 Client Dashboard

- View assigned projects with status tracking
- Access invoices with payment status
- Download documents and files
- Submit service requests with priority levels
- Real-time status updates on requests
- Payment summary (Paid, Pending, Due, Overdue)

### 🛠️ Admin Dashboard

- Complete user management and overview
- Full CRUD operations for projects, invoices, and documents
- Ticket management system with drag-and-drop status updates
- File upload management via Vercel Blob
- Real-time ticket status synchronization
- Revenue and activity analytics

### 📊 Data Management

- **Projects**: Create, assign, and track project progress
- **Invoices**: Generate invoices with file attachments
- **Documents**: Upload and share files with clients
- **Service Requests**: Ticket system with status workflow (Todo → In Progress → Done)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Authentication**: Firebase Auth (Google OAuth)
- **Database**: Firebase Firestore
- **File Storage**: Vercel Blob Storage
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Lucide React
- **Deployment**: Vercel

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd clientportal
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication and select Google as provider
3. Create a Firestore database
4. Get your Firebase configuration from Project Settings

### 3. Vercel Blob Setup

1. Create a Vercel account if you don't have one
2. Create a new Blob store in your Vercel dashboard
3. Get your Blob read/write token

### 4. Environment Variables

Update `.env.local` file with your credentials:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Admin emails (comma-separated)
NEXT_PUBLIC_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Key Features Implemented

✅ Firebase Authentication with Google OAuth  
✅ Role-based access control (Client/Admin)  
✅ Client Dashboard with project/invoice overview  
✅ Service request submission system  
✅ Admin Dashboard with user management  
✅ Real-time ticket status updates  
✅ File upload system with Vercel Blob  
✅ Responsive design with Tailwind CSS  
✅ TypeScript throughout the application

## Database Schema

The application uses Firestore with the following collections:

- `users/` - User profiles and references
- `projects/` - Project information and status
- `invoices/` - Invoice data with file links
- `documents/` - Document metadata with file storage
- `requests/` - Service requests with status tracking

## Next Steps

To complete the implementation:

1. Configure Firebase project and authentication
2. Set up Vercel Blob storage
3. Update environment variables
4. Deploy to Vercel
5. Test with real users and admin accounts

This portal provides a solid foundation for client-admin interactions with real-time updates, file management, and comprehensive dashboard views.
