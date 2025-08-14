import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // For Netlify, the working directory might be different
    const cwd = process.cwd();
    console.log('Current working directory:', cwd);
    
    // Try multiple possible paths for Netlify compatibility
    const possiblePaths = [
      join(cwd, 'public', 'video', 'footervid.mp4'),
      join(cwd, 'video', 'footervid.mp4'),
      join(cwd, '..', 'public', 'video', 'footervid.mp4'),
      join(cwd, '..', '..', 'public', 'video', 'footervid.mp4'),
      // Netlify specific paths
      join(cwd, '.next', 'static', 'public', 'video', 'footervid.mp4'),
      join(cwd, 'static', 'public', 'video', 'footervid.mp4'),
    ];
    
    let videoPath = null;
    for (const path of possiblePaths) {
      console.log('Checking path:', path);
      if (existsSync(path)) {
        videoPath = path;
        console.log('Found video at:', path);
        break;
      }
    }
    
    if (!videoPath) {
      console.error('Video not found in any of the expected paths:', possiblePaths);
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
