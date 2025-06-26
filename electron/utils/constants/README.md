# Sonna Constants System

Hệ thống constants tập trung để quản lý tất cả các đường dẫn trong Sonna, giúp dễ dàng thay đổi cấu hình khi cần.

## 📁 Cấu trúc

```
constants/
├── paths.ts          # Định nghĩa các class quản lý đường dẫn
├── index.ts          # Export tất cả constants và utilities  
└── README.md         # Documentation này
```

## 🏗️ Kiến trúc

### 1. SonnaPaths - Đường dẫn cơ bản
```typescript
import { SonnaPaths } from '@/utils/constants';

// Đường dẫn gốc (mặc định: C:/sonna)
SonnaPaths.BASE_PATH

// Các thư mục con
SonnaPaths.APPLICATIONS_PATH  // C:/sonna/applications
SonnaPaths.WWW_PATH          // C:/sonna/www  
SonnaPaths.DOWNLOADS_PATH    // C:/sonna/downloads
SonnaPaths.CONFIG_PATH       // C:/sonna/conf
SonnaPaths.DATA_PATH         // C:/sonna/data
SonnaPaths.TEMP_PATH         // C:/sonna/tmp
SonnaPaths.BACKUPS_PATH      // C:/sonna/backups
SonnaPaths.CONFIG_FILE       // C:/sonna/config.json
```

### 2. ServicePaths - Đường dẫn services
```typescript
import { ServicePaths } from '@/utils/constants';

// Services cố định
ServicePaths.APACHE_PATH      // C:/sonna/applications/apache
ServicePaths.NGINX_PATH       // C:/sonna/applications/nginx
ServicePaths.MYSQL_PATH       // C:/sonna/applications/mysql
ServicePaths.PHPMYADMIN_PATH  // C:/sonna/applications/phpmyadmin

// Services có version
ServicePaths.getPhpPath('8.4')     // C:/sonna/applications/php/8.4
ServicePaths.getPhpConfig('8.4')   // C:/sonna/applications/php/8.4/php.ini
ServicePaths.getPhpDll('8.4')      // C:/sonna/applications/php/8.4/php8apache2_4.dll

// Executables
ServicePaths.APACHE_EXECUTABLE    // C:/sonna/applications/apache/Apache24/bin/httpd.exe
ServicePaths.getPhpExecutable('8.4') // C:/sonna/applications/php/8.4/php.exe
```

### 3. ConfigPaths - Đường dẫn config files
```typescript
import { ConfigPaths } from '@/utils/constants';

ConfigPaths.APACHE_CONFIG_OUTPUT     // C:/sonna/conf/apache/httpd.conf
ConfigPaths.NGINX_CONFIG_OUTPUT      // C:/sonna/conf/nginx/nginx.conf
ConfigPaths.MYSQL_CONFIG_OUTPUT      // C:/sonna/conf/mysql/my.cnf
ConfigPaths.PHP_CONFIG_OUTPUT        // C:/sonna/conf/php
```

### 4. Constants và Utilities
```typescript
import { PHP_VERSIONS, DEFAULT_PORTS, PathUtils } from '@/utils/constants';

// Versions được hỗ trợ
PHP_VERSIONS     // ['8.4', '8.3', '8.2', '8.1', '8.0', '7.4']
NODEJS_VERSIONS  // ['20', '18', '16']

// Ports mặc định
DEFAULT_PORTS.APACHE   // 80
DEFAULT_PORTS.NGINX    // 8080
DEFAULT_PORTS.MYSQL    // 3306

// Path utilities
PathUtils.toUnixPath('C:\\sonna\\www')        // 'C:/sonna/www'
PathUtils.toWindowsPath('C:/sonna/www')       // 'C:\\sonna\\www'
PathUtils.join('C:/sonna', 'applications')    // 'C:/sonna/applications'
```

## 🔧 Thay đổi đường dẫn cài đặt

### 1. Khi user thay đổi installation path:
```typescript
import { SonnaPaths } from '@/utils/constants';

// Cập nhật base path (tự động cập nhật tất cả paths khác)
SonnaPaths.setBasePath('D:/my-sonna');

// Bây giờ tất cả paths sẽ thay đổi:
// SonnaPaths.APPLICATIONS_PATH -> 'D:/my-sonna/applications'
// SonnaPaths.WWW_PATH -> 'D:/my-sonna/www'
// ServicePaths.APACHE_PATH -> 'D:/my-sonna/applications/apache'
```

### 2. Sử dụng PathInitializer:
```typescript
import { PathInitializer } from '@/utils/path-initializer';

const pathInitializer = new PathInitializer();

// Khởi tạo từ config khi app start
await pathInitializer.initializeFromConfig();

// Cập nhật khi user thay đổi
const result = await pathInitializer.updateInstallationPath('D:/my-sonna');
```

## 📝 Quy tắc sử dụng

### ✅ DO - Nên làm:
```typescript
// Sử dụng constants thay vì hardcode
const phpPath = ServicePaths.getPhpPath('8.4');  // ✅
const apacheConfig = ServicePaths.APACHE_CONFIG;  // ✅

// Sử dụng trong loops
PHP_VERSIONS.forEach(version => {               // ✅
  const path = ServicePaths.getPhpPath(version);
});
```

### ❌ DON'T - Không nên làm:
```typescript
// Hardcode paths
const phpPath = 'C:/sonna/applications/php/8.4';     // ❌
const apacheConfig = 'C:/sonna/applications/apache'; // ❌

// Direct string concatenation
const phpPath = `${basePath}/applications/php/8.4`;  // ❌ (dùng ServicePaths.getPhpPath())
```

## 🔄 Migration từ hardcode paths

### Trước:
```typescript
const wwwPath = 'C:/sonna/www';
const phpPath = 'C:/sonna/applications/php/8.4';
const apachePath = 'C:/sonna/applications/apache';
```

### Sau:
```typescript
import { SonnaPaths, ServicePaths } from '@/utils/constants';

const wwwPath = SonnaPaths.WWW_PATH;
const phpPath = ServicePaths.getPhpPath('8.4');  
const apachePath = ServicePaths.APACHE_PATH;
```

## 🧪 Testing

```typescript
import { SonnaPaths, getAllPaths } from '@/utils/constants';

// Test với custom path
SonnaPaths.setBasePath('/tmp/test-sonna');

// Verify all paths updated
const paths = getAllPaths();
console.log(paths);

// Reset về default
SonnaPaths.setBasePath('C:/sonna');
```

## 🎯 Benefits

1. **Centralized Management**: Tất cả paths ở một nơi
2. **Easy Updates**: Thay đổi base path tự động cập nhật tất cả
3. **Type Safety**: TypeScript support với auto-completion  
4. **Consistency**: Đảm bảo format paths nhất quán
5. **Maintainability**: Dễ bảo trì và refactor

## ⚠️ Lưu ý

- **Scripts**: Node.js scripts cần định nghĩa constants riêng (không thể import TypeScript)
- **Performance**: Constants được tính toán dynamic, có thể cache nếu cần
- **Path Format**: Luôn sử dụng forward slashes (`/`) trong internal paths
- **Windows Compatibility**: Sử dụng `PathUtils` để convert khi cần 