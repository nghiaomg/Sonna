# Utils - Electron Backend Utilities

This folder contains modular utilities for the Sonna Electron application, designed for scalability and maintainability.

## Structure

```
utils/
├── index.ts              # Main exports for easy importing
├── service-manager.ts    # Service lifecycle management
├── download-manager.ts   # File download and extraction
├── service-configurator.ts # Service setup and configuration
├── config-manager.ts     # Configuration file management
└── README.md            # This documentation
```

## Modules

### ServiceManager (`service-manager.ts`)
Handles the lifecycle of development services (Apache, MySQL, PHP, etc.)

**Key Features:**
- Start/stop services with proper process management
- Real-time service status checking
- Installation verification
- Process monitoring and cleanup

**Main Methods:**
- `getServicesStatus()` - Get current status of all services
- `startService(serviceName)` - Start a specific service
- `stopService(serviceName)` - Stop a specific service
- `checkServiceInstallation(service)` - Verify service installation
- `cleanup()` - Stop all running services

### DownloadManager (`download-manager.ts`)
Handles file downloads, extraction, and directory operations

**Key Features:**
- HTTP/HTTPS file downloads with progress tracking
- ZIP file extraction with validation
- Recursive directory deletion
- Download resume and redirect handling

**Main Methods:**
- `downloadFile(url, dest, serviceName)` - Download files with progress
- `extractZip(zipPath, extractPath, serviceName)` - Extract ZIP archives
- `deleteDirectory(dirPath)` - Recursively delete directories

### ServiceConfigurator (`service-configurator.ts`)
Configures downloaded services for proper operation

**Key Features:**
- Service-specific configuration generation
- Config file templating
- Directory structure setup
- Environment optimization

**Main Methods:**
- `setupService(serviceName, service)` - Configure a specific service
- Individual setup methods for each service type

### ConfigManager (`config-manager.ts`)
Manages application configuration and service metadata

**Key Features:**
- JSON configuration file management
- Service status persistence
- Default configuration generation
- Configuration validation

**Main Methods:**
- `initialize()` - Set up Sonna directories and config
- `getConfig()` - Read current configuration
- `updateConfig(updates)` - Update configuration
- `updateServiceStatus(serviceName, updates)` - Update service status
- `resetInstallationStatus()` - Reset all services to uninstalled

## Usage

### Basic Import
```typescript
import { 
  ServiceManager, 
  DownloadManager, 
  ServiceConfigurator, 
  ConfigManager 
} from './utils';
```

### Type Imports
```typescript
import type { 
  ServiceConfig, 
  DownloadProgress, 
  SonnaConfig 
} from './utils';
```

### Example Usage
```typescript
// Initialize managers
const serviceManager = new ServiceManager();
const configManager = new ConfigManager();

// Initialize application
await configManager.initialize();

// Get service status
const status = await serviceManager.getServicesStatus();

// Start a service
const result = await serviceManager.startService('apache');
```

## Design Principles

1. **Separation of Concerns**: Each utility has a single responsibility
2. **Async/Await**: Modern async patterns throughout
3. **Error Handling**: Comprehensive error handling with meaningful messages
4. **Type Safety**: Full TypeScript typing for better development experience
5. **Scalability**: Easy to add new services and functionality
6. **Testability**: Modular design enables easy unit testing

## Adding New Services

1. Add service configuration to `ConfigManager.getDefaultConfig()`
2. Add installation verification logic to `ServiceManager.checkServiceInstallation()`
3. Add service-specific setup to `ServiceConfigurator.setupService()`
4. Add start/stop logic to `ServiceManager.spawnService()` if needed

## Error Handling

All utilities follow consistent error handling patterns:
- Return `{ success: boolean, message: string }` for operations
- Throw detailed errors for invalid inputs
- Log errors with context for debugging
- Clean up resources on failure

## Future Enhancements

- Plugin architecture for custom services
- Service dependency management
- Configuration templates
- Service health monitoring
- Backup and restore functionality 