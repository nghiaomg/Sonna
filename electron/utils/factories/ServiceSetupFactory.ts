import { IServiceSetup, IConfigProvider } from '../interfaces';
import {
  PHPServiceSetup,
  MySQLServiceSetup,
  RedisServiceSetup,
  NodeJSServiceSetup,
  PhpMyAdminServiceSetup
} from '../services';

// Factory pattern following Dependency Inversion Principle (D)
export class ServiceSetupFactory {
  private configProvider: IConfigProvider;

  constructor(configProvider: IConfigProvider) {
    this.configProvider = configProvider;
  }

  createServiceSetup(serviceName: string): IServiceSetup | null {
    switch (serviceName) {
      case 'php':
        return new PHPServiceSetup(this.configProvider);
      case 'mysql':
        return new MySQLServiceSetup(this.configProvider);
      case 'redis':
        return new RedisServiceSetup(this.configProvider);
      case 'nodejs':
        return new NodeJSServiceSetup(this.configProvider);
      case 'phpmyadmin':
        return new PhpMyAdminServiceSetup(this.configProvider);
      case 'apache':
      case 'nginx':
        return null; // Web servers handled separately
      default:
        console.log(`No specific setup required for ${serviceName}`);
        return null;
    }
  }
} 