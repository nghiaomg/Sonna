# Service Configurator Architecture

This directory contains the modular service configuration system following SOLID principles.

## 📁 Directory Structure

```
electron/utils/
├── interfaces/          # Core interfaces (ISP)
│   └── index.ts         # IServiceSetup, IConfigProvider, IWebServerConfigurator
├── base/               # Abstract base classes (OCP)
│   ├── BaseServiceSetup.ts
│   ├── BaseWebServerConfigurator.ts
│   └── index.ts
├── services/           # Service implementations (SRP)
│   ├── PHPServiceSetup.ts
│   ├── MySQLServiceSetup.ts
│   ├── RedisServiceSetup.ts
│   ├── NodeJSServiceSetup.ts
│   ├── PhpMyAdminServiceSetup.ts
│   └── index.ts
├── webservers/         # Web server configurators (SRP)
│   ├── ApacheConfigurator.ts
│   ├── NginxConfigurator.ts
│   └── index.ts
├── factories/          # Factory pattern (DIP)
│   ├── ServiceSetupFactory.ts
│   ├── WebServerConfiguratorFactory.ts
│   └── index.ts
├── providers/          # Dependency providers (DIP)
│   ├── ConfigManagerProvider.ts
│   └── index.ts
└── service-configurator.ts  # Main orchestrator
```

## 🎯 SOLID Principles Implementation

### 1. **Single Responsibility Principle (SRP)**
- Each service setup class handles only one service
- Each web server configurator handles only one web server
- Clear separation of concerns

### 2. **Open/Closed Principle (OCP)**
- Base classes provide extension points
- New services can be added without modifying existing code
- Abstract classes define contracts for extension

### 3. **Liskov Substitution Principle (LSP)**
- All service implementations can substitute their base class
- All configurators implement their respective interfaces
- Polymorphic behavior ensured

### 4. **Interface Segregation Principle (ISP)**
- Small, focused interfaces
- Clients depend only on methods they use
- No forced dependencies on unused functionality

### 5. **Dependency Inversion Principle (DIP)**
- High-level modules depend on abstractions
- Factory pattern for object creation
- Dependency injection for configuration providers

## 🔧 Usage Examples

### Adding a New Service

1. **Create service setup class:**
```typescript
// services/PostgreSQLServiceSetup.ts
import { BaseServiceSetup } from '../base/BaseServiceSetup';

export class PostgreSQLServiceSetup extends BaseServiceSetup {
  async setupService(extractPath: string): Promise<void> {
    // PostgreSQL-specific setup logic
  }
}
```

2. **Update service factory:**
```typescript
// factories/ServiceSetupFactory.ts
case 'postgresql':
  return new PostgreSQLServiceSetup(this.configProvider);
```

### Adding a New Web Server

1. **Create configurator class:**
```typescript
// webservers/LighttpdConfigurator.ts
import { BaseWebServerConfigurator } from '../base/BaseWebServerConfigurator';

export class LighttpdConfigurator extends BaseWebServerConfigurator {
  async updateConfiguration(): Promise<void> {
    // Lighttpd-specific configuration
  }
}
```

2. **Update web server factory:**
```typescript
// factories/WebServerConfiguratorFactory.ts
case 'lighttpd':
  return new LighttpdConfigurator(this.configProvider, extractPath);
```

## 🧪 Testing

Each component can be tested independently:

```typescript
// Example unit test
const mockConfigProvider = new MockConfigProvider();
const phpSetup = new PHPServiceSetup(mockConfigProvider);
await phpSetup.setupService('/path/to/php');
```

## 🚀 Benefits

- **Maintainability**: Easy to modify individual services
- **Extensibility**: Simple to add new services/configurators
- **Testability**: Each component can be unit tested
- **Reusability**: Common functionality shared via base classes
- **Flexibility**: Easy to swap implementations
- **Type Safety**: Full TypeScript support with clear interfaces

## 📚 Architecture Patterns Used

- **Factory Pattern**: For creating service instances
- **Strategy Pattern**: Different setup strategies per service
- **Template Method**: Base classes provide structure
- **Dependency Injection**: For loose coupling
- **Interface Segregation**: Small, focused contracts 