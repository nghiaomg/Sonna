# 🧰 Sonna – Modern Local Development Environment for Windows

**Sonna** is a modern local web development environment manager for Windows, built as a replacement for Laragon with a focus on user experience, performance, and modern design.

> Create – Manage – Develop web projects locally with a beautiful, modern, and easy-to-use interface.

---

## 🚀 Key Features

- 🧩 **Service Management** - Control Apache, Nginx, PHP, MySQL, Redis, Node.js, and more
- 🌐 **Virtual Host Management** - Easy creation and management of .test, .local domains
- 🗂️ **Automatic Project Detection** - Discover and manage local web projects
- 🖥️ **Integrated Terminal** - Built-in terminal for development tasks
- ⚙️ **Visual Configuration** - Configure PHP, Apache, Nginx through GUI
- 🌙 **Beautiful UI** - Modern Light/Dark mode interface
- 🔌 **Extensible** - Plugin/extension support (planned)

---

## 🎯 Why Sonna?

### Modern Alternative to Laragon
While Laragon has been a reliable tool for local development, Sonna brings:
- **Modern UI/UX** with responsive design
- **Better Performance** with optimized service management
- **Enhanced Security** with proper process isolation
- **Cross-version Compatibility** supporting older Windows versions
- **Future-ready Architecture** built for extensibility

### Perfect for Developers Who Want:
- ✅ **Quick Setup** - Get development environment running in minutes
- ✅ **Visual Control** - Manage services without command line
- ✅ **Project Organization** - Keep all local projects organized
- ✅ **Performance** - Lightweight and fast service management
- ✅ **Reliability** - Stable service handling with proper error recovery

---

## 📦 Installation

### System Requirements
- **Windows 10/11** or **Windows Server 2012 R2+**
- **4GB RAM** minimum (8GB recommended)
- **500MB** free disk space

### Download & Install
1. Download the latest release from [Releases](https://github.com/nghiaomg/sonna/releases)
2. Run the installer as Administrator
3. Follow the installation wizard
4. Launch Sonna and initialize your development environment

### Build from Source
```bash
# Clone repository
git clone https://github.com/nghiaomg/sonna.git
cd sonna

# Install dependencies
npm install

# Run development mode
npm run dev

# Build production
npm run build
```

---

## 🏃‍♂️ Getting Started

### First Launch
1. **Initialize Environment** - Sonna will create necessary directories and configurations
2. **Install Services** - Choose which development services to install (PHP, Apache, MySQL, etc.)
3. **Create Your First Project** - Set up a new web project or import existing ones
4. **Start Development** - Begin coding with your fully configured local environment

### Quick Setup Guide
1. Open Sonna
2. Go to **Install** tab
3. Select services you need (recommended: PHP + Apache + MySQL)
4. Click **Install** and wait for completion
5. Switch to **Services** tab and start your services
6. Your development environment is ready!

---

## 🎨 User Interface

### Intuitive Design
- **Tab-based Navigation** - Services, Install, Cleanup sections
- **Status Indicators** - Visual feedback for service states
- **Progress Tracking** - Real-time installation and operation progress
- **Responsive Layout** - Works well on different screen sizes

### Accessibility
- **Keyboard Navigation** support
- **Screen Reader** friendly
- **High Contrast** mode support
- **Customizable** interface elements

---

## 🔧 Configuration

### Service Configuration
- **Apache** - Document root, virtual hosts, modules
- **PHP** - Version switching, extensions, php.ini settings
- **MySQL** - Database management, user accounts
- **Nginx** - Alternative web server configuration

### Project Settings
- **Auto-discovery** of local projects
- **Custom domains** (.test, .local, .dev)
- **SSL certificates** for HTTPS development
- **Environment variables** management

---

## 🎯 Roadmap

### Current Version (v1.0)
- ✅ **Core Service Management** - Start/stop/install services
- ✅ **Modern UI** - Beautiful, responsive interface
- ✅ **Basic Project Management** - Project discovery and organization

### Upcoming Features
- 🔄 **Auto-updates** - Seamless application updates
- 🔌 **Plugin System** - Extend functionality with plugins
- 🐳 **Docker Integration** - Container-based development
- 📱 **Mobile Companion** - Remote management app
- ☁️ **Cloud Sync** - Synchronize settings across devices

---

## 📊 Performance

### System Impact
- **Low Memory Usage** - Optimized for minimal resource consumption
- **Fast Startup** - Quick application launch and service initialization
- **Efficient Service Management** - Smart process handling
- **Background Processing** - Non-blocking operations

### Benchmarks
- **Service Start Time** - 2-5 seconds typical
- **Memory Footprint** - ~50MB base application
- **CPU Usage** - <1% during idle, <5% during operations

---

## 🔒 Security & Privacy

### Security Features
- **Process Isolation** - Services run in separate processes
- **Permission Management** - Minimal required privileges
- **Secure Defaults** - Safe configuration out of the box
- **Regular Updates** - Security patches and improvements

### Privacy
- **No Telemetry** - We don't collect usage data
- **Local Operation** - Everything runs on your machine
- **Open Source** - Full transparency in code

---

## 📝 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

## 🤝 Community & Support

### Getting Help
- 📖 **Documentation** - Comprehensive guides and tutorials
- 💬 **Discord** - Join our community for real-time help
- 🐛 **Issues** - Report bugs and request features on GitHub
- 📧 **Contact** - Direct support for critical issues

### Contributing
We welcome contributions from the community:
- 🔧 **Bug Fixes** - Help improve stability
- ✨ **Features** - Add new functionality
- 📝 **Documentation** - Improve guides and tutorials
- 🎨 **Design** - Enhance user interface

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🙏 Acknowledgments

- **Laragon Team** - For inspiration and showing what's possible
- **Electron Community** - For the amazing desktop framework
- **Contributors** - Everyone who helps make Sonna better

---

## 📞 Contact

**Developer**: nghiaomg  
**GitHub**: [https://github.com/nghiaomg](https://github.com/nghiaomg)  
**Project**: [https://github.com/nghiaomg/sonna](https://github.com/nghiaomg/sonna)

---

*Built with ❤️ to modernize local development on Windows*