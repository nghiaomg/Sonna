# 🧰 Sonna – Môi Trường Phát Triển Web Hiện Đại Cho Windows

**Sonna** là một công cụ quản lý môi trường phát triển web cục bộ hiện đại dành cho Windows, được thiết kế để thay thế Laragon với trọng tâm là trải nghiệm người dùng, hiệu suất và thiết kế hiện đại.

> Tạo – Quản lý – Phát triển dự án web cục bộ với giao diện đẹp, hiện đại và dễ sử dụng.

![Sonna Screenshot](public/screenshot.png)

## 🚀 Tính Năng Chính

- 🧩 **Quản lý Dịch vụ** - Điều khiển Apache, Nginx, PHP, MySQL, Redis, Node.js, và nhiều dịch vụ khác
- 🌐 **Quản lý Virtual Host** - Tạo và quản lý dễ dàng các tên miền .test, .local
- 🗂️ **Tự động Phát hiện Dự án** - Tự động tìm và quản lý các dự án web cục bộ
- 🖥️ **Integrated Terminal** - Built-in terminal for development tasks
- ⚙️ **Cấu hình Trực quan** - Cấu hình PHP, Apache, Nginx thông qua giao diện đồ họa
- 🌙 **Giao diện Đẹp** - Giao diện hiện đại với chế độ Sáng/Tối
- 🔌 **Có thể mở rộng** - Hỗ trợ plugin/extension (đang phát triển)

## 🎯 Lợi Ích Khi Sử Dụng Sonna

### Giải pháp Thay thế Hiện đại cho Laragon
Sonna mang đến:
- **Giao diện người dùng hiện đại** với thiết kế đáp ứng
- **Hiệu suất tốt hơn** với quản lý dịch vụ được tối ưu hóa
- **Bảo mật nâng cao** với cách ly quy trình phù hợp
- **Tương thích đa phiên bản** hỗ trợ các phiên bản Windows cũ hơn

### Hoàn hảo cho Lập trình viên Muốn:
- ✅ **Thiết lập nhanh chóng** - Khởi chạy môi trường phát triển trong vài phút
- ✅ **Điều khiển trực quan** - Quản lý dịch vụ mà không cần dòng lệnh
- ✅ **Tổ chức dự án** - Giữ tất cả dự án cục bộ được tổ chức gọn gàng
- ✅ **Hiệu suất cao** - Quản lý dịch vụ nhẹ và nhanh
- ✅ **Đáng tin cậy** - Xử lý dịch vụ ổn định với khả năng phục hồi lỗi

## 📦 Cài Đặt

### Yêu cầu Hệ thống
- **Windows 10/11** hoặc **Windows Server 2012 R2+**
- **RAM 4GB** tối thiểu (khuyến nghị 8GB)
- **500MB** dung lượng ổ đĩa trống

### Tải xuống & Cài đặt
1. Tải phiên bản mới nhất từ [Releases](https://github.com/nghiaomg/sonna/releases)
2. Chạy trình cài đặt với quyền Administrator
3. Làm theo hướng dẫn cài đặt
4. Khởi chạy Sonna và khởi tạo môi trường phát triển của bạn

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

## 🏃‍♂️ Bắt Đầu

### Lần Khởi chạy Đầu tiên
1. **Khởi tạo Môi trường** - Sonna sẽ tạo các thư mục và cấu hình cần thiết
2. **Cài đặt Dịch vụ** - Chọn dịch vụ phát triển bạn muốn cài đặt (PHP, Apache, MySQL, v.v.)
3. **Tạo Dự án Đầu tiên** - Thiết lập dự án web mới hoặc nhập dự án hiện có
4. **Bắt đầu Phát triển** - Bắt đầu lập trình với môi trường cục bộ đã được cấu hình đầy đủ

### Hướng dẫn Thiết lập Nhanh
1. Mở Sonna
2. Đi đến tab **Cài đặt**
3. Chọn dịch vụ bạn cần (khuyến nghị: PHP + Apache + MySQL)
4. Nhấp **Cài đặt** và đợi hoàn tất
5. Chuyển đến tab **Dịch vụ** và khởi động dịch vụ của bạn
6. Môi trường phát triển của bạn đã sẵn sàng!

## 🎨 Giao Diện Người Dùng

### Thiết kế Trực quan
- **Điều hướng dựa trên Tab** - Các phần Dịch vụ, Cài đặt, Dọn dẹp
- **Chỉ báo Trạng thái** - Phản hồi trực quan về trạng thái dịch vụ
- **Theo dõi Tiến trình** - Tiến trình cài đặt và vận hành theo thời gian thực
- **Bố cục Đáp ứng** - Hoạt động tốt trên các kích thước màn hình khác nhau

### Accessibility
- **Keyboard Navigation** support
- **Screen Reader** friendly
- **High Contrast** mode support
- **Customizable** interface elements

## 🔧 Cấu Hình

### Cấu hình Dịch vụ
- **Apache** - Thư mục gốc tài liệu, virtual hosts, modules
- **PHP** - Chuyển đổi phiên bản, extensions, cài đặt php.ini
- **MySQL** - Quản lý cơ sở dữ liệu, tài khoản người dùng
- **Nginx** - Cấu hình máy chủ web thay thế

### Cài đặt Dự án
- **Tự động phát hiện** dự án cục bộ
- **Tên miền tùy chỉnh** (.test, .local, .dev)
- **Chứng chỉ SSL** cho phát triển HTTPS
- **Quản lý biến môi trường**

## 🔒 Bảo Mật & Quyền Riêng Tư

### Tính năng Bảo mật
- **Cách ly Quy trình** - Dịch vụ chạy trong các quy trình riêng biệt
- **Quản lý Quyền** - Quyền tối thiểu cần thiết
- **Mặc định An toàn** - Cấu hình an toàn ngay từ đầu
- **Cập nhật Thường xuyên** - Vá lỗi bảo mật và cải tiến

### Quyền riêng tư
- **Không có Dữ liệu Theo dõi** - Chúng tôi không thu thập dữ liệu sử dụng
- **Hoạt động Cục bộ** - Mọi thứ đều chạy trên máy của bạn
- **Mã Nguồn Mở** - Minh bạch hoàn toàn trong mã

## 📝 Giấy Phép

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 📞 Liên Hệ

**Nhà phát triển**: nghiaomg  
**GitHub**: [https://github.com/nghiaomg](https://github.com/nghiaomg)  
**Dự án**: [https://github.com/nghiaomg/sonna](https://github.com/nghiaomg/sonna)

---

*Được xây dựng với ❤️ để hiện đại hóa phát triển cục bộ trên Windows*