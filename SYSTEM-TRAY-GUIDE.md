# 🔧 Hướng Dẫn Sử Dụng System Tray - Sonna

## ✨ Tính Năng Mới: Chạy Ngầm

Sonna giờ đây có thể chạy ngầm trong system tray (khay hệ thống), cho phép bạn duy trì các server đang chạy ngay cả khi đóng cửa sổ chính.

## 🚀 Cách Sử Dụng

### 1. Minimize to Tray
- **Cách 1:** Click vào nút dropdown ở góc phải titlebar → chọn "Thu nhỏ vào khay"
- **Cách 2:** Click nút X (close) - app sẽ tự động minimize thay vì thoát
- **Kết quả:** App biến mất khỏi taskbar nhưng icon vẫn hiện trong system tray

### 2. Quản Lý Services từ System Tray
Khi app đang chạy ngầm, bạn có thể:

- **Right-click vào icon** trong system tray để mở menu
- **Xem trạng thái** của tất cả services (Apache, MySQL, etc.)
- **Start/Stop services** trực tiếp từ menu
- **Khởi động tất cả** services cùng lúc
- **Dừng tất cả** services cùng lúc

### 3. Mở Lại Cửa Sổ Chính
- **Double-click** vào icon trong system tray
- Hoặc **right-click → "Mở Sonna"**

### 4. Thoát Hoàn Toàn
- **Right-click** vào icon trong system tray → **"Thoát"**
- Hoặc từ cửa sổ chính: **dropdown menu → "Thoát ứng dụng"**

## 🎯 Lợi Ích

### ⚡ Hiệu Suất
- **Tiết kiệm tài nguyên** - App chỉ chạy process cần thiết
- **Khởi động nhanh** - Không cần load lại toàn bộ UI
- **Services liên tục** - Apache, MySQL tiếp tục hoạt động

### 🔄 Tiện Lợi
- **Quản lý nhanh** - Start/stop services mà không cần mở app
- **Luôn sẵn sàng** - Services chạy ngầm cho development
- **Thông báo tự động** - Hiển thị khi minimize lần đầu

### 🛡️ Ổn Định
- **Process isolation** - Services chạy độc lập
- **Tự động cleanup** - Dọn dẹp khi thoát hoàn toàn
- **Error recovery** - Phục hồi services nếu có lỗi

## 📋 Menu System Tray

```
┌─────────────────────────────────┐
│ Sonna - Local Dev Environment   │
├─────────────────────────────────┤
│ Apache (Đang chạy)             │ ← Click để toggle
│ MySQL (Dừng)                   │ ← Click để toggle
│ PHP (Chưa cài đặt)             │ ← Không thể click
├─────────────────────────────────┤
│ Mở Sonna                       │
│ Khởi động tất cả dịch vụ       │
│ Dừng tất cả dịch vụ            │
├─────────────────────────────────┤
│ Thoát                          │
└─────────────────────────────────┘
```

## ⚙️ Cấu Hình

### Auto-start với Windows (Tương lai)
- Tính năng này sẽ được thêm trong phiên bản tiếp theo
- Cho phép Sonna tự khởi động cùng Windows
- Services sẽ tự động start nếu được cấu hình

### Notifications
- **Lần đầu minimize:** Hiển thị balloon notification hướng dẫn
- **Service changes:** Thông báo khi services start/stop (tùy chọn)
- **Error alerts:** Cảnh báo khi có lỗi services

## 🔧 Troubleshooting

### Icon không hiện trong system tray
1. Kiểm tra Windows notification settings
2. Restart app với quyền Administrator
3. Check antivirus software blocking

### Services không start từ tray menu
1. Kiểm tra services đã được cài đặt chưa
2. Restart app với quyền Administrator
3. Check Windows services dependencies

### App không response từ tray
1. End process trong Task Manager
2. Restart app
3. Check system resources

## 🎯 Best Practices

### Development Workflow
1. **Khởi động Sonna** → Start needed services
2. **Minimize to tray** → App chạy ngầm
3. **Phát triển dự án** → Services vẫn chạy
4. **Quick toggle** từ tray khi cần

### Resource Management
- **Dừng services không cần** để tiết kiệm RAM
- **Monitor system resources** qua Task Manager
- **Restart services** nếu gặp vấn đề

---

## 🏆 Kết Luận

Tính năng System Tray giúp Sonna trở thành một công cụ development environment thực sự tiện lợi, cho phép bạn:

- ✅ **Làm việc liên tục** mà không lo services bị gián đoạn
- ✅ **Quản lý nhanh chóng** từ system tray
- ✅ **Tiết kiệm tài nguyên** khi không cần UI
- ✅ **Tăng productivity** với workflow mượt mà

**Enjoy your local development! 🚀** 