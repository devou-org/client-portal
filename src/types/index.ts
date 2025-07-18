// User types
export interface User {
  uid: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  projects: string[];
  invoices: string[];
  documents: string[];
  requests: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Project types
export interface Project {
  uid: string;
  project_name: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  start_date: Date;
  end_date: Date;
  budget?: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Invoice types
export interface Invoice {
  uid: string;
  invoice_name: string;
  invoiceNumber?: string; // Add alternative property name
  amount: number;
  status: 'paid' | 'pending' | 'due' | 'overdue';
  file_link?: string;
  fileUrl?: string; // Add alternative property name
  due_date?: Date;
  dueDate?: Date; // Add alternative property name
  paid_date?: Date;
  description?: string;
  clientId?: string; // Add client assignment
  createdAt?: Date;
  updatedAt?: Date;
}

// Document types
export interface Document {
  uid: string;
  name: string;
  filename: string;
  file_link: string;
  file_size?: number;
  file_type?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Request/Ticket types
export interface ServiceRequest {
  uid: string;
  user_id: string;
  name: string;
  email?: string; // Add optional email field for display purposes
  request: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Payment summary types
export interface PaymentSummary {
  totalPaid: number;
  pending: number;
  due: number;
  overdue: number;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Firebase document types (for Firestore)
export interface FirebaseUser extends Omit<User, 'uid'> {
  id?: string;
}

export interface FirebaseProject extends Omit<Project, 'uid'> {
  id?: string;
}

export interface FirebaseInvoice extends Omit<Invoice, 'uid'> {
  id?: string;
}

export interface FirebaseDocument extends Omit<Document, 'uid'> {
  id?: string;
}

export interface FirebaseServiceRequest extends Omit<ServiceRequest, 'uid'> {
  id?: string;
}

// Form types
export interface CreateProjectForm {
  project_name: string;
  status: Project['status'];
  start_date: string;
  end_date: string;
  description?: string;
}

export interface CreateInvoiceForm {
  invoice_name: string;
  amount: number;
  status: Invoice['status'];
  due_date?: string;
  description?: string;
  file?: File;
}

export interface CreateDocumentForm {
  name: string;
  description?: string;
  file: File;
}

export interface CreateServiceRequestForm {
  name: string;
  request: string;
  description: string;
  priority?: ServiceRequest['priority'];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// File upload types
export interface FileUploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}
