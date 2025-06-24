import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

// Define paths for assets
const iconSrcPath = path.resolve(__dirname, 'public/logo.ico')
const pngSrcPath = path.resolve(__dirname, 'public/logo.png')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
    ]),
    renderer(),
    {
      name: 'copy-assets',
      closeBundle() {
        // Ensure dist directory exists
        if (!existsSync('dist')) {
          mkdirSync('dist')
        }
        
        // Copy icon files to dist folder for production builds
        if (existsSync(iconSrcPath)) {
          copyFileSync(iconSrcPath, path.resolve('dist', 'logo.ico'))
          console.log('✓ Copied logo.ico to dist folder')
        }
        
        if (existsSync(pngSrcPath)) {
          copyFileSync(pngSrcPath, path.resolve('dist', 'logo.png'))
          console.log('✓ Copied logo.png to dist folder')
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '127.0.0.1',
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    watch: process.env.NODE_ENV === 'development' ? {} : null,
  },
})
