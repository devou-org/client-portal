import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { safeToDate } from '@/lib/timestamp-utils';
import {
  User,
  Project,
  Invoice,
  Document,
  ServiceRequest,
  PaymentSummary,
  FirebaseUser,
  FirebaseProject,
  FirebaseInvoice,
  FirebaseDocument,
  FirebaseServiceRequest,
} from '@/types';

// Utility function to convert Firestore timestamps to Date objects
const convertTimestamps = (data: Record<string, unknown>) => {
  const converted = { ...data };
  Object.keys(converted).forEach(key => {
    if (converted[key] && typeof converted[key] === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      converted[key] = safeToDate(converted[key] as any) || converted[key];
    }
  });
  return converted;
};

// User Services
export const userService = {
  async getUser(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = convertTimestamps(userDoc.data());
        return { uid: userDoc.id, ...data } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  async getAllUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(query(usersRef, orderBy('name')));
      return snapshot.docs.map(doc => {
        const data = convertTimestamps(doc.data());
        return { uid: doc.id, ...data } as User;
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  },

  async updateUser(uid: string, data: Partial<FirebaseUser>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async deleteUser(uid: string): Promise<void> {
    try {
      // Delete user document from Firestore
      const userRef = doc(db, 'users', uid);
      await deleteDoc(userRef);
      
      // Note: This only deletes the user document from Firestore.
      // To delete from Firebase Authentication, you would need Firebase Admin SDK
      // or the user would need to delete their own account while authenticated.
      
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  async deleteUserAndCleanup(uid: string): Promise<void> {
    try {
      // Get user data first to understand what needs cleanup
      const user = await this.getUser(uid);
      if (!user) {
        throw new Error('User not found');
      }

      // Create a batch for atomic operations
      const batch = writeBatch(db);

      // Delete user document
      const userRef = doc(db, 'users', uid);
      batch.delete(userRef);

      // Clean up user's projects (remove user from project references)
      if (user.projects && user.projects.length > 0) {
        for (const projectId of user.projects) {
          // You might want to delete the project or reassign it
          // For now, we'll leave projects but remove user reference
          console.log(`Project ${projectId} needs manual cleanup`);
        }
      }

      // Clean up user's service requests
      if (user.requests && user.requests.length > 0) {
        for (const requestId of user.requests) {
          const requestRef = doc(db, 'requests', requestId);
          batch.delete(requestRef);
        }
      }

      // Commit the batch
      await batch.commit();
      
    } catch (error) {
      console.error('Error deleting user and cleanup:', error);
      throw error;
    }
  },
};

// Project Services
export const projectService = {
  async getUserProjects(userUid: string): Promise<Project[]> {
    try {
      const user = await userService.getUser(userUid);
      if (!user || !user.projects.length) return [];

      const projects: Project[] = [];
      for (const projectId of user.projects) {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          const data = convertTimestamps(projectDoc.data());
          projects.push({ uid: projectDoc.id, ...data } as Project);
        }
      }
      return projects;
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw error;
    }
  },

  async getAllProjects(): Promise<Project[]> {
    try {
      const projectsRef = collection(db, 'projects');
      const snapshot = await getDocs(query(projectsRef, orderBy('createdAt', 'desc')));
      return snapshot.docs.map(doc => {
        const data = convertTimestamps(doc.data());
        return { uid: doc.id, ...data } as Project;
      });
    } catch (error) {
      console.error('Error getting all projects:', error);
      throw error;
    }
  },

  async createProject(projectData: Omit<FirebaseProject, 'id'>): Promise<string> {
    try {
      const projectsRef = collection(db, 'projects');
      const docRef = await addDoc(projectsRef, {
        ...projectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  async updateProject(uid: string, data: Partial<FirebaseProject>): Promise<void> {
    try {
      const projectRef = doc(db, 'projects', uid);
      await updateDoc(projectRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  async deleteProject(uid: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'projects', uid));
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  async assignProjectToUser(projectId: string, userUid: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Add project to user's projects array
      const userRef = doc(db, 'users', userUid);
      const user = await userService.getUser(userUid);
      if (user && !user.projects.includes(projectId)) {
        batch.update(userRef, {
          projects: [...user.projects, projectId],
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error assigning project to user:', error);
      throw error;
    }
  },
};

// Invoice Services
export const invoiceService = {
  async getUserInvoices(userUid: string): Promise<Invoice[]> {
    try {
      const user = await userService.getUser(userUid);
      if (!user || !user.invoices.length) return [];

      const invoices: Invoice[] = [];
      for (const invoiceId of user.invoices) {
        const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
        if (invoiceDoc.exists()) {
          const data = convertTimestamps(invoiceDoc.data());
          invoices.push({ uid: invoiceDoc.id, ...data } as Invoice);
        }
      }
      return invoices;
    } catch (error) {
      console.error('Error getting user invoices:', error);
      throw error;
    }
  },

  async getAllInvoices(): Promise<Invoice[]> {
    try {
      const invoicesRef = collection(db, 'invoices');
      const snapshot = await getDocs(query(invoicesRef, orderBy('createdAt', 'desc')));
      return snapshot.docs.map(doc => {
        const data = convertTimestamps(doc.data());
        return { uid: doc.id, ...data } as Invoice;
      });
    } catch (error) {
      console.error('Error getting all invoices:', error);
      throw error;
    }
  },

  async createInvoice(invoiceData: Omit<FirebaseInvoice, 'id'>): Promise<string> {
    try {
      console.log('Creating invoice with data:', invoiceData);
      
      // Clean the data to remove undefined values
      const cleanedData: Record<string, unknown> = {};
      Object.keys(invoiceData).forEach(key => {
        const value = (invoiceData as Record<string, unknown>)[key];
        if (value !== undefined) {
          cleanedData[key] = value;
        }
      });
      
      console.log('Cleaned invoice data:', cleanedData);
      
      // Ensure required fields have default values
      const invoiceToSave = {
        ...cleanedData,
        file_link: cleanedData.file_link || '', // Default to empty string instead of undefined
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      console.log('Final invoice data to save:', invoiceToSave);
      
      const invoicesRef = collection(db, 'invoices');
      const docRef = await addDoc(invoicesRef, invoiceToSave);
      console.log('Invoice created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  async updateInvoice(uid: string, data: Partial<FirebaseInvoice>): Promise<void> {
    try {
      const invoiceRef = doc(db, 'invoices', uid);
      await updateDoc(invoiceRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  },

  async deleteInvoice(uid: string): Promise<void> {
    try {
      console.log('=== DELETING INVOICE ===');
      console.log('Invoice ID:', uid);
      
      // First get the invoice to retrieve the file URL
      const invoiceRef = doc(db, 'invoices', uid);
      const invoiceSnap = await getDoc(invoiceRef);
      
      if (invoiceSnap.exists()) {
        const invoiceData = invoiceSnap.data() as FirebaseInvoice;
        console.log('Invoice data:', invoiceData);
        const fileUrl = invoiceData.file_link || invoiceData.fileUrl;
        console.log('File URL to delete:', fileUrl);
        
        // Delete the file from Vercel Blob storage if it exists
        if (fileUrl) {
          try {
            console.log('Deleting file from Vercel Blob...');
            const { FileUploadService } = await import('@/lib/file-upload');
            await FileUploadService.deleteFile(fileUrl);
            console.log('File deleted from Vercel Blob successfully');
          } catch (fileError) {
            console.error('Error deleting file from blob storage:', fileError);
            // Continue with invoice deletion even if file deletion fails
          }
        } else {
          console.log('No file URL found, skipping blob deletion');
        }
      } else {
        console.log('Invoice not found in Firestore');
      }
      
      // Delete the invoice from Firestore
      console.log('Deleting invoice from Firestore...');
      await deleteDoc(invoiceRef);
      console.log('Invoice deleted from Firestore successfully');
      console.log('=== INVOICE DELETION COMPLETED ===');
      await deleteDoc(invoiceRef);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  },

  async assignInvoiceToUser(invoiceId: string, userUid: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Add invoice to user's invoices array
      const userRef = doc(db, 'users', userUid);
      const user = await userService.getUser(userUid);
      if (user && !user.invoices.includes(invoiceId)) {
        batch.update(userRef, {
          invoices: [...user.invoices, invoiceId],
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error assigning invoice to user:', error);
      throw error;
    }
  },

  async getPaymentSummary(userUid: string): Promise<PaymentSummary> {
    try {
      const invoices = await this.getUserInvoices(userUid);
      
      const summary: PaymentSummary = {
        totalPaid: 0,
        pending: 0,
        due: 0,
        overdue: 0,
      };

      invoices.forEach(invoice => {
        switch (invoice.status) {
          case 'paid':
            summary.totalPaid += invoice.amount;
            break;
          case 'pending':
            summary.pending += invoice.amount;
            break;
          case 'due':
            summary.due += invoice.amount;
            break;
          case 'overdue':
            summary.overdue += invoice.amount;
            break;
        }
      });

      return summary;
    } catch (error) {
      console.error('Error getting payment summary:', error);
      throw error;
    }
  },
};

// Helper function to clean data by removing undefined values
const cleanDocumentData = (data: Record<string, unknown>): Record<string, unknown> => {
  const cleaned: Record<string, unknown> = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      cleaned[key] = data[key];
    }
  });
  return cleaned;
};

// Document Services
export const documentService = {
  async getUserDocuments(userUid: string): Promise<Document[]> {
    try {
      const user = await userService.getUser(userUid);
      if (!user || !user.documents.length) return [];

      const documents: Document[] = [];
      for (const documentId of user.documents) {
        const documentDoc = await getDoc(doc(db, 'documents', documentId));
        if (documentDoc.exists()) {
          const data = convertTimestamps(documentDoc.data());
          documents.push({ uid: documentDoc.id, ...data } as Document);
        }
      }
      return documents;
    } catch (error) {
      console.error('Error getting user documents:', error);
      throw error;
    }
  },

  async getAllDocuments(): Promise<Document[]> {
    try {
      const documentsRef = collection(db, 'documents');
      const snapshot = await getDocs(query(documentsRef, orderBy('createdAt', 'desc')));
      const documents = snapshot.docs.map(doc => {
        const data = convertTimestamps(doc.data());
        const document = { uid: doc.id, ...data } as Document;
        console.log('Retrieved document:', document);
        return document;
      });
      console.log('Total documents retrieved:', documents.length);
      return documents;
    } catch (error) {
      console.error('Error getting all documents:', error);
      throw error;
    }
  },

  async createDocument(documentData: Omit<FirebaseDocument, 'id'>): Promise<string> {
    try {
      console.log('Creating document with data:', documentData);
      
      // Clean the data to remove undefined values using the helper function
      const cleanedData = cleanDocumentData(documentData as Record<string, unknown>);
      
      console.log('Cleaned document data:', cleanedData);
      
      // Ensure required fields have default values
      const documentToSave = {
        ...cleanedData,
        file_link: cleanedData.file_link || '', // Default to empty string instead of undefined
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      console.log('Final document data to save:', documentToSave);
      
      const documentsRef = collection(db, 'documents');
      const docRef = await addDoc(documentsRef, documentToSave);
      console.log('Document created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  },

  async updateDocument(uid: string, data: Partial<FirebaseDocument>): Promise<void> {
    try {
      const documentRef = doc(db, 'documents', uid);
      await updateDoc(documentRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  async deleteDocument(uid: string): Promise<void> {
    try {
      console.log('=== DELETING DOCUMENT ===');
      console.log('Document ID:', uid);
      
      // First get the document to retrieve the file URL
      const documentRef = doc(db, 'documents', uid);
      const documentSnap = await getDoc(documentRef);
      
      if (documentSnap.exists()) {
        const documentData = documentSnap.data() as FirebaseDocument;
        console.log('Document data:', documentData);
        console.log('File link to delete:', documentData.file_link);
        
        // Delete the file from Vercel Blob storage if it exists
        if (documentData.file_link) {
          try {
            console.log('Deleting file from Vercel Blob...');
            const { FileUploadService } = await import('@/lib/file-upload');
            await FileUploadService.deleteFile(documentData.file_link);
            console.log('File deleted from Vercel Blob successfully');
          } catch (fileError) {
            console.error('Error deleting file from blob storage:', fileError);
            // Continue with document deletion even if file deletion fails
          }
        } else {
          console.log('No file link found, skipping blob deletion');
        }
      } else {
        console.log('Document not found in Firestore');
      }
      
      // Delete the document from Firestore
      console.log('Deleting document from Firestore...');
      await deleteDoc(documentRef);
      console.log('Document deleted from Firestore successfully');
      console.log('=== DOCUMENT DELETION COMPLETED ===');
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  async assignDocumentToUser(documentId: string, userUid: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Add document to user's documents array
      const userRef = doc(db, 'users', userUid);
      const user = await userService.getUser(userUid);
      if (user && !user.documents.includes(documentId)) {
        batch.update(userRef, {
          documents: [...user.documents, documentId],
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error assigning document to user:', error);
      throw error;
    }
  },
};

// Service Request Services
export const requestService = {
  async getUserRequests(userUid: string): Promise<ServiceRequest[]> {
    try {
      const requestsRef = collection(db, 'requests');
      // Use simple where query first, then sort in memory to avoid index requirement
      const q = query(requestsRef, where('user_id', '==', userUid));
      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(doc => {
        const data = convertTimestamps(doc.data());
        return { uid: doc.id, ...data } as ServiceRequest;
      });
      
      // Sort by createdAt in memory
      return requests.sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime; // Descending order
      });
    } catch (error) {
      console.error('Error getting user requests:', error);
      throw error;
    }
  },

  async getAllRequests(): Promise<ServiceRequest[]> {
    try {
      const requestsRef = collection(db, 'requests');
      const snapshot = await getDocs(query(requestsRef, orderBy('createdAt', 'desc')));
      return snapshot.docs.map(doc => {
        const data = convertTimestamps(doc.data());
        return { uid: doc.id, ...data } as ServiceRequest;
      });
    } catch (error) {
      console.error('Error getting all requests:', error);
      throw error;
    }
  },

  async createRequest(requestData: Omit<FirebaseServiceRequest, 'id'>): Promise<string> {
    try {
      const requestsRef = collection(db, 'requests');
      const docRef = await addDoc(requestsRef, {
        ...requestData,
        status: 'todo',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add request to user's requests array
      const userRef = doc(db, 'users', requestData.user_id);
      const user = await userService.getUser(requestData.user_id);
      if (user) {
        await updateDoc(userRef, {
          requests: [...user.requests, docRef.id],
          updatedAt: serverTimestamp(),
        });

        // Send email notification to info@devou.in
        try {
          const { EmailService } = await import('@/lib/email-service');
          await EmailService.sendServiceRequestNotification({
            userName: user.name,
            userEmail: user.email,
            requestName: requestData.name,
            requestDescription: requestData.description,
            priority: requestData.priority || 'medium',
            submittedAt: new Date(),
          });
          console.log('Email notification sent successfully');
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't throw error - request creation should succeed even if email fails
        }
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  },

  async updateRequest(uid: string, data: Partial<FirebaseServiceRequest>): Promise<void> {
    try {
      const requestRef = doc(db, 'requests', uid);
      await updateDoc(requestRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating request:', error);
      throw error;
    }
  },

  async deleteRequest(uid: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'requests', uid));
    } catch (error) {
      console.error('Error deleting request:', error);
      throw error;
    }
  },

  // Real-time listener for requests
  onRequestsChange(callback: (requests: ServiceRequest[]) => void): () => void {
    const requestsRef = collection(db, 'requests');
    const q = query(requestsRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => {
        const data = convertTimestamps(doc.data());
        return { uid: doc.id, ...data } as ServiceRequest;
      });
      callback(requests);
    }, (error) => {
      console.error('Error in requests listener:', error);
      // If there's an index error, fall back to unsorted query
      if (error.code === 'failed-precondition') {
        console.log('Falling back to unsorted query due to missing index...');
        const fallbackQ = query(requestsRef);
        return onSnapshot(fallbackQ, (snapshot) => {
          const requests = snapshot.docs.map(doc => {
            const data = convertTimestamps(doc.data());
            return { uid: doc.id, ...data } as ServiceRequest;
          });
          
          // Sort in memory
          const sortedRequests = requests.sort((a, b) => {
            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
            return bTime - aTime;
          });
          
          callback(sortedRequests);
        });
      }
    });
  },

  // Real-time listener for user requests
  onUserRequestsChange(userUid: string, callback: (requests: ServiceRequest[]) => void): () => void {
    const requestsRef = collection(db, 'requests');
    // Use simple where query to avoid index requirement
    const q = query(requestsRef, where('user_id', '==', userUid));
    
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => {
        const data = convertTimestamps(doc.data());
        return { uid: doc.id, ...data } as ServiceRequest;
      });
      
      // Sort by createdAt in memory
      const sortedRequests = requests.sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime; // Descending order
      });
      
      callback(sortedRequests);
    }, (error) => {
      console.error('Error in user requests listener:', error);
    });
  },
};
