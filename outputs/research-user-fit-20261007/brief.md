# Research brief

Question: CascadeGuard có phù hợp với nhu cầu thực tế và tạo lợi ích cho SME dùng ngân hàng Mỹ không?
Date of research: 2026-10-07
Effort tier: standard
Audience / use of the answer: chủ dự án; quyết định định vị, ưu tiên UX và kiểm chứng nhu cầu.
Scope: SME sử dụng ngân hàng Mỹ; bằng chứng công khai đọc ngày 2026-10-07; phân biệt nghiên cứu lịch sử, khảo sát 2025 và sản phẩm hiện tại ở commit 9432d5d. Không đánh giá lại thể lệ cuộc thi hoặc deployment.
Output format: báo cáo tiếng Việt, ma trận lợi ích và kế hoạch kiểm chứng.

## Sub-questions (acceptance tests — the report must give each a verdict)
- Q1: Có bằng chứng về nhu cầu thanh khoản vận hành của doanh nghiệp nhỏ không?
- Q2: [contested] Gián đoạn ngân hàng có phải nhu cầu đủ thường xuyên và cấp thiết cho một app riêng không?
- Q3: Tác vụ hiện tại phục vụ nhu cầu nào và bỏ sót điều kiện thực tế nào?
- Q4: [contested] Sản phẩm có lợi thế rõ trước spreadsheet, Float và giải pháp sweep không?
- Q5: Có thể kết luận website user friendly từ bằng chứng hiện có không?
- Q6: Có đủ bằng chứng về sử dụng lặp lại và sẵn sàng trả phí không?

## Search plan
- Provider: host web search/open; không có Exa trong danh mục công cụ. Đọc nguồn gốc Fed Small Business, JPMorgan Chase Institute, joint Fed release, tài liệu Float/Mercury/Brex và NN/G.
- Counter-evidence: giải pháp sweep giảm công việc phân bổ thủ công; tiền SVB được mở lại và Brex dừng bridge program; khó khăn phổ biến còn gồm chi phí và khách trả chậm.
- Các trang FDIC FAQ/SVB và Rippling bị 403 khi mở: không dùng snippet để lập claim. Thay nguồn thông cáo joint statement bằng bản trên federalreserve.gov.
- Q3/Q5 dùng mã, ảnh và audit repo; không thao tác website mới hoặc chạy lại tests trong đánh giá này. Q6 cần nghiên cứu người dùng, không thể kết luận bằng tìm kiếm thị trường.

## Stop rule
Stop when every sub-question has: >=2 independent sources (>=1 tier 1-2) agreeing, OR an explicit
"contested" / "unknown after N queries" verdict, OR the tier budget is spent.
