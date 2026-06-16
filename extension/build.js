import { build } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runBuild() {
  const extRoot = __dirname;
  const distDir = path.join(extRoot, 'dist');
  
  // 1. Build Popup UI
  console.log('Building Popup UI...');
  await build({
    root: extRoot,
    configFile: false,
    plugins: [react()],
    build: {
      outDir: distDir,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: path.join(extRoot, 'popup.html'),
        },
      },
    },
  });

  // 2. Build Background Service Worker
  console.log('Building Background Service Worker...');
  await build({
    root: extRoot,
    configFile: false,
    build: {
      outDir: distDir,
      emptyOutDir: false,
      lib: {
        entry: path.join(extRoot, 'src/background/background.ts'),
        formats: ['es'],
        fileName: () => 'background.js',
      },
      minify: false,
    },
  });

  // 3. Build Content Script
  console.log('Building Content Script...');
  await build({
    root: extRoot,
    configFile: false,
    build: {
      outDir: distDir,
      emptyOutDir: false,
      lib: {
        entry: path.join(extRoot, 'src/content/content.ts'),
        formats: ['es'],
        fileName: () => 'content.js',
      },
      minify: false,
    },
  });

  // 4. Copy Assets (manifest, CSS, icons)
  console.log('Copying static assets...');
  
  // manifest.json
  fs.copyFileSync(
    path.join(extRoot, 'manifest.json'),
    path.join(distDir, 'manifest.json')
  );
  
  // content.css
  fs.copyFileSync(
    path.join(extRoot, 'src/content/content.css'),
    path.join(distDir, 'content.css')
  );
  
  // icons/
  const srcIconsDir = path.join(extRoot, 'icons');
  const destIconsDir = path.join(distDir, 'icons');
  if (!fs.existsSync(destIconsDir)) {
    fs.mkdirSync(destIconsDir, { recursive: true });
  }
  
  const icons = fs.readdirSync(srcIconsDir);
  for (const icon of icons) {
    fs.copyFileSync(
      path.join(srcIconsDir, icon),
      path.join(destIconsDir, icon)
    );
  }
  
  console.log('Build completed successfully! Unpacked extension is in extension/dist/');
}

runBuild().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
