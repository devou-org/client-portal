import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// Configure the route to handle larger files
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');
    
    // Get content length to check size before processing
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      console.log('Request content length:', sizeInBytes, 'bytes');
      
      // Vercel Hobby plan has 4.5MB limit, Pro has 10MB
      const maxSize = 4 * 1024 * 1024; // 4MB to be safe
      if (sizeInBytes > maxSize) {
        console.error('Request too large for Vercel deployment:', sizeInBytes);
        return NextResponse.json(
          { 
            error: 'File too large for current plan. Please use files smaller than 4MB or upgrade to Vercel Pro.',
            maxSize: '4MB',
            receivedSize: `${(sizeInBytes / 1024 / 1024).toFixed(2)}MB`
          },
          { status: 413 }
        );
      }
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'documents';

    console.log('File received:', file?.name, 'Size:', file?.size);

    if (!file) {
      console.error('No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Client-side validation (should be caught before reaching here)
    const maxFileSize = 4 * 1024 * 1024; // 4MB for Vercel Hobby
    if (file.size > maxFileSize) {
      console.error('File size exceeds limit:', file.size);
      return NextResponse.json(
        { 
          error: 'File size exceeds 4MB limit for current deployment plan',
          maxSize: '4MB',
          receivedSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${folder}/${timestamp}-${sanitizedName}`;

    console.log('Uploading to Vercel Blob with filename:', filename);

    // Check for token
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error('BLOB_READ_WRITE_TOKEN not found in environment variables');
      return NextResponse.json(
        { error: 'Vercel Blob token not configured' },
        { status: 500 }
      );
    }

    console.log('Using token for upload (length):', token.length);

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
      token: token
    });

    console.log('Upload successful, blob URL:', blob.url);

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
      },
      info: {
        uploadedToVercel: true,
        maxFileSize: '4MB (current deployment limit)',
        upgradeNote: 'Upgrade to Vercel Pro for 10MB file uploads'
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
