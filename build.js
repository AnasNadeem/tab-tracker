const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const archiver = require('archiver');

const DIST_DIR = 'dist';
const ZIP_NAME = 'tab-time-tracker.zip';

// Files to include in the build
const FILES_TO_COPY = [
  'manifest.json',
  'popup.html',
  'popup.css'
];

const JS_FILES = [
  'background.js',
  'popup.js',
  'utils.js'
];

const DIRS_TO_COPY = [
  'images'
];

// Terser minification options
const terserOptions = {
  compress: {
    drop_console: false, // Keep console logs for debugging if needed
    drop_debugger: true,
    passes: 2
  },
  mangle: {
    toplevel: false // Don't mangle top-level names (Chrome API compatibility)
  },
  format: {
    comments: false
  }
};

async function cleanDist() {
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  fs.mkdirSync(DIST_DIR);
  console.log('✓ Cleaned dist directory');
}

async function copyFile(filename) {
  const src = path.join(__dirname, filename);
  const dest = path.join(__dirname, DIST_DIR, filename);
  fs.copyFileSync(src, dest);
}

async function copyDirectory(dirname) {
  const src = path.join(__dirname, dirname);
  const dest = path.join(__dirname, DIST_DIR, dirname);
  fs.cpSync(src, dest, { recursive: true });
}

async function minifyJS(filename) {
  const src = path.join(__dirname, filename);
  const dest = path.join(__dirname, DIST_DIR, filename);

  const code = fs.readFileSync(src, 'utf8');
  const result = await minify(code, terserOptions);

  if (result.error) {
    throw new Error(`Failed to minify ${filename}: ${result.error}`);
  }

  fs.writeFileSync(dest, result.code);

  const originalSize = Buffer.byteLength(code, 'utf8');
  const minifiedSize = Buffer.byteLength(result.code, 'utf8');
  const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(1);

  console.log(`✓ Minified ${filename}: ${originalSize} → ${minifiedSize} bytes (${reduction}% smaller)`);
}

async function createZip() {
  return new Promise((resolve, reject) => {
    const zipPath = path.join(__dirname, ZIP_NAME);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const size = (archive.pointer() / 1024).toFixed(2);
      console.log(`✓ Created ${ZIP_NAME} (${size} KB)`);
      resolve();
    });

    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(path.join(__dirname, DIST_DIR), false);
    archive.finalize();
  });
}

async function build() {
  console.log('\n🔨 Building Tab Time Tracker for Chrome Web Store...\n');

  try {
    // Step 1: Clean dist
    await cleanDist();

    // Step 2: Copy static files
    for (const file of FILES_TO_COPY) {
      await copyFile(file);
      console.log(`✓ Copied ${file}`);
    }

    // Step 3: Copy directories
    for (const dir of DIRS_TO_COPY) {
      await copyDirectory(dir);
      console.log(`✓ Copied ${dir}/`);
    }

    // Step 4: Minify JavaScript
    console.log('\nMinifying JavaScript...\n');
    for (const file of JS_FILES) {
      await minifyJS(file);
    }

    // Step 5: Create ZIP
    console.log('\nCreating ZIP archive...\n');
    await createZip();

    console.log('\n✅ Build complete! Upload tab-time-tracker.zip to Chrome Web Store.\n');
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

build();
