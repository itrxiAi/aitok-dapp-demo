import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { stat, readFile, open } from 'fs/promises';
import { createReadStream } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get the file path from the URL parameters
    const filePath = params.path.join('/');
    
    // Create the full path to the file in the public/uploads directory
    const fullPath = join(process.cwd(), 'public/uploads', filePath);
    
    // Check if the file exists
    const stats = await stat(fullPath);
    
    if (!stats.isFile()) {
      return new NextResponse('Not found', { status: 404 });
    }
    
    // Determine content type based on file extension
    const contentType = getContentType(filePath);
    const fileSize = stats.size;
    
    // Check if this is a range request (used for video streaming)
    const rangeHeader = request.headers.get('range');
    
    // If not a range request or not a video file, serve the entire file
    if (!rangeHeader || !contentType.startsWith('video/')) {
      const fileBuffer = await readFile(fullPath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(fileSize),
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
    
    // Handle range request for video streaming
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    // If end is not specified, use fileSize - 1 (inclusive end)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    
    // Ensure start and end are valid
    const validStart = isNaN(start) ? 0 : Math.max(0, Math.min(start, fileSize - 1));
    const validEnd = isNaN(end) ? fileSize - 1 : Math.min(end, fileSize - 1);
    
    // Calculate the chunk size
    const chunkSize = validEnd - validStart + 1;
    
    // Open the file for reading
    const fileHandle = await open(fullPath, 'r');
    const buffer = Buffer.alloc(chunkSize);
    
    // Read the specified range
    const { bytesRead } = await fileHandle.read(buffer, 0, chunkSize, validStart);
    await fileHandle.close();
    
    // Return the chunk with appropriate headers
    return new NextResponse(buffer.subarray(0, bytesRead), {
      status: 206, // Partial Content
      headers: {
        'Content-Type': contentType,
        'Content-Range': `bytes ${validStart}-${validStart + bytesRead - 1}/${fileSize}`,
        'Content-Length': String(bytesRead),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error serving static file:', error);
    return new NextResponse('Not found', { status: 404 });
  }
}

// Helper function to determine content type based on file extension
function getContentType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase() || '';
  
  const contentTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    'bmp': 'image/bmp',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Videos
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'mkv': 'video/x-matroska',
    '3gp': 'video/3gpp',
    'ts': 'video/mp2t',
    'm4v': 'video/x-m4v',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'aac': 'audio/aac',
    'oga': 'audio/ogg',  // Audio ogg format
    'm4a': 'audio/x-m4a',
    'flac': 'audio/flac',
    
    // Web
    'json': 'application/json',
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'xml': 'application/xml',
    'csv': 'text/csv',
  };
  
  return contentTypes[extension] || 'application/octet-stream';
}
