# CINE-TICKET BOOKING SYSTEM 🍓
> **Môn học**: Công nghệ Phần mềm
> **Đề tài**: Hệ thống Quản lý và Đặt vé Phim trực tuyến (Cine Cinema)
> **Phong cách**: Cozy Pastel Interface (Đáng yêu, Gần gũi, Trực quan)

Hệ thống được phát triển toàn diện bằng mô hình Client-Server phục vụ nhu cầu đặt vé xem phim của khách hàng và quản lý rạp chiếu của ban quản trị (Admin). 

---

## 🌟 Tính Năng Nổi Bật

### 1. Phân Hệ Khách Hàng (Customer Portal)
- **Xem & Lọc Phim**: Tìm kiếm theo tên phim, chọn thể loại hoặc lọc nhanh theo ngày chiếu.
- **Quy trình Giỏ Hàng & Thanh toán riêng (Mới)**:
  - Chọn ngày, suất chiếu và phòng chiếu tương ứng.
  - Chọn ghế ngồi trực tiếp trên **Sơ đồ vòm tròn** dễ thương. Ghế đã bán sẽ tự động khóa.
  - Thêm vé vào **Giỏ hàng** trung gian, hỗ trợ đặt nhiều suất chiếu khác nhau trước khi thanh toán.
  - Trang **Thanh toán riêng** thu thập thông tin khách hàng (Họ tên, Sđt, Email) một lần duy nhất cho toàn bộ giỏ hàng và tạo hóa đơn dạng thẻ biên lai xinh xắn.

### 2. Phân Hệ Quản Trị (Admin Portal)
- **Dashboard Thống Kê**: Xem tổng doanh thu thực tế, số vé đã bán ra thành công, phim đang chiếu và hóa đơn đang chờ xử lý.
- **Quản lý CRUD**: Thực hiện đầy đủ nghiệp vụ CRUD nâng cao cho danh sách Phim (Movies) và Thể loại (Genres).
- **Xếp Lịch Chiếu (Showtimes)**:
  - Giao diện xếp lịch chiếu cho phim (Phim -> Phòng chiếu -> Ngày -> Giờ bắt đầu -> Giá vé).
  - **Thuật toán chặn trùng lịch nâng cao**: Hệ thống tự động kiểm tra xem phòng chiếu đó vào khung giờ đó đã có phim khác chiếu chưa (bao gồm **15 phút dọn dẹp và chuẩn bị rạp**).
- **Quản lý Hóa Đơn (Bookings)**:
  - Hiển thị danh sách hóa đơn đặt vé dưới dạng bảng.
  - Xem chi tiết danh sách mã ghế cụ thể của từng hóa đơn trong Modal.
  - Cập nhật trạng thái hóa đơn: *Chờ thanh toán -> Đã thanh toán* (khi khách nhận vé tại rạp) hoặc *Đã hủy* (ghế sẽ lập tức được giải phóng về trạng thái trống).

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Backend**: Node.js, Express, SQLite (`sqlite3` - cơ sở dữ liệu quan hệ cục bộ).
- **Frontend**: React.js, Vite.
- **Thiết kế & Styling**: Vanilla CSS với kiến trúc biến thể (Variables) màu pastel ngọt ngào, font chữ thân thiện **Fredoka** & **Quicksand** từ Google Fonts. Không sử dụng thư viện UI bên ngoài để đảm bảo tính tối giản và tùy biến cao.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```bash
├── client/                 # Mã nguồn Frontend (React + Vite)
│   ├── public/             # Thư mục chứa hình ảnh tĩnh (poster phim vẽ tay dễ thương)
│   ├── src/
│   │   ├── components/
│   │   │   ├── CustomerPortal.jsx   # Phân hệ đặt vé phim
│   │   │   ├── CartPortal.jsx       # Giỏ hàng & Thanh toán
│   │   │   └── AdminPortal.jsx      # Quản lý rạp và báo cáo
│   │   ├── App.jsx         # Component gốc và chuyển hướng portal
│   │   ├── index.css       # File style chính phong cách Cozy Pastel
│   │   └── main.jsx
│   └── vite.config.js      # Cấu hình proxy định tuyến API
├── server/                 # Mã nguồn Backend (Express + SQLite)
│   ├── db.js               # Tạo bảng & Nạp dữ liệu mẫu (Seeder)
│   ├── server.js           # Định nghĩa REST API & Thuật toán kiểm tra trùng lịch
│   └── test_overlap.js     # Script kiểm thử tự động thuật toán trùng lịch
├── package.json            # Quản lý dependency & script chạy dự án
└── .gitignore              # Bỏ qua các file không cần thiết khi đẩy lên Github
```

---

## 📐 Cấu Trúc Cơ Sở Dữ Liệu (SQLite)

Hệ thống thiết kế cơ sở dữ liệu quan hệ chuẩn hóa:
- **`genres`**: Lưu thông tin danh mục thể loại phim.
- **`movies`**: Lưu thông tin phim, liên kết $1-N$ với thể loại qua `genre_id`.
- **`showtimes`**: Lưu lịch chiếu, liên kết với phim qua `movie_id`.
- **`bookings`**: Lưu thông tin hóa đơn khách hàng.
- **`booking_items`**: Lưu chi tiết vé (mã ghế, giá vé). Đảm bảo tính toàn vẹn thông qua khóa ràng buộc kép `UNIQUE(showtime_id, seat_number)` để tuyệt đối không xảy ra trùng lặp ghế trong cùng một suất chiếu.

---

## 🚀 Hướng Dẫn Cài Đặt Và Khởi Chạy

### Yêu cầu hệ thống
Đảm bảo máy tính của bạn đã cài đặt **Node.js** (Khuyến nghị phiên bản 18 trở lên).

### Bước 1: Tải mã nguồn về máy
```bash
git clone <URL_KHO_LƯU_TRỮ_CỦA_BẠN>
cd Va
```

### Bước 2: Cài đặt các thư viện liên quan
Chạy lệnh sau tại thư mục gốc để tự động cài đặt các dependencies cho cả Server và Client:
```bash
npm install
cd client
npm install
cd ..
```

### Bước 3: Khởi chạy dự án
Tại thư mục gốc của dự án, chạy lệnh:
```bash
npm run dev
```
Lệnh này sẽ tự động khởi động đồng thời cả 2 cổng:
- **Client**: Chạy tại địa chỉ **`http://localhost:5173/`** (Xem trên trình duyệt).
- **Backend API**: Chạy tại địa chỉ **`http://localhost:5001/`** (Tự động chuyển tiếp qua proxy của client).

*Lưu ý: Trong lần khởi chạy đầu tiên, hệ thống sẽ tự động tạo tệp cơ sở dữ liệu `server/cine_cinema.db` và nạp sẵn dữ liệu mẫu bao gồm phim, thể loại và lịch chiếu hoạt hình đáng yêu để bạn sẵn sàng trải nghiệm.*
