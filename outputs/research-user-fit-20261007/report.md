# CascadeGuard: đánh giá nhu cầu, hiệu quả và định hướng sản phẩm

## Kết luận

(analysis) **Nên tiếp tục MVP, với định vị hẹp là chuẩn bị tiền cho các khoản chi thiết yếu trước gián đoạn truy cập một ngân hàng. Chưa đủ bằng chứng để gọi đây là sản phẩm đã phù hợp thị trường hoặc website đã chứng minh lợi ích với SME.**

(analysis) Mục tiêu nên diễn đạt bằng việc người dùng muốn hoàn thành: “Nếu mất quyền truy cập một ngân hàng, tôi có đủ tiền trả lương và các khoản thiết yếu không; tôi cần chuẩn bị bao nhiêu trước đó?” Giữ tác vụ chính cùng hai phần bổ trợ đã chốt: mức chuẩn bị tối thiểu và kế hoạch một trang. Không đề xuất biến app thành nền tảng tài chính tổng quát.

## Phương pháp và giới hạn

(analysis) Nghiên cứu mức standard, ngày 07/10/2026: mở tám trang nguồn dùng trong ledger, qua host web search/open vì Exa không có trong danh mục công cụ; đối chiếu mã tại commit `9432d5d`, ảnh UI và audit hiện có. Đây là đánh giá nguồn và thiết kế; không chạy thêm tests, không khảo sát người dùng hoặc đo website live/deployment trong lượt này.

(analysis) Đã chạy kiểm tra URL bằng script: kết quả UNKNOWN do script không truy xuất được; không coi đây là URL chết hoặc đã kiểm tra HTTP thành công. Các trang dùng trong ledger đã mở được bằng công cụ web. Quotes được kiểm tra offline với nội dung công cụ web trả về; quy tắc fidelity đã được rà soát, kể cả các cảnh báo do dịch Việt/Anh. (analysis) FDIC FAQ/SVB và Rippling trả 403 khi mở, nên không dùng snippets của các trang đó làm bằng chứng.

(analysis) Bằng chứng nội bộ đọc trực tiếp: [mã giao diện](../../app/treasury-workspace.tsx), [mô hình tính](../../lib/scenario.ts), [tìm mức chuẩn bị](../../lib/preparation.ts), [audit](../CORE_COMPLETION_AUDIT.json), [protocol SME](../../docs/SME_USER_STUDY.md), [ảnh mobile](../mobile-results-proof-20261005.png). Audit ghi chưa có phiên SME và AI thật chưa xác minh; đây là trạng thái ghi nhận, không phải kết quả thử nghiệm mới.

## Q1 — Nhu cầu thanh khoản vận hành có thật không?

**Verdict: answered; độ tin cậy cao cho nhu cầu chung, thấp cho nhu cầu dùng CascadeGuard.**

Trong báo cáo Employer Firms của Fed Small Business, chi phí vận hành chiếm 56% trong các lý do doanh nghiệp tìm nguồn tài trợ; không được diễn giải thành 56% toàn bộ SME muốn mua app này [C1].

JPMorgan Chase Institute ghi nhận trung vị 27 ngày đệm tiền trong nghiên cứu lịch sử, với giao dịch quan sát từ tháng 2 đến tháng 10/2015; không phải thống kê hiện tại năm 2026 [C2, C12].

SBCS không phải mẫu ngẫu nhiên, nên cần lưu ý giới hạn khái quát hóa [C11].

(analysis) Các kết quả này ủng hộ việc giúp SME hiểu khả năng trả chi thiết yếu. Chúng không xác định tỷ lệ SME từng mất truy cập ngân hàng, tần suất dùng công cụ dự phòng hoặc khả năng trả phí. (analysis) Cũng không suy ra nên đặt kỳ hạn 30 ngày cho mọi doanh nghiệp.

## Q2 — App chuyên gián đoạn ngân hàng có giải quyết nhu cầu đủ mạnh không?

**Verdict: contested; có trường hợp thực tế, chưa rõ tần suất và thị trường đủ lớn.**

Brex ghi nhận khách SVB lo về payroll và nhu cầu vận hành, nhưng sau đó thông báo dừng chương trình bridge loan [C3, C5].

Thông cáo joint statement của Treasury/Fed/FDIC cho biết khách SVB sẽ truy cập toàn bộ tiền từ thứ Hai 13/3; đây là phản chứng với việc lấy riêng case SVB để mặc định gián đoạn kéo dài hàng tuần [C4].

(analysis) Tình huống này chứng minh sự cấp thiết có thể xuất hiện, không chứng minh xác suất hoặc thời gian gián đoạn điển hình. “80% trong 21 ngày” trong demo phải là giả định người dùng, không là dự báo từ phần mềm. Trường hợp một ngân hàng bị ảnh hưởng cũng không đại diện cho toàn bộ sự cố tại nhà cung cấp payroll, nền tảng fintech hoặc nhiều ngân hàng cùng lúc.

(analysis) **ICP đề xuất để thử trước:** chủ SME/người phụ trách tài chính có payroll định kỳ, lịch chi thiết yếu rõ và tiền vận hành ở nhiều ngân hàng độc lập; kế toán hoặc fractional CFO có thể là người hỗ trợ đánh giá. Đây là phân khúc giả thuyết, chưa được khách hàng xác nhận.

(analysis) Nhóm phù hợp kém hơn: người chỉ cần dự báo doanh thu, doanh nghiệp thiếu tiền tổng thể mà không có ngân hàng dự phòng, hoặc đơn vị đã có quy trình treasury hoàn chỉnh. Với người chỉ có một ngân hàng, app có thể phát hiện thiếu dự phòng nhưng chưa giúp thực hiện phương án ngay.

## Q3 — Website hiện tại tạo lợi ích gì, và mô hình bỏ sót gì?

**Verdict: answered về phạm vi mã; unknown về hiệu quả thực tế.**

(analysis) Ma trận dưới đây là đánh giá thiết kế từ mã hiện tại, không phải kết quả khảo sát:

| Thành phần | Lợi ích có thể đem lại | Điều kiện/điểm chưa được chứng minh |
|---|---|---|
| Treasury Workspace | Gom số dư và nghĩa vụ thành câu hỏi trả được tiền hay không | Nhập thủ công; người dùng phải biết số dư thực sự dùng được và lịch chi đầy đủ |
| Kết quả ngày thiếu đầu tiên và thiếu tối đa | Cụ thể hóa khoản cần chuẩn bị | Chỉ đúng với đầu vào, một ngân hàng bị ảnh hưởng và quy ước tiền trở lại |
| Minimum preparation | So sánh một mức phân bổ nhỏ nhất trong kịch bản đã chọn | Không tối ưu toàn bộ rủi ro, nhiều ngân hàng, phí hoặc khả năng thanh toán thực tế |
| Xác nhận + lịch sử | Cho phép xem lại thay đổi giả định | Không thực hiện hành động ngân hàng; kế hoạch ngoài app vẫn cần chuẩn bị |
| Kế hoạch một trang | Có tài liệu để trao đổi với chủ doanh nghiệp/kế toán | PDF dạng ảnh; chỉ tóm tắt một phần danh sách, không thay full JSON |
| Bank Evidence | Cho người dùng xem nguồn và kỳ dữ liệu | Dự báo tiền gửi không xác định tỷ lệ phong tỏa; giá trị bổ sung cho tác vụ chưa được người dùng chứng minh |
| Copilot | Có thể giúp hiểu câu hỏi và giả định | AI thật chưa được xác minh; tác vụ phải hoàn thành được bằng guided mode |

Fed Small Business ghi nhận thanh toán của khách là nguồn tiền chính của doanh nghiệp nhỏ [C8].

(analysis) Loại doanh thu tương lai khỏi tính toán giữ đúng mục tiêu kiểm tra với tiền hiện có, nhưng giới hạn khả năng thay thế công cụ forecast thường xuyên. Không nên gọi kết quả này là dự báo dòng tiền đầy đủ.

(analysis) **Khoảng trống quan trọng nhất: đủ tiền không đồng nghĩa trả được đúng hạn.** Mã giả định tiền khả dụng có thể dùng cho mọi nghĩa vụ, trong khi không mô hình hóa thiết lập payroll tại ngân hàng đích, hạn mức, phê duyệt, giờ cut-off và độ trễ xử lý. Không tính tiền vào có thể làm kịch bản khắt khe hơn; giả định thanh toán tức thời có thể làm nó lạc quan hơn. Không gọi toàn bộ mô hình là “bảo thủ” nếu chỉ dựa vào việc bỏ inflows.

(analysis) Các ma sát cần kiểm tra: Day 1–30 chưa gắn với ngày lịch trong luồng nhập; tên ngân hàng do người dùng nhập cần gom đúng tổ chức; tài khoản sweep có thể phức tạp hơn việc cộng theo tên; giả định về ngân hàng đích vẫn phải được người dùng xem xét. Đây là các ranh giới mô hình, không phải đề xuất xây hệ thống ngân hàng thật.

## Q4 — Khác biệt và bài học từ sản phẩm khác

**Verdict: contested; có định vị hẹp khả thi, chưa chứng minh lợi thế cạnh tranh.**

Mercury mô tả sweep phân bổ qua nhiều ngân hàng mà khách không cần mở hoặc quản lý riêng các tài khoản đó. Đây là mô tả từ nhà cung cấp, không là bằng chứng độc lập rằng mọi gián đoạn truy cập đã được loại bỏ [C6].

Float mô tả forecast Base gồm budgets, invoices, bills và giao dịch ngân hàng đã đối soát [C7].

(analysis) So sánh nhằm rút bài học, không phải kiểm định mọi tính năng cạnh tranh:

| Lựa chọn | Bài học cho CascadeGuard | Ranh giới định vị |
|---|---|---|
| Spreadsheet hiện có | Cần chứng minh nhanh hơn hoặc ít lỗi hơn trên cùng tác vụ; không dựa vào hình thức giao diện | Không có benchmark đối đầu trong nghiên cứu này |
| Float | Baseline phải rõ trước khi thêm kịch bản; giảm công nhập liệu có giá trị | Không cạnh tranh bằng forecast toàn diện hoặc kế toán tích hợp trong MVP |
| Mercury sweep | Người dùng quan tâm giảm gánh nặng vận hành và bảo vệ tiền | Mô phỏng của CascadeGuard không cung cấp bảo hiểm hoặc thực hiện phân bổ |
| Case Brex/SVB | Đặt payroll/operating spend và hành động cần chuẩn bị ở trung tâm | Nhu cầu bridge có thể biến mất khi tiền mở lại; không lấy một sự kiện làm thị trường thuê bao |

(analysis) Điểm khác biệt cần kiểm chứng: công cụ chuẩn bị độc lập, dùng với ngân hàng hiện có, tìm mức dự phòng cho nghĩa vụ cụ thể và tạo kế hoạch có thể xem lại. Không tuyên bố độc nhất hoặc sáng tạo chỉ vì có GNN/AI. Trong tác vụ này, giải thích rõ và dữ liệu nhập đúng có thể quan trọng hơn model phức tạp.

## Q5 — Có đạt user friendly và user-focused benefits chưa?

**Verdict: unknown; thiết kế có nền tảng, chưa có kiểm chứng SME.**

NN/G khuyến nghị nhóm nhỏ năm người cho nghiên cứu usability định tính [C9].

SBCS ghi nhận accuracy là thách thức hàng đầu của nhóm doanh nghiệp dùng AI, với 46% báo cáo vấn đề này [C10].

(analysis) Guided steps, ví dụ có nhãn, hiển thị before/after và xác nhận là nền tảng hợp lý. Nhưng kiểm thử phần mềm, ảnh mobile và đối chiếu máy chủ không chứng minh chủ SME hiểu giả định, hoàn thành nhanh hoặc dùng kế hoạch để quyết định. Không đánh đồng độ ổn định kỹ thuật với hiệu quả sản phẩm.

(analysis) Ưu tiên UX cần thử: headline bằng ngôn ngữ payroll/chi thiết yếu; nhập tổng số dư dùng được thay vì mọi giao dịch; giải thích tỷ lệ unavailable và duration khi người dùng chưa biết chọn; đánh dấu rõ mô phỏng và ngân hàng đích; để Bank Evidence là phần tùy chọn phục vụ câu hỏi cụ thể. Giữ ba section đã chốt, không thêm dashboard mới.

## Q6 — Có cơ sở cho sử dụng lặp lại và thương mại chưa?

**Verdict: unknown; cần bằng chứng sơ cấp từ người dùng.**

(analysis) Không có bằng chứng nội bộ về phiên SME, quay lại sử dụng hoặc trả phí. Nguồn thị trường đọc trong lượt này cũng không xác định willingness-to-pay cho tác vụ cụ thể của CascadeGuard. Không thể khắc phục khoảng trống bằng thêm truy vấn về thị trường tài chính nói chung.

(analysis) App dùng theo sự kiện có thể hữu ích nhưng ít quay lại; đây là rủi ro giả thuyết cần kiểm tra. Cách đóng gói như kiểm tra dự phòng trước kỳ payroll, rà soát định kỳ hoặc công cụ cho kế toán là ứng viên thử nghiệm, chưa phải chiến lược doanh thu đã được xác thực.

## Thứ tự hành động đề xuất

(analysis) **P0 — Kiểm chứng tác vụ trước khi thêm chức năng.** Tuyển theo ICP; hỏi tình huống gần nhất, quy trình hiện tại và điều kiện khiến họ thay đổi quy trình. Không hỏi dẫn dắt “có thích AI bảo vệ tiền không”. Thử task với cùng đầu vào trên app và cách họ đang dùng; đảo thứ tự hai cách để giảm thiên lệch học bài.

(analysis) **P0 — Bổ sung kiểm tra sẵn sàng trong kế hoạch, nếu phỏng vấn xác nhận nhu cầu.** Ngân hàng đích đã tồn tại/chuyển khoản và payroll đã được thiết lập chưa, ai phê duyệt, có hạn mức/cut-off nào cần xác minh? Đây là cải tiến cho companion kế hoạch, không là xác nhận tự động ngân hàng có thể xử lý.

(analysis) **P1 — Giảm công nhập trong Workspace khi quan sát thấy trở ngại.** Cân nhắc paste bảng/CSV lịch chi với màn review, validation và nguồn ngày rõ. Không thay bằng tích hợp tài khoản thật trong MVP. Giữ minimum preparation và one-page plan là hai companion; không thêm chức năng thứ ba chỉ để khác biệt.

(analysis) **P2 — Model/Copilot.** Đánh giá sau khi người dùng hoàn thành tác vụ và hiểu giả định. Không ưu tiên đổi Ridge/GNN hoặc tăng chat tổng quát để giải quyết vấn đề định vị hoặc nhập liệu.

## Gate đề xuất để quyết định tiếp tục

(analysis) Dùng gate usability đã chốt trong protocol: ít nhất bốn trong năm người hoàn thành không hỗ trợ trong năm phút và hiểu đúng tỷ lệ là giả định, không dự báo phá sản, không chuyển tiền thật. Đây là tiêu chuẩn pilot, không là tỷ lệ thành công toàn thị trường.

(analysis) Thêm tiêu chí nhu cầu cho pilot: ít nhất ba người nêu được một tình huống/quy trình cụ thể cần kế hoạch này; quan sát ít nhất hai người chủ động muốn áp dụng vào kỳ payroll hoặc lịch chi tiếp theo. Các ngưỡng là đề xuất quyết định nội bộ, không là kết quả hiện có hoặc bằng chứng thống kê.

(analysis) Theo dõi công thu thập/nhập dữ liệu, thời gian hoàn thành, sai sót, hỗ trợ cần thiết, hiểu giả định và hành động chuẩn bị cụ thể. Nếu nhập nhanh nhưng không ai có tác vụ thực tế, sửa định vị. Nếu có tác vụ nhưng nhập quá tốn công, sửa input. Nếu hiểu sai bảo đảm thanh toán, sửa copy và kế hoạch trước mở rộng.

(analysis) **Quyết định cuối: tiếp tục lean MVP cho nhóm hẹp; ưu tiên kiểm chứng nhu cầu và khả năng thực hiện kế hoạch. Chưa đầu tư mở rộng thị trường, tính năng hoặc thuê bao dựa trên bằng chứng hiện tại.**

## Nguồn và bằng chứng

(analysis) Ledger: `ledger.jsonl`; bản đọc của nguồn: `sources/`; brief: `brief.md`. Nguồn vendor dùng để hiểu tính năng và trường hợp họ báo cáo; không dùng làm kết quả độc lập về lợi ích.
