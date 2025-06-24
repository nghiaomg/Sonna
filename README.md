# 🧰 Sonna – Modern Local Dev Environment for Windows

**Sonna** là một phần mềm quản lý môi trường phát triển web trên Windows, được xây dựng bằng **Electron + React**, với mục tiêu hiện đại hóa và thay thế cho **Laragon**.

> Tạo – Quản lý – Phát triển dự án web ngay trên máy bạn, với giao diện đẹp, hiện đại và dễ dùng.

---

## 🚀 Tính năng chính

- 🧩 **Quản lý dịch vụ** (Apache, Nginx, PHP, MySQL, Redis, Node.js, v.v.)
- 🌐 **Tạo và quản lý Virtual Hosts** (.test, .local, v.v.)
- 🗂️ **Tự động phát hiện và mở các dự án web local**
- 🖥️ **Terminal tích hợp**
- ⚙️ **Cấu hình PHP, Apache, Nginx qua giao diện**
- 🌙 **Giao diện Light/Dark Mode đẹp mắt**
- 🔌 **Hỗ trợ mở rộng qua plugins/extensions** (trong tương lai)

---

## 🏗️ Kiến trúc & Tech Stack

### Frontend
- **React 19** với **TypeScript**
- **Vite** cho build tool hiện đại
- **TailwindCSS** cho styling
- **shadcn/ui** + **Radix UI** cho components
- **Lucide React** cho icons

### Desktop Application
- **Electron 22** (hỗ trợ Windows Server 2012 R2+)
- **IPC Bridge** bảo mật giữa main và renderer process
- **Context Isolation** và **Preload Scripts**

### Backend Services
- **Node.js child_process** cho quản lý start/stop services
- **IPC Communication** cho real-time status updates

### Configuration
- **YAML + JSON** configuration files
- **TypeScript** cho type safety
- **ESLint** cho code quality

---

## 📦 Cài đặt

### Yêu cầu hệ thống
- **Windows 10/11** hoặc **Windows Server 2012 R2+**
- **Node.js 18+**
- **pnpm** (recommended) hoặc npm

### Tự build từ source

```bash
# Clone repository
git clone https://github.com/nghiaomg/sonna.git
cd sonna

# Cài đặt dependencies
pnpm install

# Chạy development mode
pnpm run dev

# Build production
pnpm run build

# Tạo installer
pnpm run dist
```

### Development Scripts

```bash
# Chạy app ở development mode
pnpm run dev

# Build TypeScript cho Electron main process
pnpm run build:electron

# Build toàn bộ app (React + Electron)
pnpm run build

# Tạo Windows installer
pnpm run dist

# Lint code
pnpm run lint
```

---

## 🎨 Giao diện

### Light/Dark Mode Support
- **Automatic theme detection**
- **Manual theme toggle**
- **Consistent design system** với shadcn/ui

### Responsive Design
- **Desktop-first** design
- **Flexible grid layout**
- **Modern card-based UI**

### Service Management UI
- **Real-time status indicators**
- **One-click service toggle**
- **Bulk operations** (Start All/Stop All)
- **Port information display**

---

## 🔧 Configuration

### Electron Settings
- **Security-first** với context isolation
- **IPC communication** cho service management
- **Administrator privileges** khi cần thiết

### Build Configuration
- **Multi-architecture support** (x64, ia32)
- **NSIS installer** với options tùy chỉnh
- **Auto-update support** (planned)

---

## 🏃‍♂️ Development

### Project Structure
```
sonna/
├── electron/           # Electron main process
│   ├── main.ts        # Main process entry point
│   ├── preload.ts     # Preload script for IPC
│   └── tsconfig.json  # TypeScript config for Electron
├── src/               # React frontend
│   ├── components/    # UI components
│   │   └── ui/       # shadcn/ui components
│   ├── lib/          # Utilities
│   ├── App.tsx       # Main React component
│   └── main.tsx      # React entry point
├── public/            # Static assets
├── dist/             # Build output (React)
└── release/          # Electron build output
```

### Available Components
- **Button** - Primary, secondary, destructive variants
- **Card** - Header, content, footer layout
- **Switch** - For service toggles
- **Dialog, Dropdown, Tabs, Tooltip** (ready to use)

### Theme System
- **CSS Custom Properties** cho colors
- **TailwindCSS** utilities
- **Dark mode** via class switching

---

## 🔒 Security

### Electron Security
- **Context Isolation** enabled
- **Node Integration** disabled
- **Secure IPC** communication only
- **Preload scripts** cho controlled access

### Service Management
- **Administrator privileges** khi cần
- **Process isolation** cho services
- **Error handling** và logging

---

## 🛠️ Planned Features

- [ ] **Real service integration** (Apache, MySQL, etc.)
- [ ] **Virtual host management**
- [ ] **Project auto-detection**
- [ ] **Integrated terminal**
- [ ] **PHP version switching**
- [ ] **SSL certificate management**
- [ ] **Docker integration**
- [ ] **Plugin system**

---

## 📝 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

## 🤝 Contributing

Contributions, issues và feature requests đều được chào đón!

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Author

**nghiaomg** - [GitHub](https://github.com/nghiaomg)

---

*Được tạo với ❤️ để hiện đại hóa local development trên Windows*