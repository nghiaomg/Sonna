# 🚀 Sonna v1.0.0 Release Notes

## 🎉 Major Features

### ✨ System Tray Support
- **Background Operation**: App can now run in system tray
- **Service Management**: Start/stop services directly from tray menu
- **Quick Access**: Double-click tray icon to show/hide window
- **Smart Notifications**: Balloon tips for first-time users

### 🌐 Full Internationalization
- **Vietnamese Support**: Complete Vietnamese language interface
- **English Support**: Full English translation
- **Dynamic Switching**: Change language on-the-fly in Settings
- **Persistent Settings**: Language preference saved locally

### 📦 Professional Windows Installer
- **NSIS Installer**: Professional Windows installer with custom options
- **Portable Version**: Standalone executable, no installation required
- **Multiple Architectures**: Support for both x64 and x32 Windows
- **Admin Rights**: Automatic elevation for service management

## 🛠️ Technical Improvements

### 🔧 Enhanced Service Management
- **Apache 2.4.63**: Updated to latest stable Apache version
- **Improved Detection**: Better service installation verification
- **Path Resolution**: Flexible executable path detection
- **Error Recovery**: Enhanced error handling and logging

### 🎨 Modern UI/UX
- **Custom Titlebar**: Professional titlebar with window controls
- **Dropdown Menus**: Hide to tray vs. quit options
- **Visual Feedback**: Better progress indicators and status updates
- **Responsive Design**: Optimized for different screen sizes

### ⚡ Performance Optimizations
- **Background Processing**: Non-blocking service operations
- **Memory Efficiency**: Optimized resource usage when minimized
- **Fast Startup**: Improved application launch time
- **Service Isolation**: Better process management

## 📋 Windows Build Information

### 📦 Available Downloads

| File | Description | Architecture | Size |
|------|-------------|--------------|------|
| `Sonna-1.0.0-x64.exe` | Windows 64-bit Installer | x64 | ~100MB |
| `Sonna-1.0.0-ia32.exe` | Windows 32-bit Installer | ia32 | ~95MB |
| `Sonna-1.0.0-portable.exe` | Portable Version | x64 | ~100MB |
| `Sonna-1.0.0-x64.zip` | ZIP Archive 64-bit | x64 | ~80MB |
| `Sonna-1.0.0-ia32.zip` | ZIP Archive 32-bit | ia32 | ~75MB |

### 🎯 Recommended Download
**For most users**: `Sonna-1.0.0-x64.exe` (Windows 64-bit Installer)

### 📋 Installation Requirements
- **OS**: Windows 10/11 or Windows Server 2016+
- **RAM**: 4GB minimum (8GB recommended)
- **Disk**: 500MB free space
- **Admin Rights**: Required for service management

## 🔧 Installation Instructions

### Standard Installation
1. Download `Sonna-1.0.0-x64.exe`
2. Right-click → "Run as Administrator"
3. Follow installation wizard
4. Launch from Desktop or Start Menu

### Portable Installation  
1. Download `Sonna-1.0.0-portable.exe`
2. Place in desired folder
3. Right-click → "Run as Administrator"
4. App runs without installation

## 🌟 Key Features Overview

### 🧩 Service Management
- **Apache 2.4.63** - Modern web server
- **PHP 8.x** - Latest PHP runtime (downloadable)
- **MySQL 8.x** - Database server (downloadable)
- **Redis** - In-memory database (downloadable)
- **Node.js** - JavaScript runtime (downloadable)

### 🌐 Development Features
- **Virtual Hosts** - Easy .test domain creation
- **Project Detection** - Auto-discovery of local projects
- **Web Root** - Default serving from `C:\sonna\www`
- **Configuration** - Visual service configuration

### 🎨 User Experience
- **Modern UI** - Beautiful, responsive interface
- **Dark/Light Mode** - Theme switching
- **System Tray** - Background operation
- **Notifications** - Real-time status updates

## 🚨 Known Issues

### 🔍 Apache Service Starting
- **Issue**: Some users may see "Running" status but localhost:80 not accessible
- **Cause**: Path configuration mismatch
- **Fix**: Restart Apache service or refresh config in app

### 🛡️ Antivirus Warnings
- **Issue**: Some antivirus may flag the installer
- **Cause**: Unsigned executable
- **Fix**: Add exception or temporarily disable real-time protection

### 📁 C:\ Drive Permissions
- **Issue**: Installation fails on restricted systems
- **Cause**: Insufficient permissions for C:\sonna
- **Fix**: Run installer as Administrator

## 🎯 Usage Tips

### 🚀 Best Practices
1. **Run as Admin**: Always run with administrator privileges
2. **System Tray**: Use minimize to tray for background operation
3. **Service Management**: Start only needed services to save resources
4. **Project Organization**: Place projects in `C:\sonna\www` for auto-detection

### 🔧 Troubleshooting
1. **Services Won't Start**: Check Windows services dependencies
2. **Port Conflicts**: Ensure ports 80, 3306, etc. are available
3. **Permission Issues**: Run as Administrator
4. **Config Corruption**: Use "Refresh Config" button

## 🔮 Upcoming Features

### 🚀 Version 1.1 (Planned)
- **Auto-startup**: Launch with Windows
- **Docker Integration**: Container-based development
- **Plugin System**: Extensible architecture
- **Cloud Sync**: Settings synchronization

### 📱 Future Enhancements
- **Mobile Companion**: Remote management app
- **Multi-PHP**: Version switching
- **SSL Certificates**: HTTPS development
- **Database GUI**: Built-in database management

## 🤝 Support & Feedback

### 📞 Getting Help
- **GitHub Issues**: [Report bugs and request features](https://github.com/nghiaomg/sonna/issues)
- **Documentation**: [System Tray Guide](SYSTEM-TRAY-GUIDE.md)
- **Build Guide**: [BUILD-GUIDE.md](BUILD-GUIDE.md)

### 🙏 Contributors
Special thanks to the community for testing and feedback!

---

## 📝 Changelog

### v1.0.0 (2024-XX-XX)
- ✅ Initial release with system tray support
- ✅ Complete internationalization (Vietnamese/English)
- ✅ Professional Windows installer
- ✅ Enhanced service management
- ✅ Modern UI with custom titlebar
- ✅ Background operation support

---

**Download now and enjoy modern local development on Windows! 🎉** 