import * as path from 'path';
import { BaseServiceSetup } from '../base/BaseServiceSetup';

export class RedisServiceSetup extends BaseServiceSetup {
  async setupService(extractPath: string): Promise<void> {
    const redisConfPath = path.join(extractPath, 'redis.conf');
    const port = await this.getPortFromConfig('redis', 6379);
    
    const redisConfContent = this.generateRedisConfig(extractPath, port);
    this.writeConfigFile(redisConfPath, redisConfContent);
  }

  private generateRedisConfig(extractPath: string, port: number): string {
    return `# Redis Configuration for Sonna
port ${port}
bind 127.0.0.1
dir "${extractPath.replace(/\\/g, '/')}"

# Persistence
save 900 1
save 300 10
save 60 10000

# Logging
loglevel notice
logfile "${extractPath.replace(/\\/g, '/')}/redis.log"

# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Security
# requirepass yourpasswordhere

# Append only file
appendonly yes
appendfilename "appendonly.aof"`;
  }
} 