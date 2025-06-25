import * as fs from 'fs';
import * as path from 'path';
import { BaseWebServerConfigurator } from '../base/BaseWebServerConfigurator';
import { IConfigProvider } from '../interfaces';

export class NginxConfigurator extends BaseWebServerConfigurator {
  private extractPath: string;

  constructor(configProvider: IConfigProvider, extractPath: string) {
    super(configProvider);
    this.extractPath = extractPath;
  }

  async updateConfiguration(): Promise<void> {
    const nginxConfPath = path.join(this.extractPath, 'conf', 'nginx.conf');
    
    if (!fs.existsSync(nginxConfPath)) return;

    let nginxConf = fs.readFileSync(nginxConfPath, 'utf8');
    
    nginxConf = await this.configureBasicSettings(nginxConf);
    nginxConf = await this.configurePHP(nginxConf);
    nginxConf = await this.configurePhpMyAdmin(nginxConf);
    
    fs.writeFileSync(nginxConfPath, nginxConf);
  }

  private async configureBasicSettings(nginxConf: string): Promise<string> {
    const port = await this.getPortFromConfig('nginx', 8080);
    
    nginxConf = nginxConf.replace(/root\s+html;/g, 'root C:/sonna/www;');
    nginxConf = nginxConf.replace(/listen\s+\d+;/g, `listen ${port};`);
    
    return nginxConf;
  }

  private async configurePHP(nginxConf: string): Promise<string> {
    if (nginxConf.includes('location ~ \\.php$')) return nginxConf;

    const phpLocation = `
    location ~ \\.php$ {
        root           C:/sonna/www;
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        include        fastcgi_params;
    }`;

    return nginxConf.replace(/location \/ {[^}]*}/g, 
      `location / {
            root   C:/sonna/www;
            index  index.html index.htm index.php;
            try_files $uri $uri/ =404;
        }
        
        ${phpLocation}`);
  }

  private async configurePhpMyAdmin(nginxConf: string): Promise<string> {
    if (nginxConf.includes('location /phpmyadmin')) return nginxConf;

    const phpMyAdminPath = await this.getPhpMyAdminPath();
    if (!phpMyAdminPath) return nginxConf;

    const phpMyAdminLocation = `
        
        location /phpmyadmin {
            alias ${phpMyAdminPath.replace(/\\/g, '/')};
            index index.php;
            try_files $uri $uri/ =404;
            
            location ~ \\.php$ {
                fastcgi_pass   127.0.0.1:9000;
                fastcgi_index  index.php;
                fastcgi_param  SCRIPT_FILENAME  $request_filename;
                include        fastcgi_params;
            }
        }
        
        # Security for phpMyAdmin
        location /phpmyadmin/libraries {
            deny all;
        }
        
        location /phpmyadmin/setup/lib {
            deny all;
        }`;

    const lastBraceIndex = nginxConf.lastIndexOf('}');
    if (lastBraceIndex > -1) {
      nginxConf = nginxConf.substring(0, lastBraceIndex) + phpMyAdminLocation + '\n    }\n}';
    }

    console.log(`Added phpMyAdmin location configuration for Nginx: ${phpMyAdminPath}`);
    return nginxConf;
  }

  private async getPortFromConfig(serviceName: string, defaultPort: number): Promise<number> {
    try {
      const configResult = await this.configProvider.getConfig();
      if (configResult.success && configResult.config?.services[serviceName]) {
        return configResult.config.services[serviceName].port || defaultPort;
      }
    } catch (error) {
      console.error(`Failed to get ${serviceName} port from config, using default:`, error);
    }
    return defaultPort;
  }
} 