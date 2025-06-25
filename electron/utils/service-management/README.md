# Service Management Module

This module provides a SOLID-compliant service management system for Sonna application. It follows the Single Responsibility Principle, Open/Closed Principle, Liskov Substitution Principle, Interface Segregation Principle, and Dependency Inversion Principle.

## Architecture Overview

The service management system is divided into several specialized components:

### Interfaces (`/interfaces`)
Core interfaces that define contracts for all components:
- `IServiceChecker` - Service installation checking
- `IServiceRunner` - Service start/stop operations
- `IConfigReader` - Configuration file operations
- `IServiceStatusProvider` - Service status tracking
- `IFileSystem` - File system operations abstraction

### Base Classes (`/base`)
Abstract base classes providing common functionality:
- `BaseServiceChecker` - Common service checking utilities and logging

### Service Checkers (`/checkers`)
Specialized implementations for checking service installations:
- `ApacheServiceChecker` - Apache-specific installation verification
- `MySQLServiceChecker` - MySQL-specific installation verification  
- `NginxServiceChecker` - Nginx-specific installation verification
- `SimpleServiceChecker` - Generic checker for PHP, Redis, Node.js, phpMyAdmin

### Service Runners (`/runners`)
Process management implementations:
- `ProcessServiceRunner` - Manages service processes using child_process.spawn

### Providers (`/providers`)
Infrastructure implementations:
- `FileSystemProvider` - File system operations using Node.js fs module
- `ConfigReaderProvider` - JSON configuration file management

### Factories (`/factories`)
Factory pattern implementations:
- `ServiceCheckerFactory` - Creates appropriate service checker instances

### Services (`/services`)
High-level service implementations:
- `ServiceStatusProvider` - Orchestrates status checking across all services

## Main ServiceManager

The `ServiceManager` class serves as the main orchestrator that:
- Implements dependency injection for all components
- Provides a unified API for service operations
- Delegates specific responsibilities to specialized classes

## Usage

```typescript
import { ServiceManager } from './service-management';

// Create service manager instance
const serviceManager = new ServiceManager('C:/sonna/config.json');

// Get service status
const status = await serviceManager.getServicesStatus();

// Start a service
const result = await serviceManager.startService('apache');

// Stop a service
const stopResult = await serviceManager.stopService('apache');

// Cleanup on application exit
await serviceManager.cleanup();
```

## SOLID Principles Applied

### Single Responsibility Principle (SRP)
- Each class has one reason to change
- `ApacheServiceChecker` only handles Apache checking logic
- `ProcessServiceRunner` only handles process management
- `ConfigReaderProvider` only handles configuration operations

### Open/Closed Principle (OCP)
- Easy to add new service types without modifying existing code
- Add new checker by extending `BaseServiceChecker`
- Factory pattern allows adding new checkers without changing factory logic

### Liskov Substitution Principle (LSP)
- All service checkers are interchangeable through `IServiceChecker` interface
- All implementations properly fulfill their interface contracts

### Interface Segregation Principle (ISP)
- Interfaces are focused and specific to their purpose
- No class is forced to implement methods it doesn't need
- `IServiceRunner` separate from `IServiceChecker`

### Dependency Inversion Principle (DIP)
- High-level modules don't depend on low-level modules
- Dependencies are injected through interfaces
- `ServiceManager` depends on abstractions, not concrete implementations

## Benefits

1. **Maintainability**: Each component has clear responsibility
2. **Extensibility**: Easy to add new services or modify existing ones
3. **Testability**: Each component can be unit tested independently
4. **Reusability**: Components can be reused in different contexts
5. **Type Safety**: Full TypeScript support with clear interfaces
6. **Loose Coupling**: Components interact through interfaces

## Adding New Services

To add a new service type:

1. Create a specific checker in `/checkers` if needed, or use `SimpleServiceChecker`
2. Update `ServiceCheckerFactory` to return appropriate checker
3. Add service configuration to config file
4. No changes needed to other components (follows OCP)

## Error Handling

- All methods return proper error states
- Graceful degradation when services fail
- Comprehensive logging for debugging
- No exceptions thrown in normal operation flows 