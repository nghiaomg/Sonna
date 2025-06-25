import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import AdmZip from 'adm-zip';

export interface DownloadProgress {
  serviceName: string;
  progress: number;
  status: 'downloading' | 'extracting' | 'setup' | 'completed' | 'error';
  message: string;
}

export class DownloadManager {
  private onProgress?: (progress: DownloadProgress) => void;
  private maxRetries = 3;
  private timeout = 120000; // 2 minutes for large files

  constructor(onProgress?: (progress: DownloadProgress) => void) {
    this.onProgress = onProgress;
  }

  async downloadFile(url: string, dest: string, serviceName: string): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.downloadWithRetry(url, dest, serviceName, attempt);
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error as Error;
        console.error(`Download attempt ${attempt} failed for ${serviceName}:`, error);
        
        // Clean up partial download
        try {
          if (fs.existsSync(dest)) {
            fs.unlinkSync(dest);
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup partial download:', cleanupError);
        }
        
        // If this was the last attempt, throw the error
        if (attempt === this.maxRetries) {
          throw lastError;
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`Retrying download in ${waitTime}ms... (attempt ${attempt + 1}/${this.maxRetries})`);
        
        this.emitProgress({
          serviceName,
          progress: 0,
          status: 'downloading',
          message: `Retrying download... (attempt ${attempt + 1}/${this.maxRetries})`
        });
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError || new Error('Download failed after all retry attempts');
  }

  private async downloadWithRetry(url: string, dest: string, serviceName: string, attempt: number): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Starting download attempt ${attempt}: ${serviceName} from ${url}`);

      const protocol = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(dest);

      // Enhanced options for better reliability
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        },
        timeout: this.timeout
      };

      const request = protocol.get(url, options, (response: any) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          if (response.headers.location) {
            file.close();
            try {
              fs.unlinkSync(dest);
            } catch (e) { /* ignore */ }
            return this.downloadWithRetry(response.headers.location, dest, serviceName, attempt)
              .then(resolve)
              .catch(reject);
          }
        }

        if (response.statusCode !== 200) {
          file.close();
          try {
            fs.unlinkSync(dest);
          } catch (e) { /* ignore */ }
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;
        let lastProgressTime = Date.now();

        response.on('data', (chunk: any) => {
          downloadedSize += chunk.length;
          const now = Date.now();
          
          // Throttle progress updates to avoid overwhelming UI
          if (now - lastProgressTime > 500 || downloadedSize === totalSize) {
            if (totalSize > 0) {
              const progress = Math.round((downloadedSize / totalSize) * 100);
              this.emitProgress({
                serviceName,
                progress,
                status: 'downloading',
                message: `Downloading... ${progress}% (${this.formatBytes(downloadedSize)}/${this.formatBytes(totalSize)})`
              });
            } else {
              this.emitProgress({
                serviceName,
                progress: 50, // Unknown size, show indeterminate progress
                status: 'downloading',
                message: `Downloading... ${this.formatBytes(downloadedSize)} downloaded`
              });
            }
            lastProgressTime = now;
          }
        });

        response.on('error', (err: any) => {
          file.close();
          try {
            fs.unlinkSync(dest);
          } catch (e) { /* ignore */ }
          reject(err);
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();

          if (downloadedSize === 0) {
            try {
              fs.unlinkSync(dest);
            } catch (e) { /* ignore */ }
            reject(new Error('Downloaded file is empty'));
            return;
          }

          // Verify file integrity
          try {
            const buffer = fs.readFileSync(dest, { encoding: null, flag: 'r' });
            console.log(`Downloaded file size: ${downloadedSize} bytes, buffer length: ${buffer.length}`);
            console.log(`First 4 bytes: ${buffer.slice(0, 4).toString('hex')}`);

            if (buffer.length < 4) {
              fs.unlinkSync(dest);
              reject(new Error('Downloaded file is too small'));
              return;
            }

            // Check if it's a ZIP file (PK header)
            if (buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
              const preview = buffer.slice(0, Math.min(100, buffer.length)).toString('utf8');
              console.log(`File preview: ${preview}`);
              
              // Check if it's an HTML error page
              if (preview.includes('<html') || preview.includes('<!DOCTYPE')) {
                fs.unlinkSync(dest);
                reject(new Error('Downloaded file appears to be an HTML error page instead of a ZIP file'));
                return;
              }
              
              fs.unlinkSync(dest);
              reject(new Error(`Downloaded file is not a valid ZIP file. Got ${buffer[0].toString(16)} ${buffer[1].toString(16)} instead of 50 4B`));
              return;
            }

            console.log(`✅ Download completed successfully: ${serviceName}`);
            resolve();
          } catch (verifyError) {
            console.error('File verification failed:', verifyError);
            try {
              fs.unlinkSync(dest);
            } catch (e) { /* ignore */ }
            reject(new Error(`File verification failed: ${verifyError}`));
          }
        });

        file.on('error', (err: any) => {
          console.error('File write error:', err);
          try {
            fs.unlinkSync(dest);
          } catch (e) { /* ignore */ }
          reject(err);
        });
      });

      request.on('error', (err: any) => {
        console.error('Request error:', err);
        file.close();
        try {
          fs.unlinkSync(dest);
        } catch (e) { /* ignore */ }
        reject(err);
      });

      request.on('timeout', () => {
        console.error('Request timeout');
        request.destroy();
        file.close();
        try {
          fs.unlinkSync(dest);
        } catch (e) { /* ignore */ }
        reject(new Error(`Download timeout after ${this.timeout / 1000} seconds`));
      });

      // Set timeout
      request.setTimeout(this.timeout);
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async extractZip(zipPath: string, extractPath: string, serviceName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(zipPath)) {
          reject(new Error('Zip file does not exist'));
          return;
        }

        const stats = fs.statSync(zipPath);
        if (stats.size === 0) {
          reject(new Error('Zip file is empty'));
          return;
        }

        this.emitProgress({
          serviceName,
          progress: 0,
          status: 'extracting',
          message: 'Preparing extraction...'
        });

        let zip;
        try {
          zip = new AdmZip(zipPath);

          const entries = zip.getEntries();
          if (entries.length === 0) {
            reject(new Error('Zip file contains no entries'));
            return;
          }

          console.log(`Zip file contains ${entries.length} entries`);
        } catch (zipError: any) {
          console.error('Invalid zip file:', zipError.message);
          reject(new Error(`Invalid zip file: ${zipError.message}`));
          return;
        }

        if (!fs.existsSync(extractPath)) {
          fs.mkdirSync(extractPath, { recursive: true });
        }

        this.emitProgress({
          serviceName,
          progress: 50,
          status: 'extracting',
          message: 'Extracting files...'
        });

        // Extract with error handling
        try {
          zip.extractAllTo(extractPath, true);
        } catch (extractError: any) {
          console.error('Extraction failed:', extractError);
          reject(new Error(`Extraction failed: ${extractError.message}`));
          return;
        }

        // Verify extraction
        const extractedFiles = fs.readdirSync(extractPath);
        if (extractedFiles.length === 0) {
          reject(new Error('No files were extracted'));
          return;
        }

        this.emitProgress({
          serviceName,
          progress: 100,
          status: 'extracting',
          message: 'Extraction completed'
        });

        console.log(`Successfully extracted ${extractedFiles.length} files from ${zipPath} to ${extractPath}`);
        resolve();
      } catch (error) {
        console.error(`Failed to extract ${zipPath}:`, error);
        reject(error);
      }
    });
  }

  async deleteDirectory(dirPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(dirPath)) {
          resolve();
          return;
        }

        if (process.platform === 'win32') {
          const { execSync } = require('child_process');
          execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'ignore' });
        } else {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private emitProgress(progress: DownloadProgress): void {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }
} 