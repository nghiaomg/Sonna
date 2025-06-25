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

  constructor(onProgress?: (progress: DownloadProgress) => void) {
    this.onProgress = onProgress;
  }

  async downloadFile(url: string, dest: string, serviceName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Starting download: ${serviceName} from ${url}`);

      const protocol = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(dest);

      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      };

      const request = protocol.get(url, options, (response: any) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          if (response.headers.location) {
            file.close();
            fs.unlinkSync(dest);
            return this.downloadFile(response.headers.location, dest, serviceName)
              .then(resolve)
              .catch(reject);
          }
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;

        response.on('data', (chunk: any) => {
          downloadedSize += chunk.length;
          if (totalSize > 0) {
            const progress = Math.round((downloadedSize / totalSize) * 100);
            this.emitProgress({
              serviceName,
              progress,
              status: 'downloading',
              message: `Downloading... ${progress}%`
            });
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();

          if (downloadedSize === 0) {
            fs.unlinkSync(dest);
            reject(new Error('Downloaded file is empty'));
            return;
          }

          const buffer = fs.readFileSync(dest, { encoding: null, flag: 'r' });
          console.log(`Downloaded file size: ${downloadedSize} bytes, buffer length: ${buffer.length}`);
          console.log(`First 4 bytes: ${buffer.slice(0, 4).toString('hex')}`);

          if (buffer.length < 4) {
            fs.unlinkSync(dest);
            reject(new Error('Downloaded file is too small'));
            return;
          }

          if (buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
            const preview = buffer.slice(0, Math.min(100, buffer.length)).toString('utf8');
            console.log(`File preview: ${preview}`);
            fs.unlinkSync(dest);
            reject(new Error(`Downloaded file is not a valid ZIP file. Got ${buffer[0].toString(16)} ${buffer[1].toString(16)} instead of 50 4B`));
            return;
          }

          resolve();
        });

        file.on('error', (err: any) => {
          fs.unlink(dest, () => { });
          reject(err);
        });
      });

      request.on('error', (err: any) => {
        file.close();
        fs.unlink(dest, () => { });
        reject(err);
      });

      request.setTimeout(30000, () => {
        request.destroy();
        file.close();
        fs.unlink(dest, () => { });
        reject(new Error('Download timeout'));
      });
    });
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
          progress: 100,
          status: 'extracting',
          message: 'Extracting files...'
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

        zip.extractAllTo(extractPath, true);

        const extractedFiles = fs.readdirSync(extractPath);
        if (extractedFiles.length === 0) {
          reject(new Error('No files were extracted'));
          return;
        }

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