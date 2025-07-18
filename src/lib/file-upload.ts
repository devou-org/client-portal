import { put, del } from '@vercel/blob';
import { FileUploadResult } from '@/types';

export class FileUploadService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'text/plain',
    'video/mp4',
    'video/avi',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'application/zip',
    'application/x-rar-compressed',
  ];

  static validateFile(file: File): { isValid: boolean; error?: string } {
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size must be less than ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not supported',
      };
    }

    return { isValid: true };
  }

  static async uploadFile(
    file: File,
    folder: 'invoices' | 'documents' = 'documents'
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Check for token
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) {
        console.error('BLOB_READ_WRITE_TOKEN not found in environment variables');
        throw new Error('Vercel Blob token not configured');
      }

      console.log('Using token for upload (length):', token.length);

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${folder}/${timestamp}-${sanitizedName}`;

      console.log('Uploading to Vercel Blob with filename:', filename);

      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: 'public',
        addRandomSuffix: false,
        token: token
      });

      console.log('Upload successful, blob URL:', blob.url);

      return {
        url: blob.url,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteFile(url: string): Promise<void> {
    try {
      console.log('Deleting file from Vercel Blob:', url);
      
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) {
        console.error('BLOB_READ_WRITE_TOKEN not found in environment variables');
        throw new Error('Vercel Blob token not configured');
      }

      console.log('Using token for deletion (length):', token.length);
      
      await del(url, {
        token: token
      });
      
      console.log('File deleted successfully from Vercel Blob');
    } catch (error) {
      console.error('Error deleting file from Vercel Blob:', error);
      // Don't throw error to prevent blocking document/invoice deletion
      // Just log the error and continue
      console.warn('Blob deletion failed, but continuing with database deletion');
    }
  }

  static getFileNameFromUrl(url: string): string {
    try {
      const urlParts = url.split('/');
      const filenamePart = urlParts[urlParts.length - 1];
      // Remove timestamp prefix if present (format: timestamp-filename)
      const match = filenamePart.match(/^\d+-(.+)$/);
      return match ? match[1] : filenamePart;
    } catch (error) {
      return 'Unknown file';
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
