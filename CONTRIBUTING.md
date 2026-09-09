# Quy trình làm việc với Git

> **Self-Storage Facility Rental and Management System** — quy trình nhánh, commit, Pull Request và
> điều kiện merge cho nhóm 4 thành viên.
>
> Nhiệm vụ **T1.18** · Giai đoạn 1 · [docs/PLAN.md](docs/PLAN.md).
> Quy ước viết code và API: [docs/CONVENTIONS.md](docs/CONVENTIONS.md)

---

## Mục lục

1. [Mô hình nhánh](#1-mô-hình-nhánh)
2. [Đặt tên nhánh](#2-đặt-tên-nhánh)
3. [Quy ước commit](#3-quy-ước-commit)
4. [Pull Request](#4-pull-request)
5. [Review code](#5-review-code)
6. [Merge và xử lý xung đột](#6-merge-và-xử-lý-xung-đột)
7. [Definition of Done](#7-definition-of-done)
8. [Những thứ không được commit](#8-những-thứ-không-được-commit)
9. [Tra nhanh câu lệnh](#9-tra-nhanh-câu-lệnh)

---

## 1. Mô hình nhánh

Nhóm dùng **GitHub Flow** — một nhánh chính, mỗi việc một nhánh ngắn hạn. Chọn mô hình này vì nhóm
chỉ có 4 người, chu kỳ giao hàng 2 tuần và không có nhánh release song song; Git Flow với `develop` +
`release/*` sẽ tốn công quản lý mà không đem lại lợi ích tương ứng.

```
main ────●────────●────────●────────●──────▶  luôn chạy được
          \      /          \      /
           ●───●             ●───●
      feature/T3.1-...   feature/T3.3-...
```

| Nhánh                      | Vai trò                                                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`main`**          | Nhánh duy nhất tồn tại lâu dài.**Luôn ở trạng thái chạy được** — build thành công, test xanh. Đây là nhánh đem đi demo báo cáo giai đoạn |
| **Nhánh nhiệm vụ** | Ngắn hạn, mỗi nhánh giải quyết**đúng một** nhiệm vụ trong `PLAN.md`. Merge xong thì xóa                                                              |

**Quy tắc cứng:**

- **Không commit thẳng vào `main`.** Mọi thay đổi đều đi qua Pull Request.
- Một nhánh sống tối đa **5 ngày**. Lâu hơn nghĩa là nhiệm vụ quá to, phải chẻ nhỏ.
- Trước khi tạo nhánh mới, luôn `git pull` nhánh `main` mới nhất.

---

## 2. Đặt tên nhánh

Mẫu: **`<loại>/<mã-task>-<mô-tả-ngắn>`**

| Loại         | Dùng khi                        | Ví dụ                                  |
| ------------- | -------------------------------- | ---------------------------------------- |
| `feature/`  | Nhiệm vụ mới trong`PLAN.md` | `feature/T3.1-create-reservation-api`  |
| `fix/`      | Sửa lỗi                        | `fix/T3.13-overdue-fee-rounding`       |
| `docs/`     | Chỉ sửa tài liệu             | `docs/T1.5-business-rules`             |
| `chore/`    | Cấu hình, dependency, CI       | `chore/T1.16-spring-boot-skeleton`     |
| `refactor/` | Dọn code, không đổi hành vi | `refactor/T5.9-extract-fee-calculator` |

**Quy tắc:** mô tả viết **tiếng Anh**, `kebab-case`, tối đa 5 từ, không dấu tiếng Việt. Mã task viết
hoa đúng như trong `PLAN.md` (`T3.1`, không phải `t3.1`). Việc phát sinh không có trong plan thì dùng
mã `Tx` — ví dụ `fix/Tx-login-redirect-loop` — và bổ sung vào Notion sau.

---

## 3. Quy ước commit

Dùng **Conventional Commits**:

```
<loại>(<phạm vi>): <mô tả ngắn>

<phần thân, không bắt buộc>

Refs: <mã task>
```

### 3.1. Loại commit

| Loại        | Dùng khi                                    |
| ------------ | -------------------------------------------- |
| `feat`     | Thêm chức năng cho người dùng          |
| `fix`      | Sửa lỗi                                    |
| `docs`     | Chỉ đụng tài liệu                       |
| `refactor` | Đổi cấu trúc code, không đổi hành vi |
| `test`     | Thêm hoặc sửa test                        |
| `style`    | Format, khoảng trắng, không đổi logic   |
| `chore`    | Dependency, cấu hình, script               |
| `build`    | Maven, npm, Dockerfile                       |
| `ci`       | GitHub Actions và pipeline                  |

### 3.2. Phạm vi

Lấy đúng tên module ở [CONVENTIONS.md § 3.1](docs/CONVENTIONS.md#31-cấu-trúc-package): `auth`, `user`,
`facility`, `unit`, `reservation`, `contract`, `payment`, `policy`, `support`, `report`, `common`.
Phía Frontend thêm tiền tố `fe`: `fe-reservation`. Việc thuộc CSDL dùng `db`.

### 3.3. Mô tả

- Viết **tiếng Việt**, thể mệnh lệnh: "thêm", "sửa", "bỏ" — không viết "đã thêm".
- Không quá 72 ký tự, không kết thúc bằng dấu chấm.
- Giữ nguyên thuật ngữ tiếng Anh: `Reservation`, `Deposit`, `Overdue`.

### 3.4. Ví dụ

```
feat(reservation): thêm API tạo Reservation và giữ chỗ 48 giờ

Giữ chỗ theo BR-DEP-03, hết hạn thì scheduled job giải phóng ô kho.

Refs: T3.1
```

```
fix(contract): sửa phí Overdue vượt trần 50%

Refs: T4.6
```

```
docs(business-rules): chốt mốc D+10, D+30, D+60 cho xử lý Overdue

Refs: T1.5
```

**Quy tắc:** commit nhỏ và có nghĩa. Không gom cả ngày làm việc vào một commit `update code`; cũng
không commit code không build được ở giữa nhánh.

---

## 4. Pull Request

### 4.1. Khi nào mở

Mở Pull Request ngay khi bắt đầu làm, để **Draft**. Cả nhóm thấy được ai đang đụng phần nào, tránh
hai người sửa trùng file. Xong việc thì chuyển sang Ready for review.

### 4.2. Tiêu đề

Đúng định dạng commit, kèm mã task ở đầu:

```
[T3.1] feat(reservation): API tạo Reservation và giữ chỗ
```

### 4.3. Mô tả

```markdown
## Nhiệm vụ
T3.1 — API tạo Reservation (PLAN.md, Giai đoạn 3)

## Nội dung thay đổi
- Thêm `ReservationController` với `POST /api/v1/reservations`
- Thêm `ReservationServiceImpl` xử lý giữ chỗ theo `BR-DEP-03`
- Migration `V5__create_reservation_table.sql`

## Phạm vi nghiệp vụ
Use case: `UC-F1-04`, `UC-F1-06` · User story: `US-SC-02.1`
Business rule: `BR-DEP-03`, `BR-OVD-09`

## Cách kiểm thử
1. `mvn test` — 12 test mới đều xanh
2. Gọi `POST /api/v1/reservations` với ô kho đã hết → nhận `409 UNIT_NOT_AVAILABLE`

## Checklist
- [ ] Build và test chạy xanh tại máy
- [ ] Đã đối chiếu checklist review ở CONVENTIONS.md § 8
- [ ] Đã cập nhật tài liệu trong `docs/` nếu có thay đổi nghiệp vụ
- [ ] `bash docs/check-docs.sh` chạy xanh (nếu có đụng `docs/`)
- [ ] Không commit bí mật hay dữ liệu thật
```

### 4.4. Kích thước

Một Pull Request nên dưới **400 dòng thay đổi**. To hơn thì review qua loa, không ai đọc kỹ nổi. Việc
lớn thì chia thành nhiều Pull Request nối tiếp nhau.

---

## 5. Review code

| Quy tắc                        | Nội dung                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Số người review**    | Ít nhất**1** người duyệt mới được merge, đúng theo [PLAN.md § 6](docs/PLAN.md#6-quy-ước-làm-việc)                                 |
| **Ai review**             | Backend review chéo nhau (Tùng ↔ Nhật). Frontend do Bình review. Thay đổi chạm nghiệp vụ hoặc tài liệu thì Bình review với vai trò BA |
| **Thời gian phản hồi** | Trong**24 giờ**. Bận thì nói trong nhóm để người khác nhận review                                                                     |
| **Không tự duyệt**     | Không ai được duyệt Pull Request của chính mình                                                                                                |
| **Căn cứ review**       | Checklist ở[CONVENTIONS.md § 8](docs/CONVENTIONS.md#8-checklist-review-code)                                                                          |

**Cách góp ý:** nêu rõ vấn đề và đề xuất cách sửa, không chỉ nói "sai rồi". Phân biệt góp ý **bắt
buộc sửa** và góp ý **tùy chọn** — ghi rõ tiền tố `[bắt buộc]` hoặc `[gợi ý]`.

**Người viết code** trả lời từng góp ý; sửa xong thì reply rồi mới resolve, không resolve im lặng.

---

## 6. Merge và xử lý xung đột

### 6.1. Merge

- Dùng **Squash and merge**. Mỗi Pull Request thành đúng một commit trên `main`, lịch sử sạch và dễ
  revert khi cần.
- Nội dung commit sau khi squash lấy theo tiêu đề Pull Request, bỏ phần `[T3.1]` khỏi đầu dòng.
- Merge xong **xóa nhánh** ngay trên GitHub.

### 6.2. Đồng bộ với `main`

Nhánh đang làm bị tụt lại so với `main` thì **rebase**, không merge ngược `main` vào nhánh — tránh
commit merge rác trong lịch sử:

```bash
git checkout feature/T3.1-create-reservation-api
git fetch origin
git rebase origin/main
# sửa xung đột nếu có
git add <file đã sửa>
git rebase --continue
git push --force-with-lease
```

Luôn dùng `--force-with-lease`, **không** dùng `--force` — nó chặn trường hợp ghi đè commit của người
khác đã đẩy lên cùng nhánh.

### 6.3. Xung đột hay gặp

| Chỗ xung đột                | Cách xử lý                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Số phiên bản Flyway trùng  | Đổi số migration của mình thành số lớn hơn rồi rebase.**Không** sửa migration đã merge         |
| `pom.xml` / `package.json` | Giữ cả hai dependency, chạy lại build để kiểm tra                                                           |
| Tài liệu trong`docs/`      | Giữ cả hai phần nội dung rồi đọc lại toàn mục; đụng`TOPIC.md` thì báo Bình trước khi tự quyết |

---

## 7. Definition of Done

Một nhiệm vụ chỉ được coi là xong khi đủ **tất cả**:

- [ ] Code chạy được, build thành công
- [ ] Có unit test cho tầng service, test chạy xanh
- [ ] Đã có ít nhất 1 người review và duyệt
- [ ] Đã merge vào `main`
- [ ] Tài liệu liên quan trong `docs/` đã cập nhật
- [ ] `bash docs/check-docs.sh` chạy xanh — bắt buộc nếu có đụng tài liệu trong `docs/`
- [ ] Task tương ứng trên [Notion Task Tracker](https://app.notion.com/p/3d5561bd42cd808e8161c482b37386c6) đã chuyển sang *Done*

### Kiểm tra tài liệu tự động

[`docs/check-docs.sh`](docs/check-docs.sh) rà 8 phép kiểm tính nhất quán giữa các tài liệu phân tích:
link chết, mã `UC-*` / `BR-*` / `SC-*` được tham chiếu nhưng không tồn tại, mã yêu cầu chưa được use
case nào phủ, số lượng lệch giữa các bảng, và **con số nêu trong văn bản lệch với số đếm được**.

```bash
bash docs/check-docs.sh    # chạy từ thư mục gốc repo
```

Chạy lại mỗi khi thêm use case, user story hoặc business rule — đây là loại lỗi mắt người đọc lướt
qua rất dễ bỏ sót. Script chỉ lo phần máy kiểm được; phần nội dung đúng hay sai vẫn phải review bằng
tay theo [docs/REVIEW-CHECKLIST.md](docs/REVIEW-CHECKLIST.md).

---

## 8. Những thứ không được commit

```gitignore
# Bí mật
.env
.env.local
application-local.yml
application-secret.yml

# Build
target/
build/
node_modules/
dist/
out/

# IDE
.idea/
.vscode/
*.iml

# Hệ điều hành
Thumbs.db
.DS_Store

# Dữ liệu và log
*.log
*.bak
*.mdf
*.ldf
```

Repo chỉ chứa `.env.example` với giá trị giả. Lỡ commit bí mật thì **đổi khóa ngay** rồi báo nhóm —
xóa commit không đủ, khóa đã lộ trong lịch sử Git.

---

## 9. Tra nhanh câu lệnh

```bash
# Kiểm tra tính nhất quán tài liệu (chạy từ gốc repo)
bash docs/check-docs.sh

# Bắt đầu một nhiệm vụ mới
git checkout main
git pull origin main
git checkout -b feature/T3.1-create-reservation-api

# Commit
git add .
git commit -m "feat(reservation): thêm API tạo Reservation và giữ chỗ 48 giờ"

# Đẩy lên lần đầu
git push -u origin feature/T3.1-create-reservation-api

# Cập nhật nhánh theo main mới nhất
git fetch origin
git rebase origin/main
git push --force-with-lease

# Sau khi Pull Request đã merge
git checkout main
git pull origin main
git branch -d feature/T3.1-create-reservation-api

# Sửa nội dung commit cuối (chỉ khi CHƯA push)
git commit --amend

# Xem lịch sử gọn
git log --oneline --graph --decorate -20
```
