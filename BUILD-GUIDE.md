# 🔨 Hướng Dẫn Build Sonna cho Windows

## 🎯 Tổng Quan

Hướng dẫn này sẽ giúp bạn build ứng dụng Sonna thành file cài đặt Windows (.exe) và các format khác.

## 🛠️ Yêu Cầu Hệ Thống

### Phần Mềm Cần Thiết
- **Node.js** v16+ (khuyến nghị v18+)
- **npm** v8+
- **Git** (để clone source code)
- **Windows 10/11** hoặc **Windows Server 2016+**

### Kiểm Tra Phiên Bản
```bash
node --version   # v18.x.x hoặc cao hơn
npm --version    # v8.x.x hoặc cao hơn
```

## 📦 Các Loại Build

Sonna hỗ trợ nhiều format build cho Windows:

| Format | Mô Tả | Lệnh Build |
|--------|-------|------------|
| **NSIS Installer** | File .exe cài đặt chuẩn Windows | `npm run dist:win` |
| **Portable** | File .exe chạy độc lập, không cần cài đặt | `npm run dist:portable` |
| **ZIP Archive** | File nén chứa app, giải nén và chạy | `npm run dist:win` |
| **64-bit** | Build cho Windows 64-bit | `npm run dist:win64` |
| **32-bit** | Build cho Windows 32-bit | `npm run dist:win32` |

## 🚀 Cách Build

### Phương Pháp 1: Build Script Tự Động (Khuyến nghị)
```bash
# Chạy script build tự động
.\build-windows.bat
```

### Phương Pháp 2: Build Thủ Công
```bash
# 1. Cài đặt dependencies
npm install

# 2. Build source code
npm run build

# 3. Tạo installer Windows
npm run dist:win
```

### Phương Pháp 3: Build Từng Loại
```bash
# Build 64-bit installer
npm run dist:win64

# Build 32-bit installer  
npm run dist:win32

# Build portable version
npm run dist:portable

# Build tất cả
npm run dist
```

## 📁 Cấu Trúc Output

Sau khi build thành công, files sẽ được tạo trong thư mục `release/`:

```
release/
├── Sonna-1.0.0-x64.exe              # Windows 64-bit installer
├── Sonna-1.0.0-ia32.exe             # Windows 32-bit installer
├── Sonna-1.0.0-portable.exe         # Portable version
├── Sonna-1.0.0-x64.zip              # ZIP archive 64-bit
├── Sonna-1.0.0-ia32.zip             # ZIP archive 32-bit
└── latest.yml                       # Update metadata
```

## ⚙️ Cấu Hình Build

### Package.json Scripts
```json
{
  "scripts": {
    "build": "tsc -p electron && vite build",
    "dist": "npm run build && electron-builder",
    "dist:win": "npm run build && electron-builder --win",
    "dist:win64": "npm run build && electron-builder --win --x64",
    "dist:win32": "npm run build && electron-builder --win --ia32",
    "dist:portable": "npm run build && electron-builder --win portable",
    "build:win": "npm run build && npm run dist:win"
  }
}
```

### Electron-Builder Configuration
```json
{
  "build": {
    "appId": "com.sonna.app",
    "productName": "Sonna",
    "description": "Modern Local Development Environment for Windows",
    "win": {
      "target": ["nsis", "portable", "zip"],
      "icon": "public/logo.ico",
      "requestedExecutionLevel": "requireAdministrator"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

## 🎨 Customization

### Thay Đổi Icon
1. Thay file `public/logo.ico` (256x256px, .ico format)
2. Rebuild: `npm run dist:win`

### Cập Nhật Thông Tin App
```json
// package.json
{
  "name": "sonna",
  "version": "1.0.0",
  "description": "Modern Local Development Environment",
  "build": {
    "productName": "Sonna",
    "copyright": "Copyright © 2024 nghiaomg"
  }
}
```

### Custom Installer Script
Chỉnh sửa `build/installer.nsh` để:
- Tạo thêm thư mục
- Set registry keys
- Add custom installation steps
- Configure uninstaller behavior

## 🚨 Troubleshooting

### Lỗi Thường Gặp

#### 1. "electron-builder not found"
```bash
# Cài đặt lại dependencies
npm install
# Hoặc cài đặt global
npm install -g electron-builder
```

#### 2. "Icon file not found"
```bash
# Kiểm tra file icon tồn tại
ls public/logo.ico
# Hoặc copy icon mẫu
cp public/vite.svg public/logo.ico
```

#### 3. "Permission denied"
```bash
# Chạy với quyền Administrator
# Right-click PowerShell → "Run as Administrator"
npm run dist:win
```

#### 4. "Build fails on dependencies"
```bash
# Clear cache và reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Debug Build Process
```bash
# Build với verbose output
DEBUG=electron-builder npm run dist:win

# Kiểm tra electron-builder config
npx electron-builder --help
```

## 📋 Build Checklist

### Trước Khi Build
- [ ] Code đã được test và hoạt động tốt
- [ ] Version trong `package.json` đã cập nhật
- [ ] Icon và assets đã được chuẩn bị
- [ ] Dependencies đã được cài đặt đầy đủ

### Sau Khi Build
- [ ] Test installer trên máy clean Windows
- [ ] Kiểm tra file size hợp lý
- [ ] Test uninstaller hoạt động đúng
- [ ] Verify digital signature (nếu có)

## 🎯 Production Build

### Tối Ưu Cho Production
```bash
# Set NODE_ENV cho production
set NODE_ENV=production
npm run dist:win

# Hoặc build với optimization
npm run build && npm run dist:win -- --publish=never
```

### Code Signing (Tùy chọn)
```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.p12",
      "certificatePassword": "password",
      "signtool": "signtool.exe",
      "signDlls": true
    }
  }
}
```

## 📈 Performance Tips

### Giảm Size Build
1. **Exclude không cần thiết:**
```json
{
  "files": [
    "!**/*.ts",
    "!src/",
    "!electron/*.ts",
    "!node_modules/.cache"
  ]
}
```

2. **Compress executable:**
```json
{
  "nsis": {
    "differentialPackage": false
  },
  "compression": "maximum"
}
```

### Tăng Tốc Build
1. **Sử dụng cache:**
```bash
# Enable electron cache
export ELECTRON_CACHE=/tmp/electron-cache
npm run dist:win
```

2. **Parallel builds:**
```json
{
  "build": {
    "buildDependenciesFromSource": false,
    "nodeGypRebuild": false
  }
}
```

---

## 🏆 Kết Luận

Với hướng dẫn này, bạn có thể:
- ✅ Build Sonna thành installer Windows professional
- ✅ Tạo multiple formats (installer, portable, zip)
- ✅ Customize installer theo nhu cầu
- ✅ Troubleshoot các vấn đề thường gặp
- ✅ Optimize cho production release

**Happy Building! 🚀** 