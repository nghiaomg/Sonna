import { IWebServerConfigurator, IConfigProvider } from '../interfaces';
import { ApacheConfigurator, NginxConfigurator } from '../webservers';

export class WebServerConfiguratorFactory {
  private configProvider: IConfigProvider;

  constructor(configProvider: IConfigProvider) {
    this.configProvider = configProvider;
  }

  createConfigurator(serviceName: string, extractPath: string): IWebServerConfigurator | null {
    switch (serviceName) {
      case 'apache':
        return new ApacheConfigurator(this.configProvider, extractPath);
      case 'nginx':
        return new NginxConfigurator(this.configProvider, extractPath);
      default:
        return null;
    }
  }
} 