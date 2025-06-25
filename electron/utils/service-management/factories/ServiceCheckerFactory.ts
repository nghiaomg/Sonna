import { IServiceChecker, IFileSystem } from '../interfaces';
import {
  ApacheServiceChecker,
  MySQLServiceChecker,
  NginxServiceChecker,
  SimpleServiceChecker
} from '../checkers';

export class ServiceCheckerFactory {
  private fileSystem: IFileSystem;

  constructor(fileSystem: IFileSystem) {
    this.fileSystem = fileSystem;
  }

  createChecker(serviceName: string): IServiceChecker {
    switch (serviceName) {
      case 'apache':
        return new ApacheServiceChecker(this.fileSystem);
      case 'mysql':
        return new MySQLServiceChecker(this.fileSystem);
      case 'nginx':
        return new NginxServiceChecker(this.fileSystem);
      case 'php':
      case 'redis':
      case 'nodejs':
      case 'phpmyadmin':
      default:
        return new SimpleServiceChecker(this.fileSystem);
    }
  }
} 