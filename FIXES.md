# 🔧 Fixes & Troubleshooting - Sonna

Tài liệu này hướng dẫn cách khắc phục các lỗi thường gặp khi sử dụng Sonna.

---

## 🚨 Lỗi Download Apache

### ❌ Lỗi: "Downloaded file is not a valid ZIP file. Got 3c 68 instead of 50 4B"

**Nguyên nhân:** Config file cũ vẫn chứa URL Apache version 2.4.58 đã hết hạn

**Triệu chứng:**
```
Apache
Version 2.4.58
Failed to install: Error: Downloaded file is not a valid ZIP file. Got 3c 68 instead of 50 4B
```

**Giải pháp:**

#### Cách 1: Sử dụng UI (Khuyên dùng)
1. Mở Sonna
2. Click nút **"Refresh Config"** trong header
3. Thử download Apache lại

#### Cách 2: Xóa config thủ công
```powershell
# Xóa config file cũ
Remove-Item -Path "C:/sonna/config.json" -Force -ErrorAction SilentlyContinue

# Restart Sonna để tạo config mới
```

#### Cách 3: Reset toàn bộ
```powershell
# Xóa toàn bộ thư mục Sonna
Remove-Item -Path "C:/sonna" -Recurse -Force -ErrorAction SilentlyContinue

# Restart Sonna
```

**URL Apache mới nhất:**
```
https://www.apachelounge.com/download/VS17/binaries/httpd-2.4.63-250207-win64-VS17.zip
```

---

## 📁 Lỗi Service List Trống

### ❌ Lỗi: Install tab hiển thị "Cài Đặt Dịch Vụ" nhưng không có service nào

**Nguyên nhân:** Config file không tồn tại hoặc bị lỗi

**Giải pháp:**

#### Cách 1: Sử dụng Refresh Config
1. Click nút **"Refresh Config"** 
2. Chờ một chút để config được tạo lại
3. Reload lại tab Install

#### Cách 2: Khởi động lại app
1. Đóng Sonna hoàn toàn
2. Xóa `C:/sonna/config.json` nếu tồn tại
3. Khởi động lại Sonna

---

## 🌐 Lỗi Download Timeout/Network

### ❌ Lỗi: "Download timeout" hoặc "HTTP 403/404"

**Nguyên nhân:** 
- Kết nối mạng kém
- Server từ chối kết nối
- URL không tồn tại

**Giải pháp:**

#### Kiểm tra kết nối
```powershell
# Test kết nối đến Apache Lounge
Test-NetConnection -ComputerName www.apachelounge.com -Port 443

# Test download trực tiếp
Invoke-WebRequest -Uri "https://www.apachelounge.com/download/VS17/binaries/httpd-2.4.63-250207-win64-VS17.zip" -Method Head
```

#### Thay đổi User-Agent
Code đã được cập nhật với User-Agent browser để tránh bị block:
```javascript
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
```

---

## 🔐 Lỗi Permission

### ❌ Lỗi: "Access denied" khi tạo thư mục

**Nguyên nhân:** Không có quyền ghi vào `C:/sonna`

**Giải pháp:**

#### Chạy với quyền Administrator
1. Đóng Sonna
2. Click chuột phải vào Sonna
3. Chọn "Run as Administrator"

#### Thay đổi thư mục cài đặt
Sửa trong code để dùng thư mục User:
```typescript
// Thay vì C:/sonna
const userHome = require('os').homedir();
const sonnaPath = path.join(userHome, 'sonna');
```

---

## 📦 Lỗi Extraction

### ❌ Lỗi: "Failed to extract" hoặc "Invalid zip file"

**Nguyên nhân:** 
- File ZIP bị corrupt
- Download không hoàn tất
- Antivirus chặn

**Giải pháp:**

#### Kiểm tra file size
```powershell
# Kiểm tra file đã download
Get-ChildItem "C:/sonna/downloads/*.zip" | Format-Table Name, Length
```

#### Tắt Antivirus tạm thời
1. Tắt Windows Defender/Antivirus
2. Thử download lại
3. Bật lại sau khi xong

#### Download thủ công
1. Download ZIP từ browser
2. Copy vào `C:/sonna/downloads/`
3. Đổi tên file theo format: `servicename.zip` (vd: `apache.zip`)

---

## 🔄 Lỗi Service Status

### ❌ Lỗi: Service hiển thị sai trạng thái

**Nguyên nhân:** Cache status cũ hoặc process check lỗi

**Giải pháp:**

#### Reset status
1. Click "Reset Status" trong header
2. Hoặc restart ứng dụng

#### Xóa process cache
```powershell
# Kill các process liên quan
Get-Process | Where-Object {$_.ProcessName -like "*httpd*" -or $_.ProcessName -like "*nginx*"} | Stop-Process -Force
```

---

## 🛠️ Debug Mode

### Bật logging chi tiết

Trong Development mode, mở DevTools để xem log:
```
Ctrl + Shift + I (trong app)
```

Log sẽ hiển thị:
- Download progress
- File validation results
- Error details
- URL redirects

### Log quan trọng cần chú ý:
```
Starting download: apache from https://...
Downloaded file size: X bytes, buffer length: Y
First 4 bytes: 504b0304 (ZIP) hoặc 3c68746d (HTML error)
```

---

## 📋 Service URLs Chính Thức

### Apache 2.4.63
```
https://www.apachelounge.com/download/VS17/binaries/httpd-2.4.63-250207-win64-VS17.zip
```

### PHP 8.3.0
```
https://windows.php.net/downloads/releases/php-8.3.0-Win32-vs16-x64.zip
```

### MySQL 8.0.35
```
https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-8.0.35-winx64.zip
```

### Node.js 20.11.0
```
https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip
```

### Nginx 1.24.0
```
http://nginx.org/download/nginx-1.24.0.zip
```

---

## 🆘 Khi Mọi Cách Đều Thất Bại

### Full Reset
```powershell
# Dừng Sonna
# Xóa toàn bộ
Remove-Item -Path "C:/sonna" -Recurse -Force -ErrorAction SilentlyContinue

# Xóa trong AppData nếu có
Remove-Item -Path "$env:APPDATA/sonna" -Recurse -Force -ErrorAction SilentlyContinue

# Restart Windows (nếu cần)
# Cài đặt lại Sonna
```

### Download thủ công tất cả services
1. Download các ZIP file từ URLs trên
2. Đặt vào `C:/sonna/downloads/`
3. Extract thủ công vào `C:/sonna/applications/[servicename]/`
4. Sử dụng "Refresh Config" để update status

---

## 📞 Báo Lỗi

Nếu vẫn gặp lỗi, hãy tạo issue với thông tin:

```
- OS version: Windows 10/11
- Sonna version: 
- Error message: 
- Log output: (từ DevTools Console)
- Steps to reproduce:
```

GitHub Issues: [https://github.com/nghiaomg/sonna/issues](https://github.com/nghiaomg/sonna/issues) 