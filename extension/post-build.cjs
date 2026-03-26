const fs = require('fs');
const path = require('path');

/**
 * Post-Build Script for Proptimizer Extension
 * Automatically copies required files to dist/ after build
 */

console.log('\n🔧 Running post-build script...\n');

const files = [
  {
    src: 'manifest.json',
    dest: 'dist/manifest.json',
    required: true
  },
  {
    src: 'dist/src/popup/index.html',
    dest: 'dist/popup.html',
    required: true
  },
  {
    src: 'assets/proptimizer-16x16.png',
    dest: 'dist/assets/proptimizer-16x16.png',
    required: true
  },
  {
    src: 'assets/proptimizer-48x48.png',
    dest: 'dist/assets/proptimizer-48x48.png',
    required: true
  },
  {
    src: 'assets/proptimizer-128x128.png',
    dest: 'dist/assets/proptimizer-128x128.png',
    required: true
  },
  {
    src: 'assets/proptimizer-48x48.svg',
    dest: 'dist/assets/proptimizer-48x48.svg',
    required: true
  },
  {
    src: 'assets/proptimizer-logo-transparent.svg',
    dest: 'dist/assets/proptimizer-logo-transparent.svg',
    required: true
  },
  {
    src: 'src/content/style.css',
    dest: 'dist/assets/content.css',
    required: false
  }
];

let errors = 0;
let success = 0;

files.forEach(file => {
  const srcPath = path.join(__dirname, file.src);
  const destPath = path.join(__dirname, file.dest);
  
  if (!fs.existsSync(srcPath)) {
    if (file.required) {
      console.error(`❌ Required file not found: ${file.src}`);
      errors++;
    } else {
      console.log(`⚠️  Optional file not found: ${file.src}`);
    }
    return;
  }

  try {
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied: ${file.src} → ${file.dest}`);
    success++;
  } catch (err) {
    console.error(`❌ Failed to copy ${file.src}:`, err.message);
    errors++;
  }
});

console.log(`\n📊 Summary: ${success} copied, ${errors} errors\n`);

if (errors > 0) {
  console.error('❌ Post-build script failed!\n');
  process.exit(1);
} else {
  console.log('✅ Extension is ready to load!\n');
  console.log('📂 Load from: extension/dist\n');
  process.exit(0);
}
