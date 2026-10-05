# AI_Finance / CascadeGuard — định hướng cho mã nguồn

Ghi nhận ngày 04/10/2026 theo yêu cầu của chủ dự án. Nguồn quyết định: chat [Xây dựng định hướng nghiên cứu AI](thread://01a0fce1-cc5a-7162-a74f-1973b66ac3b9?hostId=local), gồm kế hoạch người dùng đã yêu cầu triển khai và các kết quả được báo cáo sau đó. Tài liệu này ghi nhận hướng đi; không xác nhận lại thể lệ cuộc thi hoặc kết quả thử nghiệm.

## 1. Mục tiêu sản phẩm

CascadeGuard giúp chủ SME hoặc người phụ trách tài chính sử dụng ngân hàng Mỹ trả lời: tiền còn khả dụng có đủ trả các khoản chi thiết yếu trong 30 ngày khi một phần tiền gửi tạm thời không sử dụng được hay không?

Ưu tiên lean product: hoàn thành một tác vụ hữu ích, đo hiệu quả với người dùng rồi mới mở rộng. Hướng dự thi kế thừa là Topic E — SME Finance Copilot. App và demo bằng tiếng Anh, sử dụng USD. Yêu cầu hồ sơ và lịch cuộc thi phải được kiểm tra riêng khi chuẩn bị nộp.

## 2. Hành trình và phạm vi MVP

1. **Treasury Workspace:** chọn ngân hàng, nhập số dư giả định và lịch chi trong 30 ngày.
2. **Bank Evidence:** xem chỉ tiêu ngân hàng thật, nguồn, kỳ báo cáo, độ mới, mức tập trung và tín hiệu mô hình.
3. **Scenario Lab:** chọn ngân hàng bị ảnh hưởng, tỷ lệ tiền không khả dụng và thời gian; tính thiếu hụt, so sánh phương án phân bổ.
4. Copilot giải thích kết quả từ công cụ, trình phương án để xác nhận, áp dụng vào danh mục mô phỏng và ghi nhật ký.

Danh mục lưu trên thiết bị. Không cần đăng nhập cho tác vụ cốt lõi. Không kết nối tài khoản ngân hàng, chuyển tiền thật hoặc đưa lệnh đầu tư. Không mở rộng địa lý trước khi kiểm chứng dữ liệu và nhu cầu.

## 3. Quy tắc tính toán và copilot

- Sử dụng số nguyên cent và quy ước rõ ngày gián đoạn/ngày tiền khả dụng lại.
- Kết quả tái lập với cùng đầu vào; tổng tiền không đổi khi chuyển phân bổ giả định.
- Kiểm tra số âm, giá trị không hữu hạn, ngân hàng trùng, khoản chi hoặc ngày không hợp lệ và dữ liệu thiếu.
- Phương án chỉ áp dụng sau xác nhận; đổi đầu vào làm mất hiệu lực phương án chờ xác nhận. Nhật ký giữ đầu vào và kết quả trước/sau.
- Mọi con số do công cụ tính. Phân biệt dữ liệu ngân hàng thật với giả định số dư và kịch bản.
- Nội dung nguồn không được cấp quyền điều khiển công cụ. Copilot hiện định hướng theo tác vụ và công cụ xác định; hội thoại LLM tổng quát không phải điều kiện để hoàn thành MVP.

## 4. Dữ liệu và kiến trúc kế thừa

Nguồn dự kiến: FDIC Institutions, Financials, Summary of Deposits (SOD); Treasury bổ sung bối cảnh lãi suất. Python thu thập, chuẩn hóa, lưu snapshot và huấn luyện ngoài Sites. Giao diện/API trên Sites Worker; D1 lưu dữ liệu chuẩn hóa, R2 lưu snapshot/checkpoint. Đây là kiến trúc kế thừa, chưa được dựng trong repo này.

Mỗi bản dữ liệu ghi nguồn, kỳ báo cáo, ngày công bố nếu xác minh được, ngày thu thập, hash và phiên bản dữ liệu/mô hình. Không lấy ngày tải làm ngày công bố lịch sử. Kiểm tra đơn vị FDIC theo từng trường trước khi quy đổi sang USD.

Nhịp cập nhật dự kiến: FDIC/Treasury hằng ngày, SOD hằng tuần. Chỉ huấn luyện lại khi dữ liệu ngân hàng/mạng thay đổi; thay đổi riêng Treasury không bắt buộc huấn luyện lại. Endpoint nhập snapshot phải xác thực, bí mật ở máy chủ. Khi lỗi, giữ bản hợp lệ gần nhất và hiển thị tình trạng dữ liệu.

API tối thiểu: danh sách ngân hàng, bằng chứng theo ngân hàng, tính kịch bản, nhập snapshot quản trị. Kết quả tính gắn phiên bản dữ liệu/mô hình khi có sử dụng chúng.

## 5. Nghiên cứu phục vụ sản phẩm

Giả thuyết: mạng chồng lấn tiền gửi theo địa bàn có thể giúp dự báo thay đổi tiền gửi quý tiếp theo và ưu tiên ngân hàng cần xem xét. GraphSAGE hai lớp phải so với lag growth, Ridge và neural bỏ mạng với cấu hình so sánh công bằng.

Tách train/validation/test theo thời gian; chuẩn hóa chỉ trên train, chọn mô hình trên validation, báo cáo MAE và recall nhóm suy giảm mạnh cùng kết quả nhiều seed. Đặc trưng và cạnh mạng phải tuân thủ thời điểm thông tin khả dụng. Nếu không có lịch sử ngày công bố, ghi là kiểm định hồi cứu có giới hạn.

Chat trước báo cáo pilot 32 ngân hàng, 1.344 quan sát tài chính, 392.715 quan sát SOD; GraphSAGE chưa vượt đối chứng bỏ mạng và chưa cải thiện recall. Vì vậy **Ridge là mặc định kế thừa**, GNN giữ trong nghiên cứu. Các con số này chưa được tái lập tại AI_Finance và không được dùng như kết quả mới của repo.

Dự báo tiền gửi không phải xác suất ngân hàng đổ vỡ; mạng tương đồng không chứng minh lây lan nhân quả. Pilot ngân hàng lớn còn hoạt động có survivorship bias; dữ liệu lịch sử có thể đã sửa đổi.

## 6. Tiêu chí hoàn thành

- Hoàn thành hành trình nhập → xem bằng chứng → mô phỏng → so sánh → xác nhận, với nguồn dữ liệu truy được.
- Kiểm tra phép tính thiếu hụt, bảo toàn tiền, ngày hoàn trả và đầu vào sai; kiểm tra phương án chưa xác nhận không được áp dụng.
- Kiểm tra cập nhật lỗi giữ snapshot, endpoint quản trị được bảo vệ và nội dung nguồn không điều khiển copilot.
- Có báo cáo đối chứng, cấu hình chạy và hướng dẫn tái lập; công bố cả kết quả không cải thiện.
- Thử với 5 người dùng phù hợp, mục tiêu ít nhất 4 người hoàn thành trong 5 phút và hiểu giả định. Đây vẫn là bước chưa thực hiện theo chat nguồn.
- Nhu cầu thuê bao và mức sẵn sàng trả là giả thuyết cần khảo sát, chưa phải doanh thu được xác thực.

## 7. Trạng thái và thứ tự triển khai tại repo này

### Cập nhật nền tảng ngày 04/10/2026

Người dùng đã chốt ưu tiên nghiên cứu trước demo, chạy cục bộ với snapshot có nguồn,
hosting quyết định sau; có thể tiếp cận chủ SME/người phụ trách tài chính dùng ngân hàng
Mỹ. Hướng chi tiết và câu hỏi chưa chốt ở `docs/FOUNDATION_DIRECTION_VI.md`.

Đã chuyển phần ứng dụng và pipeline từ workspace cũ, ghi hash nguồn tại
`docs/IMPORT_PROVENANCE.json`, tách adapter cục bộ và bổ sung audit/reproduction.
Pilot đã chạy lại ở repo này; lựa chọn Ridge và metric test khớp kết quả kế thừa, xem
`outputs/REPRODUCTION_REPORT.json`. Đây là tái lập corpus cũ, chưa thu thập dữ liệu mới.
Không đổi mô hình mặc định hoặc quảng bá lợi ích mạng. Các trạng thái bên dưới mô tả
thời điểm ghi nhận ban đầu, không mô tả mã nguồn sau cập nhật này.

### Repository được chủ dự án xác nhận ngày 04/10/2026

- Repository chính thức: [donnthaiduong/AI_Finance](https://github.com/donnthaiduong/AI_Finance).
- Clone URL: `https://github.com/donnthaiduong/AI_Finance.git`.
- Workspace hiện tại: `C:\Users\thaid\OneDrive\Documents\ChatGPT\AI_finance`.
- Chat định hướng liên quan: [Xây dựng định hướng nghiên cứu AI](thread://01a0fce1-cc5a-7162-a74f-1973b66ac3b9?hostId=local).
- Metadata đã xác minh qua plugin GitHub: repository public, không archived, nhánh mặc định `main`, size được API báo là 0. Đây không phải bằng chứng mã nguồn MVP đã được đưa lên GitHub.
- Kiểm tra cục bộ cùng ngày: nhánh `master`, chưa cấu hình remote; `AGENTS.md` và tài liệu định hướng chưa được Git theo dõi. Lần ghi nhận này chỉ cập nhật tài liệu và thông báo chat liên quan, chưa commit/push hoặc chuyển mã nguồn.

Khi ghi nhận, thư mục chỉ có `.git`, nhánh `master` chưa có commit và chưa có remote hiển thị. Repo được chọn cho phiên là `donnthaiduong/AI_Finance`; không coi đây là bản mã nguồn CascadeGuard đã chuyển sang.

Chat nguồn đã báo cáo MVP cục bộ, build/TypeScript/7 test/UI đạt và có gói mã nguồn, HTML cùng đề án song ngữ. Chat đó báo chưa xuất bản Sites, chưa bật lịch cập nhật. Chưa kiểm tra lại các artifact ấy tại repo hiện tại.

Thứ tự tiếp theo: kiểm tra và chuyển mã nguồn đã có khi được yêu cầu → tái lập build, dữ liệu và phép tính → hoàn thiện ba màn hình cùng xác nhận → tái lập kiểm định mô hình → thử người dùng → chuẩn bị demo/đề án song ngữ. Không dựng lại toàn bộ khi có thể tái sử dụng bản đã có. Lịch 03–16/10 trong kế hoạch cũ chỉ là kế hoạch lịch sử, cần cập nhật theo tiến độ thực tế.
