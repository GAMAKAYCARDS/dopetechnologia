import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const videoPath = join(process.cwd(), 'public', 'video', 'footervid.mp4');
    
    if (!existsSync(videoPath)) {
      return new NextResponse('Video not found', { status: 404 });
    }
    
    const videoContent = readFileSync(videoPath);
    
    return new NextResponse(videoContent, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    console.error('Error serving video:', error);
    return new NextResponse('Video not found', { status: 404 });
  }
}
