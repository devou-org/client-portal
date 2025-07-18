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

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${folder}/${timestamp}-${sanitizedName}`;

      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: 'public',
        addRandomSuffix: false,
      });

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
      await del(url);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
