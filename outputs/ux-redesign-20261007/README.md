# CascadeGuard — tái thiết kế trải nghiệm treasury

Ngày: 07/10/2026. Thay đổi đã triển khai trong mã nguồn; chưa triển khai lên website công khai, chưa thử với SME thực tế.

## Mục tiêu và kiến trúc

Giúp chủ doanh nghiệp/finance operator trả lời: tiền đang giữ có đủ cho các nghĩa vụ thiết yếu trong 30 ngày nếu tạm mất quyền sử dụng tiền tại một ngân hàng? Giữ ba phần Treasury Workspace, Bank Evidence và Scenario Lab.

- Treasury Workspace mặc định mở tổng quan, có bốn chỉ số: tổng tiền, tiền khả dụng lúc gián đoạn, nghĩa vụ và thiếu hụt tối đa. Các tab quản lý cash accounts, payment schedule và assumptions dùng dữ liệu hiện có.
- Cash outlook hiển thị đường bậc thang từ kết quả tính từng ngày: không gián đoạn, kịch bản đã chọn và phương án đang chờ duyệt. Vùng âm biểu thị nghĩa vụ chưa được đáp ứng. Thanh chọn ngày có số liệu USD chính xác đến cent; trục chỉ làm tròn để dễ đọc.
- Cash by bank cho thấy phân bổ theo ngân hàng, Upcoming obligations hiển thị năm nghĩa vụ gần nhất và điều hướng đến toàn bộ lịch chi. Mọi số liệu đều từ đầu vào; không có biểu đồ trang trí hoặc số liệu doanh nghiệp giả ngầm định.
- Scenario Lab tập trung giả định, so sánh, xác nhận mô phỏng và tạo kế hoạch PDF. Copilot mở khi cần; đọc bảng tính từng ngày vẫn có thể thực hiện.
- Bank Evidence hỗ trợ tìm theo tên/mã FDIC, giữ nguồn, kỳ báo cáo, ngày thu thập, phiên bản và giới hạn mô hình.
- Empty state hướng dẫn nhập dữ liệu thật hoặc chủ động chọn ví dụ. Giữ khả năng xuất/nhập và khôi phục dữ liệu thiết bị.

Thiết kế dùng nền sáng, sidebar cố định trên desktop, màu tím làm điểm nhấn, chữ số dạng tabular, bảng và card có phân cấp, bố cục co về một cột trên màn hình hẹp. Giao diện tiếng Anh, USD.

## Bài học từ dịch vụ Mỹ

[Mercury Insights](https://support.mercury.com/hc/en-us/articles/44277089544084-Insights-page-overview): tổng quan tài chính, biểu đồ và khả năng đi sâu vào dữ liệu. Áp dụng vào cash outlook và lịch nghĩa vụ; CascadeGuard chỉ tính từ đầu vào, không có feed giao dịch thời gian thực.

[Brex dashboard](https://www.brex.com/support/brex-dashboard-and-app): navigation, tìm kiếm và bảng phục vụ tác vụ. Áp dụng vào ba workspace và tìm bằng chứng ngân hàng. Đây là tham chiếu cấu trúc, chưa chứng minh người dùng sẽ quen hoặc làm việc nhanh hơn với CascadeGuard.

## Kiểm tra và giới hạn

- TypeScript typecheck và production build thành công.
- Trình duyệt bản production: ví dụ tổng tiền $180,000, nghĩa vụ $150,000, thiếu hụt $17,000 từ ngày 15. Chọn bank B cho phương án $21,250, thiếu hụt sau phương án $0, tổng tiền giữ nguyên.
- Nút xác nhận khóa khi chưa tick. Sửa duration hủy đề xuất và đường biểu đồ phương án. Xác nhận cập nhật mô phỏng và giữ history trước/sau.
- Tìm FDIC 628 trả về một ngân hàng JPMorgan Chase. Kiểm tra viewport 390px: không tràn ngang. Ảnh lưu kèm thư mục này.
- Không thêm hoặc chạy bộ unit test trong lượt thiết kế này. Không sửa thuật toán tài chính, schema phiên, dữ liệu ngân hàng hoặc mô hình dự báo.
- Chưa kiểm chứng thời gian hoàn thành tác vụ, khả năng hiểu chart, mức giảm lỗi hoặc nhu cầu trả phí của SME. Cần tuyển người dùng trước khi tuyên bố hiệu quả thực tế.

Khả năng bao phủ nghĩa vụ không xác minh readiness của tài khoản đích, payroll, giới hạn/cutoff/approval hay settlement. UI có nhắc rà soát các điều kiện này. Ngày vẫn là ngày tương đối của kịch bản; không có ngày đến hạn lịch thực, kết nối ngân hàng hay chuyển tiền.

## Mã nguồn

- `app/treasury-workspace.tsx`: điều hướng và luồng hiện có.
- `app/liquidity-overview.tsx`: dashboard và biểu đồ tính xác định.
- `app/finance-design.css`: design system, responsive layout.
- `app/layout.tsx`: nạp stylesheet mới.

Lần kiểm chứng tiếp theo: quan sát SME nhập cash/payments, xác định ngày thiếu hụt, duyệt phương án và chuẩn bị kế hoạch. Đo thời gian, tỷ lệ hoàn thành và lỗi hiểu kết quả trước khi bổ sung chức năng.
