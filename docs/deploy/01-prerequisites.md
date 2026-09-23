# Yêu cầu Phần mềm (Prerequisites)

Kiểm tra từng mục trước khi bắt đầu cài đặt. Tất cả phiên bản tối thiểu là bắt buộc.

## Phần mềm cần cài

| Phần mềm | Phiên bản tối thiểu | Lệnh kiểm tra | Ghi chú |
|----------|--------------------|--------------:|---------|
| Java JDK | **17.0.x** | `java -version` | Phải là JDK, không phải JRE |
| Apache Maven | **3.9.x** | `mvn -version` | Hoặc dùng wrapper `.\mvnw` |
| Node.js | **20 LTS** | `node --version` | npm đi kèm |
| npm | **10.x** | `npm --version` | Có sẵn khi cài Node.js |
| SQL Server | **2022** | Xem § SQL Server bên dưới | Developer Edition (miễn phí) |
| Git | **2.40+** | `git --version` | Cần để clone repo |

## Kiểm tra Java 17

```powershell
java -version
# Kỳ vọng: openjdk version "17.0.x" ...
javac -version
# Kỳ vọng: javac 17.0.x
```

Nếu máy có nhiều JDK, đặt `JAVA_HOME` trỏ đến JDK 17:

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
java -version
# Kỳ vọng: openjdk version "17.0.x"
```

## Kiểm tra Node.js 20+

```powershell
node --version
# Kỳ vọng: v20.x.x hoặc mới hơn
npm --version
# Kỳ vọng: 10.x.x
```

## Cài SQL Server 2022 (Windows)

1. Tải SQL Server 2022 Developer Edition:
   https://www.microsoft.com/en-us/sql-server/sql-server-downloads
2. Chạy trình cài đặt, chọn loại **Developer**.
3. Ghi nhớ khi cài:
   - **Instance name**: mặc định `MSSQLSERVER`
   - **Authentication mode**: chọn **SQL Server and Windows Authentication**
   - **SA password**: đặt mật khẩu mạnh (ví dụ: `YourPassword123`)
4. Kiểm tra SQL Server đang chạy:

```powershell
Get-Service -Name "MSSQLSERVER"
# Kỳ vọng: Status = Running
```

Nếu SQL Server chưa chạy, khởi động bằng lệnh (cần quyền Administrator):

```powershell
Start-Service -Name "MSSQLSERVER"
```

## Cài SQL Server Management Studio (SSMS) — tùy chọn

SSMS giúp thao tác trực tiếp với database qua giao diện đồ họa:
https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms

## Bật SQL Server Browser (nếu cần)

Nếu kết nối bằng tên instance (thay vì `localhost,1433`), bật SQL Server Browser:

```powershell
# Kiểm tra
Get-Service -Name "SQLBrowser"
# Khởi động
Start-Service -Name "SQLBrowser"
```

## Clone repository

```powershell
git clone https://github.com/Nguyen-Van-Gia-Binh/Self-Storage-Facility-Rental-and-Management-System.git
# Nếu đã clone: git pull origin main
```

## Bước tiếp theo

Sau khi hoàn tất cài đặt phần mềm, tiếp tục với [02-database-setup.md](02-database-setup.md).
