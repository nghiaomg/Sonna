"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadManager = void 0;
const fs = __importStar(require("fs"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
class DownloadManager {
    constructor(onProgress) {
        this.onProgress = onProgress;
    }
    async downloadFile(url, dest, serviceName) {
        return new Promise((resolve, reject) => {
            console.log(`Starting download: ${serviceName} from ${url}`);
            const protocol = url.startsWith('https') ? https : http;
            const file = fs.createWriteStream(dest);
            const options = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            };
            const request = protocol.get(url, options, (response) => {
                // Handle redirects
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
                response.on('data', (chunk) => {
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
                    // Validate downloaded file
                    if (downloadedSize === 0) {
                        fs.unlinkSync(dest);
                        reject(new Error('Downloaded file is empty'));
                        return;
                    }
                    // Check if file is actually a zip file by reading first few bytes
                    const buffer = fs.readFileSync(dest, { encoding: null, flag: 'r' });
                    console.log(`Downloaded file size: ${downloadedSize} bytes, buffer length: ${buffer.length}`);
                    console.log(`First 4 bytes: ${buffer.slice(0, 4).toString('hex')}`);
                    if (buffer.length < 4) {
                        fs.unlinkSync(dest);
                        reject(new Error('Downloaded file is too small'));
                        return;
                    }
                    // Check for ZIP file signature (PK)
                    if (buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
                        // Log first 100 bytes of file to see what we actually downloaded
                        const preview = buffer.slice(0, Math.min(100, buffer.length)).toString('utf8');
                        console.log(`File preview: ${preview}`);
                        fs.unlinkSync(dest);
                        reject(new Error(`Downloaded file is not a valid ZIP file. Got ${buffer[0].toString(16)} ${buffer[1].toString(16)} instead of 50 4B`));
                        return;
                    }
                    resolve();
                });
                file.on('error', (err) => {
                    fs.unlink(dest, () => { }); // Delete partial file
                    reject(err);
                });
            });
            request.on('error', (err) => {
                file.close();
                fs.unlink(dest, () => { });
                reject(err);
            });
            // Set timeout
            request.setTimeout(30000, () => {
                request.destroy();
                file.close();
                fs.unlink(dest, () => { });
                reject(new Error('Download timeout'));
            });
        });
    }
    async extractZip(zipPath, extractPath, serviceName) {
        return new Promise((resolve, reject) => {
            try {
                // Validate zip file before extraction
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
                const AdmZip = require('adm-zip');
                // Test if zip is valid before extraction
                let zip;
                try {
                    zip = new AdmZip(zipPath);
                    // Test zip integrity
                    const entries = zip.getEntries();
                    if (entries.length === 0) {
                        reject(new Error('Zip file contains no entries'));
                        return;
                    }
                    console.log(`Zip file contains ${entries.length} entries`);
                }
                catch (zipError) {
                    console.error('Invalid zip file:', zipError.message);
                    reject(new Error(`Invalid zip file: ${zipError.message}`));
                    return;
                }
                // Create extract directory if it doesn't exist
                if (!fs.existsSync(extractPath)) {
                    fs.mkdirSync(extractPath, { recursive: true });
                }
                // Extract all files
                zip.extractAllTo(extractPath, true);
                // Verify extraction by checking if files were created
                const extractedFiles = fs.readdirSync(extractPath);
                if (extractedFiles.length === 0) {
                    reject(new Error('No files were extracted'));
                    return;
                }
                console.log(`Successfully extracted ${extractedFiles.length} files from ${zipPath} to ${extractPath}`);
                resolve();
            }
            catch (error) {
                console.error(`Failed to extract ${zipPath}:`, error);
                reject(error);
            }
        });
    }
    async deleteDirectory(dirPath) {
        return new Promise((resolve, reject) => {
            try {
                if (!fs.existsSync(dirPath)) {
                    resolve();
                    return;
                }
                // For Windows, use rmdir with recursive option
                if (process.platform === 'win32') {
                    const { execSync } = require('child_process');
                    execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'ignore' });
                }
                else {
                    // For other platforms, use fs.rmSync
                    fs.rmSync(dirPath, { recursive: true, force: true });
                }
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }
    emitProgress(progress) {
        if (this.onProgress) {
            this.onProgress(progress);
        }
    }
}
exports.DownloadManager = DownloadManager;
