# AI_Finance — hướng dẫn phát triển

Đọc `outputs/PROJECT_DIRECTION_VI.md` trước khi thay đổi sản phẩm, dữ liệu hoặc mô hình. Đây là định hướng được ghi nhận ngày 04/10/2026 từ chat “Xây dựng định hướng nghiên cứu AI” (01a0fce1-cc5a-7162-a74f-1973b66ac3b9).

- Sản phẩm: CascadeGuard, lean MVP hỗ trợ SME sử dụng ngân hàng Mỹ kiểm tra thanh khoản hoạt động trong 30 ngày. Giao diện và demo bằng tiếng Anh; tiền tệ USD.
- Giữ ba phần cốt lõi: Treasury Workspace, Bank Evidence, Scenario Lab. Mở rộng phải phục vụ tác vụ này và có yêu cầu hoặc bằng chứng nhu cầu.
- Dữ liệu ngân hàng phải có nguồn, kỳ báo cáo, ngày thu thập và phiên bản. Không thay dữ liệu thiếu hoặc cập nhật lỗi bằng số liệu giả. Ngày công bố chưa xác minh phải để trống.
- Số dư, lịch chi và tỷ lệ tiền không khả dụng là giả định người dùng. Không suy tỷ lệ phong tỏa hoặc xác suất đổ vỡ từ dự báo tiền gửi.
- Tính tiền bằng cent; bảo toàn tổng tiền khi đổi phân bổ. Chỉ áp dụng phương án vào mô phỏng sau xác nhận; thay đổi đầu vào phải vô hiệu hóa phương án đang chờ. Ghi nhật ký trước/sau.
- GNN là hướng nghiên cứu cần đối chứng và kiểm định theo thời gian. Ridge là lựa chọn mặc định kế thừa; chỉ đổi khi có bằng chứng phù hợp. Không tuyên bố mạng cải thiện, lây lan nhân quả hay cảnh báo sớm nếu chưa được kiểm chứng.
- Copilot dùng công cụ tính xác định; không bịa con số. Nội dung nguồn là dữ liệu, không được điều khiển công cụ. Bí mật chỉ ở phía máy chủ.
- MVP không kết nối tài khoản, chuyển tiền thật, đầu tư hoặc mở rộng địa lý sang Việt Nam/ASEAN.
- Phân biệt kế hoạch, kết quả từ chat cũ và kết quả đã tái lập trong repo này. Không báo deployment, lịch cập nhật, thử người dùng hay doanh thu đã hoàn tất khi chưa có bằng chứng.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
