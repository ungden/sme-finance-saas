# Hướng dẫn Setup SaaS SME Finance (Vercel + Supabase)

Để dự án hoạt động với đầy đủ tính năng Đăng nhập và Cơ sở dữ liệu, anh cần kết nối Next.js với Supabase Auth và deploy lên Vercel. Dưới đây là các bước tĩnh gọn nhất:

## Bước 1: Khởi tạo Supabase (Database + Auth)
1. Truy cập [https://supabase.com/dashboard/projects](https://supabase.com/dashboard/projects) và đăng nhập bằng tài khoản GitHub/Google.
2. Bấm nút màu xanh **"New Project"**.
3. Chọn Organization, đặt tên là `sme-finance`, nhập một mật khẩu Database đủ mạnh (lưu lại mật khẩu này) và chọn Region là `Singapore` (để kết nối nhanh nhất về Việt Nam).
4. Bấm **Create New Project** và đợi khoảng 1-2 phút để Supabase setup xong server.

## Bước 2: Bật tính năng Đăng ký tài khoản
Mặc định Supabase sẽ yêu cầu người dùng xác thực email cực kỳ rườm rà. Trong giai đoạn mới Launch, anh nên tắt bước này đi để user đăng ký xong là xài ngay:
1. Nhìn menu bên trái, bấm vào **Authentication** (icon ổ khóa) -> chọn **Providers**.
2. Bấm vào dòng **Email**.
3. Tắt công tắc ở mục **"Confirm email"** (Để là Off/Tắt).
4. Kéo xuống dưới bấm **Save**.

## Bước 3: Lấy API Keys của Supabase
1. Nhìn menu bên trái dưới cùng, bấm vào **Project Settings** (icon bánh răng ⚙️).
2. Xổ ra menu con, chọn **API**.
3. Dưới mục **Project URL**, copy đường link (ví dụ: `https://xyz.supabase.co`) → *Đây là NEXT_PUBLIC_SUPABASE_URL*.
4. Dưới mục **Project API keys**, copy đoạn mã dài dằng dặc ở mục `anon / public` → *Đây là NEXT_PUBLIC_SUPABASE_ANON_KEY*.

## Bước 4: Deploy lên Vercel
1. Truy cập [https://vercel.com/new](https://vercel.com/new) và đăng nhập bằng tài khoản GitHub ghép với repo `sme-finance-saas` ban nãy em đã đẩy lên.
2. Anh sẽ thấy repo `ungden/sme-finance-saas` ngay trên cùng. Bấm nút **Import**.
3. Màn hình "Configure Project" hiện ra:
   - Framework preset: Cứ để nguyên là `Next.js`.
   - Bấm mở rộng phần **Environment Variables** (icon mũi tên xuống).
4. Dán 2 key anh vừa copy ở Bước 3 vào đây:
   - Name: `NEXT_PUBLIC_SUPABASE_URL` | Value: *dán URL* -> Bấm **Add**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Value: *dán Anon Key* -> Bấm **Add**
5. Cuối cùng, bấm nút to bự **Deploy**.

## Xong! 🎉
Đợi khoảng 2 phút, Vercel sẽ nhả ra 1 domain (thường là `sme-finance-saas.vercel.app`).
Từ lúc này, hệ thống Auth đã kết nối, user vào trang của anh có thể bấm **Đăng nhập**, tạo tài khoản mới và sử dụng Dashboard hoàn hảo! 
