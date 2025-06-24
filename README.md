# 🧰 Sonna – Modern Local Development Environment for Windows

**Sonna** is a modern local web development environment manager for Windows, designed as a modern alternative to Laragon with a focus on user experience, performance, and contemporary design.

> Create – Manage – Develop local web projects with a beautiful, modern, and easy-to-use interface.

![Sonna Screenshot](public/screenshot.png)

## 🚀 Key Features

- 🧩 **Service Management** - Control Apache, Nginx, PHP, MySQL, Redis, Node.js, and more
- 🌐 **Virtual Host Management** - Easily create and manage .test and .local domains
- 🗂️ **Project Auto-Detection** - Automatically discover and manage local web projects
- 🖥️ **Integrated Terminal** - Built-in terminal for development tasks
- ⚙️ **Visual Configuration** - Configure PHP, Apache, Nginx through a graphical interface
- 🌙 **Beautiful Interface** - Modern UI with Light/Dark modes
- 🔌 **Extensible** - Plugin/extension support (in development)

## 🎯 Benefits of Using Sonna

### Modern Alternative to Laragon
Sonna delivers:
- **Modern user interface** with responsive design
- **Better performance** with optimized service management
- **Enhanced security** with proper process isolation
- **Multi-version compatibility** supporting older Windows versions

### Perfect for Developers Who Want:
- ✅ **Quick Setup** - Launch a development environment in minutes
- ✅ **Visual Control** - Manage services without command line
- ✅ **Project Organization** - Keep all local projects neatly organized
- ✅ **High Performance** - Lightweight and fast service management
- ✅ **Reliability** - Stable service handling with error recovery

## 📦 Installation

### System Requirements
- **Windows 10/11** or **Windows Server 2012 R2+**
- **4GB RAM** minimum (8GB recommended)
- **500MB** disk space

### Download & Install
1. Download the latest version from [Releases](https://github.com/nghiaomg/sonna/releases)
2. Run the installer with Administrator privileges
3. Follow the installation instructions
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

### Development
For development, you can use the following commands:
```bash
# Install dependencies
pnpm install

# Run development mode (with hot reload)
pnpm dev
# or use the batch file
dev.bat

# Build for production
pnpm build

# Create Windows installer
pnpm dist:win
```

## 🏃‍♂️ Getting Started

### First Launch
1. **Initialize Environment** - Sonna will create necessary folders and configurations
2. **Install Services** - Select the development services you want to install (PHP, Apache, MySQL, etc.)
3. **Create First Project** - Set up a new web project or import an existing one
4. **Start Developing** - Begin coding with a fully configured local environment

### Quick Setup Guide
1. Open Sonna
2. Go to the **Install** tab
3. Select the services you need (recommended: PHP + Apache + MySQL)
4. Click **Install** and wait for completion
5. Switch to the **Services** tab and start your services
6. Your development environment is ready!

## 🎨 User Interface

### Intuitive Design
- **Tab-based Navigation** - Services, Install, Cleanup sections
- **Status Indicators** - Visual feedback on service status
- **Progress Tracking** - Real-time installation and operation progress
- **Responsive Layout** - Works well on different screen sizes

### Accessibility
- **Keyboard Navigation** support
- **Screen Reader** friendly
- **High Contrast** mode support
- **Customizable** interface elements

## 🔧 Configuration

### Service Configuration
- **Apache** - Document root directory, virtual hosts, modules
- **PHP** - Version switching, extensions, php.ini settings
- **MySQL** - Database management, user accounts
- **Nginx** - Alternative web server configuration

### Project Settings
- **Auto-detection** of local projects
- **Custom domains** (.test, .local, .dev)
- **SSL certificates** for HTTPS development
- **Environment variable** management

## 🔒 Security & Privacy

### Security Features
- **Process Isolation** - Services run in separate processes
- **Permission Management** - Minimum required permissions
- **Secure by Default** - Safe configurations out of the box
- **Regular Updates** - Security patches and improvements

### Privacy
- **No Tracking Data** - We don't collect usage data
- **Local Operation** - Everything runs on your machine
- **Open Source** - Complete transparency in code

## 📝 License

MIT License - See the [LICENSE](LICENSE) file for details.

## 📞 Contact

**Developer**: nghiaomg  
**GitHub**: [https://github.com/nghiaomg](https://github.com/nghiaomg)  
**Project**: [https://github.com/nghiaomg/sonna](https://github.com/nghiaomg/sonna)

---

*Built with ❤️ to modernize local development on Windows*