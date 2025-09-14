const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const outDir = path.resolve(__dirname, '..', 'dist');
const outZip = path.resolve(__dirname, '..', 'ai-bridge-pro-dist.zip');
if (!fs.existsSync(outDir)) { console.error('dist/ missing. Run build first.'); process.exit(1); }

const output = fs.createWriteStream(outZip);
const archive = archiver('zip', { zlib: { level: 9 } });
output.on('close', ()=> console.log('Created', outZip, archive.pointer(), 'bytes'));
archive.on('error', err=> { throw err; });
archive.pipe(output);

// include built files
archive.directory(outDir, 'dist');

// include files UXP expects at root
const rootIndex = path.resolve(__dirname, '..', 'index.html');
const rootBundle = path.resolve(__dirname, '..', 'bundle.js');
if (fs.existsSync(rootIndex)) archive.file(rootIndex, { name: 'index.html' });
if (fs.existsSync(rootBundle)) archive.file(rootBundle, { name: 'bundle.js' });

// include required assets/manifest
archive.file(path.resolve(__dirname, '..', 'manifest.json'), { name: 'manifest.json' });
archive.file(path.resolve(__dirname, '..', 'assets/icon.png'), { name: 'assets/icon.png' });
archive.finalize();