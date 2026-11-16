# Muffin Study Game — Hướng dẫn đưa lên mạng và cài vào iPhone

## Các file trong thư mục

| File | Dùng để |
|---|---|
| `index.html`, `styles.css`, `app.js` | Giao diện app |
| `rules.js` | **Toàn bộ luật chơi và số liệu** (object `RULES` ở đầu file) |
| `manifest.json`, `sw.js`, `icons/` | Để iPhone coi đây là app (icon, toàn màn hình, chạy offline) |
| `tests/run-tests.js` | Test luật chơi: `node tests/run-tests.js` (thêm `--table` để in bảng đối chiếu số liệu) |
| `tests/serve.js` | Chạy thử trên máy: `node tests/serve.js` → mở http://localhost:5180 |
| `tests/demo.html` | Nạp dữ liệu mẫu để thử (chỉ chạy trên localhost, lên mạng sẽ tự chặn) |

---

## Bước 1 — Đưa app lên mạng (chọn 1 cách)

### Cách A: Netlify Drop (nhanh nhất, không cần cài gì)

1. Trên máy tính, mở **https://app.netlify.com/drop**.
2. Đăng ký/đăng nhập Netlify (miễn phí, có thể dùng tài khoản Google/GitHub).
   *Nếu không đăng nhập, trang web chỉ tồn tại khoảng 1 giờ rồi bị xóa.*
3. Mở File Explorer, **kéo cả thư mục `muffin-app`** thả vào ô "Drag and drop your project folder here".
4. Đợi vài giây, Netlify cho bạn một đường link dạng `https://ten-ngau-nhien.netlify.app`.
5. (Tuỳ chọn) Vào **Site configuration → Change site name** để đổi thành link dễ nhớ, ví dụ `muffin-cua-toi.netlify.app`.

**Cập nhật app sau này:** vào trang site trên Netlify → tab **Deploys** → kéo thả lại thư mục `muffin-app` vào ô "Need to update your site? Drag and drop your site output folder here". Link giữ nguyên.

### Cách B: GitHub Pages (nếu bạn có GitHub)

1. Vào https://github.com/new, đặt tên repo `muffin-app`, chọn **Public**, bấm **Create repository**.
2. Trong trang repo mới, bấm **uploading an existing file**, kéo **toàn bộ nội dung bên trong** thư mục `muffin-app` (không phải chính thư mục) vào, bấm **Commit changes**.
3. Vào **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main`, thư mục `/ (root)` → **Save**.
4. Đợi 1–2 phút, link sẽ là `https://<tên-github-của-bạn>.github.io/muffin-app/`.

**Cập nhật:** upload lại các file đã sửa vào repo (Add file → Upload files). Link giữ nguyên.

> App dùng đường dẫn tương đối nên chạy đúng cả khi nằm trong thư mục con `/muffin-app/` của GitHub Pages.

---

## Bước 2 — Cài vào iPhone

1. Trên iPhone, mở link ở Bước 1 bằng **Safari** (hoặc Chrome nếu iOS 16.4 trở lên).
2. Bấm nút **Chia sẻ** (ô vuông có mũi tên lên).
3. Kéo xuống, chọn **"Thêm vào MH chính"** (Add to Home Screen) → **Thêm**.
4. Mở app **Muffin** từ icon chiếc bánh trên Màn hình chính (mở toàn màn hình, không có thanh địa chỉ).
5. Lần đầu mở: bấm **"Nhập số dư ban đầu"** và khai số Muffin, Kho, Chu Kì, chuỗi, đồ đang có từ bản cũ.
   *Nếu có thói quen đang giữ chuỗi: thêm thói quen ở tab Thói quen trước, rồi vào Cài đặt → Nhập số dư ban đầu để khai chuỗi.*

### ⚠️ Lưu ý quan trọng về dữ liệu

- App trên Màn hình chính có **bộ nhớ riêng, tách khỏi tab Safari**. Dữ liệu nhập trong Safari sẽ **không** xuất hiện trong app đã cài → hãy nhập số dư **bên trong app đã cài**.
- Dữ liệu chỉ nằm trên iPhone. Thỉnh thoảng vào **Cài đặt → Xuất JSON** để lưu bản sao vào app **Tệp** hoặc gửi qua **Zalo**. App sẽ nhắc nếu quá 7 ngày chưa sao lưu.
- Đổi máy / lỡ xóa app: cài lại rồi **Cài đặt → Nhập JSON**, chọn file đã sao lưu.
- Xóa app khỏi Màn hình chính = xóa luôn dữ liệu. Nhớ Xuất JSON trước.

---

## Khi sửa code và cập nhật

1. Sửa file, rồi mở `sw.js` và tăng số phiên bản, ví dụ `muffin-v1.0.0` → `muffin-v1.0.1`.
2. Deploy lại **cùng link** như Bước 1.
3. Trên iPhone, mở app khi có mạng: app tự lấy bản mới (có thể cần đóng hẳn app rồi mở lại 1 lần). **Dữ liệu vẫn giữ nguyên** vì dữ liệu nằm riêng trong bộ nhớ của app, không nằm trong file code.
