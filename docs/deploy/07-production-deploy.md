# Deploy Production

Hướng dẫn triển khai hệ thống Self-Storage trong môi trường Production (vận hành chính thức, không dùng dev server Vite, không bật hot-reload, bảo mật toàn bộ thông tin đăng nhập và khóa bí mật).

> **Phạm vi triển khai:** Tài liệu này hướng dẫn mô hình triển khai thực tế trên máy chủ vật lý hoặc máy chủ ảo (Bare-metal / Virtual Machine: Linux Ubuntu 22.04 LTS hoặc Windows Server 2022).  
> Kiến trúc đóng gói container (Docker / Docker Compose) và điện toán đám mây sẽ được hoàn thiện theo lộ trình Giai đoạn 5 (P5).

---

## 1. Yêu cầu Hệ thống Máy chủ (Production Server)

| Thành phần | Cấu hình khuyến nghị | Ghi chú |
|------------|----------------------|---------|
| **Hệ điều hành** | Ubuntu 22.04 LTS / Windows Server 2022 | 64-bit |
| **Phần cứng** | Tối thiểu 4 vCPU, 8 GB RAM, 50 GB SSD | Đáp ứng cả DB và App Server |
| **Java Runtime** | OpenJDK 17 LTS (JRE hoặc JDK) | `java --version` ra 17.x |
| **Cơ sở dữ liệu** | Microsoft SQL Server 2022 (Standard / Developer / Express) | Port 1433 |
| **Web Server / Reverse Proxy** | Nginx (trên Linux) hoặc IIS (trên Windows) | Phục vụ Frontend tĩnh và SSL Termination |

---

## 2. Bước 1: Build Backend JAR

Thực hiện lệnh đóng gói fat JAR trên máy chủ build hoặc máy phát triển:

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
mvn -f backend/pom.xml clean package -DskipTests "-Dnet.bytebuddy.experimental=true"
```

Tệp thực thi JAR được tạo tại:  
`backend/target/self-storage-backend-1.0.0-SNAPSHOT.jar`

Chuyển (sftp / scp / copy) tệp này lên thư mục ứng dụng trên máy chủ production, ví dụ: `/opt/selfstorage/` (Linux) hoặc `C:\apps\selfstorage\` (Windows).

---

## 3. Bước 2: Cấu hình và Chạy Backend Production

### Cấu hình biến môi trường Production

Thiết lập các biến môi trường trực tiếp trên hệ thống máy chủ hoặc thông qua dịch vụ service manager:

- `DB_URL`: `jdbc:sqlserver://<db-host>:1433;databaseName=SelfStorageDB;encrypt=true;trustServerCertificate=false`
- `DB_USERNAME`: Tài khoản database riêng của ứng dụng (không nên dùng `sa`)
- `DB_PASSWORD`: Mật khẩu phức tạp, an toàn
- `JWT_SECRET`: Chuỗi khóa hex 256-bit bảo mật cao (xem cách sinh ở mục 7)
- `SPRING_PROFILES_ACTIVE`: `production`

### Thiết lập Service tự hành trên Linux (Systemd)

Tạo file service: `/etc/systemd/system/selfstorage.service`

```ini
[Unit]
Description=Self-Storage Backend Spring Boot Service
After=network.target sqlserver.service

[Service]
Type=simple
User=selfstorage
WorkingDirectory=/opt/selfstorage
ExecStart=/usr/bin/java -Xms512m -Xmx2048m -jar /opt/selfstorage/self-storage-backend-1.0.0-SNAPSHOT.jar
Environment="SPRING_PROFILES_ACTIVE=production"
Environment="DB_URL=jdbc:sqlserver://127.0.0.1:1433;databaseName=SelfStorageDB;encrypt=true;trustServerCertificate=false"
Environment="DB_USERNAME=storage_app_user"
Environment="DB_PASSWORD=YourStrongDatabasePasswordHere"
Environment="JWT_SECRET=YourGenerated64CharHexSecretKeyHere"
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Kích hoạt và khởi chạy service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable selfstorage
sudo systemctl start selfstorage
sudo systemctl status selfstorage
```

---

## 4. Bước 3: Build Frontend (Production)

Trên máy phát triển:

1. Tạo file cấu hình `frontend/.env.production`:

   ```env
   VITE_API_BASE_URL=https://storage.yourdomain.vn/api/v1
   ```

2. Chạy lệnh đóng gói mã nguồn tĩnh:

   ```powershell
   npm run build --prefix frontend
   ```

Thư mục kết quả `frontend/dist/` chứa toàn bộ tệp HTML, CSS, JavaScript đã được minified và tối ưu hóa.

---

## 5. Bước 4: Thiết lập Reverse Proxy & Phục vụ Frontend

### Lựa chọn A — Cấu hình trên Linux bằng Nginx

Cài đặt Nginx: `sudo apt update && sudo apt install -y nginx`

Tạo cấu hình site: `/etc/nginx/sites-available/selfstorage.conf`

```nginx
server {
    listen 80;
    server_name storage.yourdomain.vn;

    # Tự động chuyển hướng toàn bộ sang HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name storage.yourdomain.vn;

    ssl_certificate /etc/letsencrypt/live/storage.yourdomain.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/storage.yourdomain.vn/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/selfstorage/dist;
    index index.html;

    # SPA Routing Fallback — bắt buộc cho ứng dụng React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API ngược về Backend Spring Boot đang chạy port 8080
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
```

Kích hoạt site và nạp lại Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/selfstorage.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Lựa chọn B — Cấu hình trên Windows Server bằng IIS

1. Cài đặt vai trò **Web Server (IIS)** và tiện ích mở rộng **URL Rewrite**:
   - Tải URL Rewrite: https://www.iis.net/downloads/microsoft/url-rewrite
2. Trong **IIS Manager**, tạo mới một Website trỏ thư mục gốc (Physical Path) tới thư mục `dist` của Frontend.
3. Tạo file `web.config` đặt trực tiếp bên trong thư mục `dist` để xử lý định tuyến SPA (Single Page Application):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <httpErrors errorMode="DetailedLocalOnly" />
  </system.webServer>
</configuration>
```

4. Cài đặt module **Application Request Routing (ARR)** nếu muốn IIS làm Reverse Proxy chuyển tiếp request `/api/*` về cổng `8080`.

---

## 6. Bước 5: Kiểm tra và Nghiệm thu Hệ thống Production

Thực hiện toàn bộ các bước trong tài liệu [06-health-check.md](06-health-check.md) với tên miền chính thức của môi trường Production:
- Kiểm tra kết nối HTTPS qua trình duyệt.
- Kiểm tra các endpoint `/api/v1/*` phản hồi bình thường.
- Kiểm tra chức năng đăng nhập, phân quyền và điều hướng dashboard.

---

## 7. Checklist An ninh và Bảo mật Trước khi Go-Live

Trước khi công bố hệ thống cho người dùng cuối, quản trị viên bắt buộc phải kiểm tra và đánh dấu các tiêu chí sau:

- [ ] **Thay đổi mật khẩu tài khoản `sa` của SQL Server:** Không để mật khẩu mặc định hoặc mật khẩu yếu.
- [ ] **Tạo tài khoản database riêng cho ứng dụng:** Phân quyền chỉ định trên database `SelfStorageDB`, tránh dùng quyền quản trị máy chủ `sysadmin`.
- [ ] **Thay đổi JWT Secret:** Tạo chuỗi hex 256-bit ngẫu nhiên và an toàn:
  ```powershell
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  [System.BitConverter]::ToString($bytes) -replace '-', ''
  ```
- [ ] **Khóa / Đổi mật khẩu các tài khoản demo:** Vô hiệu hóa hoặc cập nhật mật khẩu cho các tài khoản seed từ migration V12/V13.
- [ ] **Kích hoạt SSL/TLS (HTTPS):** Sử dụng chứng chỉ SSL từ nhà cung cấp uy tín (Let's Encrypt / DigiCert).
- [ ] **Khóa các cổng nội bộ ở Firewall:** Chỉ mở cổng 80 (HTTP) và 443 (HTTPS) ra Internet; tuyệt đối đóng cổng `8080` (Spring Boot) và cổng `1433` (SQL Server).
- [ ] **Tắt thông tin debug:** Đảm bảo `spring.jpa.show-sql: false` và vô hiệu hóa Swagger UI nếu chính sách bảo mật nội bộ yêu cầu (`springdoc.swagger-ui.enabled: false`).
