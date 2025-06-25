import * as fs from 'fs';
import { IFileSystem } from '../interfaces';

export class FileSystemProvider implements IFileSystem {
  exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  readDir(dirPath: string): string[] {
    try {
      return fs.readdirSync(dirPath);
    } catch (error) {
      return [];
    }
  }

  isDirectory(filePath: string): boolean {
    try {
      return fs.statSync(filePath).isDirectory();
    } catch (error) {
      return false;
    }
  }
} 