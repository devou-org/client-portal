# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Client & Admin Portal built with Next.js 14, TypeScript, Firebase Authentication, Firebase Firestore, and Vercel Blob Storage.

## Key Technologies
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth (Google login for clients, email-based admin access)
- **Database**: Firebase Firestore
- **File Storage**: Vercel Blob Storage
- **Deployment**: Vercel

## Project Structure
- `/src/app` - App Router pages and layouts
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions, Firebase config, and helpers
- `/src/types` - TypeScript type definitions
- `/src/contexts` - React contexts (AuthProvider)

## Authentication Flow
- **Clients**: Google OAuth login
- **Admins**: Login via predefined email list (no registration)
- **Context**: AuthProvider provides user, loading, and isAdmin states

## Database Schema (Firestore)
- `users/` - User profiles with references to projects, invoices, documents, requests
- `projects/` - Project information with status tracking
- `invoices/` - Invoice data with file links from Vercel Blob
- `documents/` - Document metadata with Vercel Blob file links
- `requests/` - Service requests with status management

## Key Features
- **Client Dashboard**: View projects, invoices, payments, documents, submit service requests
- **Admin Dashboard**: Full CRUD operations, user management, ticket system
- **Real-time Updates**: Live status changes for service requests
- **File Upload**: Vercel Blob integration for invoices and documents

## Coding Standards
- Use TypeScript for all files
- Follow Next.js App Router patterns
- Implement proper error handling and loading states
- Use Tailwind CSS for styling
- Create reusable components
- Implement proper data validation
- Use proper Firebase security rules
