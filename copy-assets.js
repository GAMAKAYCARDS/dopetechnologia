const fs = require('fs-extra');
const path = require('path');

async function copyAssets() {
  try {
    console.log('📁 Copying static assets...');
    
    // Copy logo directory
    await fs.copy('public/logo', 'logo');
    console.log('✅ Logo files copied');
    
    // Copy video directory
    await fs.copy('public/video', 'video');
    console.log('✅ Video files copied');
    
    console.log('🎉 All static assets copied successfully!');
  } catch (error) {
    console.error('❌ Error copying assets:', error);
    process.exit(1);
  }
}

copyAssets();
