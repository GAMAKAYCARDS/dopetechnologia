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
      join(cwd, 'public', 'logo', 'dopelogo.svg'),
      join(cwd, 'logo', 'dopelogo.svg'),
      join(cwd, '..', 'public', 'logo', 'dopelogo.svg'),
      join(cwd, '..', '..', 'public', 'logo', 'dopelogo.svg'),
      // Netlify specific paths
      join(cwd, '.next', 'static', 'public', 'logo', 'dopelogo.svg'),
      join(cwd, 'static', 'public', 'logo', 'dopelogo.svg'),
    ];
    
    let logoPath = null;
    for (const path of possiblePaths) {
      console.log('Checking path:', path);
      if (existsSync(path)) {
        logoPath = path;
        console.log('Found logo at:', path);
        break;
      }
    }
    
    if (!logoPath) {
      console.error('Logo not found in any of the expected paths:', possiblePaths);
      // Return a simple SVG as fallback
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#F7DD0F" font-size="12">DT</text></svg>`;
      return new NextResponse(fallbackSvg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    const logoContent = readFileSync(logoPath, 'utf-8');
    
    return new NextResponse(logoContent, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error serving logo:', error);
    // Return a simple SVG as fallback
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#F7DD0F" font-size="12">DT</text></svg>`;
    return new NextResponse(fallbackSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
