# 🍜 Naruto Tools - Hoang Mạc Auto Pro (v2.0.0)

> **Hệ thống Auto Thông Minh Đa Bản Đồ & Bản Đồ Radar 2D Siêu Mượt cho Game Naruto Đại Chiến (Flash)**  
> *Kiến trúc hiện đại: C# WinForms Host Microsoft WebView2 + HTML5/CSS3 Glassmorphism UI*

---

## 🌟 Tính Năng Đột Phá Trên Phiên Bản v2.0.0

- 💎 **Giao Diện Web Cao Cấp (Microsoft WebView2 + Obsidian Dark Neon):**
  - Hiệu ứng kính mờ (Glassmorphism), viền ánh sáng Neon tinh tế, không gây mỏi mắt.
  - Thiết kế Không Khung Viền (Frameless Window) hiện đại với đầy đủ nút điều khiển (Thu nhỏ, Phóng to/Khôi phục, Đóng).
  - **Trải nghiệm Kéo Thả Mượt Mà:** Giữ chuột trái vào thanh tiêu đề để di chuyển cửa sổ tức thì, thả tay ra để cố định vị trí (sử dụng Win32 `GetAsyncKeyState` & HTML5 Pointer Capture).
- 🗺️ **Bản Đồ Radar 2D Đa Năng (HTML5 Canvas 60 FPS):**
  - Tự động bắt gói tin máy chủ (CMD 4353, 4354, 4526, 4525) hiển thị tên map thực tế và tỷ lệ pixel chuẩn xác.
  - Hoạt động trên **MỌI bản đồ**: Làng Lá (Mộc Diệp), Lục Đạo Hoang Mạc, Rừng Chết, Thung Lũng Tận Cùng, Phó Bản, Đấu Trường...
  - Nhận diện trực quan: Nhân vật (🟢 Xanh lá), Tô Ramen (🍜 Vàng), Ngọc Xanh (🔮 Tím), Quái vật (⚔️ Đỏ), NPC (🔵 Xanh da trời), Cổng dịch chuyển (🌀 Ngọc lam).
- 🎯 **Công Nghệ Click-To-Move Chuẩn Xác 100%:**
  - Click vào bất kỳ vị trí nào trên Radar để nhân vật di chuyển tức thì.
  - Click vào Ramen hoặc Ngọc để tự chạy đến nhặt.
  - Click vào Quái vật để tiếp cận và khiêu chiến ngay.
  - Click vào NPC để mở đối thoại, click Cổng để chuyển map.
- ⚡ **Thuật Toán Tìm Đường Gần Nhất (Nearest Target):**
  - Tự động tính khoảng cách Euclid tối ưu, nhặt các mục tiêu gần nhất trước giúp tăng tốc độ farm gấp 2 - 3 lần.
- 🔄 **Tự Động Cập Nhật Trực Tiếp Trên App (On-App Auto Update):**
  - Tích hợp kiểm tra phiên bản từ GitHub Releases, tự động tải và thay thế an toàn không làm mất bản quyền hay cấu hình.

---

## 🚀 Hướng Dẫn Cài Đặt & Sử Dụng

1. Tải bản phát hành mới nhất: **[Tải file ZIP v2.0.0 tại GitHub Releases](https://github.com/dophu25502hd-source/Naruto_Tools/releases/latest)**.
2. Giải nén thư mục `Ramen Tool`.
3. Chạy `ramen.exe` (hoặc `Start_Tool_Ramen.bat`).
4. Kiểm tra đường dẫn thư mục `Client:` chứa `NarutoInfinityClient.exe` (bấm 📁 để chọn nếu chưa đúng).
5. Bấm nút **[▶ START PROXY]**.
6. Mở `NarutoInfinityClient.exe` và đăng nhập vào game: Radar 2D sẽ hiển thị bản đồ và vị trí nhân vật ngay lập tức!
7. Tùy chọn chế độ farm và bấm **[▶ BẮT ĐẦU]** để bot tự động tuần tra.

---

## 📦 Yêu Cầu Hệ Thống

- Hệ điều hành: Windows 10 / 11 (64-bit hoặc 32-bit).
- Đã cài đặt **Microsoft Edge WebView2 Runtime** (mặc định đã có sẵn trên Windows 10/11).
- .NET Framework 4.5 trở lên.

---

## 📜 Giấy Phép & Bản Quyền

Dự án phát triển phục vụ cộng đồng người chơi Naruto Đại Chiến.  
Bản quyền thuộc về **Hoang Mac Auto Pro Team**.
