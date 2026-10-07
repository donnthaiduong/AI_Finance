# CascadeGuard — đánh giá giao diện sau redesign 07/10/2026

Phạm vi: `main` tại `2751c44` (`app/treasury-workspace.tsx`, `app/liquidity-overview.tsx`, `app/finance-design.css`, `app/globals.css`). Chỉ đánh giá, không sửa mã.

Cách kiểm tra: cài phụ thuộc, chạy `next dev` cục bộ, thao tác trong trình duyệt ở 1366×900 và 390×844 với ví dụ có sẵn ($180,000 tiền, $150,000 nghĩa vụ). Đi hết luồng: trống → thêm bank → ví dụ → Overview → Scenario Lab → chọn bank đích → "Find minimum preparation" (ra $21,250, thiếu hụt $17,000 → $0). Một số ảnh chụp bị timeout nên phần hình ảnh desktop dùng thêm `outputs/ux-redesign-20261007/*.png`; số đo mobile lấy bằng DOM. **Chưa có người dùng SME thật nào tham gia**; nhận định về "5 phút" là suy luận từ số bước và vị trí nội dung, không phải đo thời gian.

## Kết luận ngắn

Redesign đi đúng hướng: bốn chỉ số + biểu đồ bậc thang + "next step" đã trả lời được câu hỏi chính, số liệu trung thực (đến cent, ghi rõ giả định, không ám chỉ xác suất đổ vỡ). Nhưng **câu trả lời chưa được đặt lên đầu**, **luồng từ "có gap" đến "phương án" dài và vòng vèo**, **biểu đồ không đọc được trên điện thoại**, và có **một lỗi nội dung lộ ra người dùng** (`day duration+1`). Hai hệ CSS chồng nhau gây lỗi thị giác nhỏ.

## Ưu tiên CAO

| # | Phát hiện | Bằng chứng | Sửa cụ thể |
|---|---|---|---|
| H1 | Chuỗi mẫu lộ ra UI: "Funds return at start of day **duration+1**." trong Scenario Lab và trong kế hoạch in. | `lib/scenario.ts:39` (`assumptions`), hiển thị tại `treasury-workspace.tsx:170` và `:178`. | Sinh câu với số thật (`day ${durationDays+1}`). Thêm test kiểm tra văn bản giả định không chứa tên biến. Đây là lỗi làm giảm lòng tin vào một công cụ "tính đúng đến cent". |
| H2 | Màn hình đầu không nói câu trả lời. H1 là "Treasury workspace", câu trả lời ("thiếu $17,000 từ ngày 15") là ô thứ 4 và lặp lại ở card "Your next step" bên dưới biểu đồ. | Desktop: card next-step ở y≈1000px. Mobile 390px: chỉ số đầu ở y=606, "Maximum shortfall" ở y=737 (giá trị gần mép màn 844), card next-step ở y=1298. | Thay page heading bằng một dòng kết luận: "If Example bank A is 80% frozen for 21 days, you're **$17,000 short on day 15** (Suppliers)." + nút chính. Đưa "Maximum shortfall" lên ô đầu, hoặc gộp card next-step lên trên biểu đồ. Ẩn eyebrow/sub-title chung chung. |
| H3 | Từ "có gap" đến "phương án" mất ~6 thao tác qua 2 trang và phải cuộn qua nội dung trùng lặp. "Review preparation →" mở Scenario Lab, ở đó lại là form giả định → biểu đồ lặp lại → bảng kết quả → mới đến chọn bank đích → "Find minimum" → tick → confirm. Thông báo "Review the minimum preparation…" hiện ở **đầu trang** trong khi đề xuất nằm **cuối trang**. | `treasury-workspace.tsx:168–174`. | Trong card next-step: hỏi ngay "Move cash to which bank?" (mặc định bank không bị ảnh hưởng có số dư lớn nhất), tự tính minimum, hiện "Move $21,250 from A to B → gap $0" ngay tại chỗ, kèm checkbox + Confirm. Scenario Lab giữ cho người muốn chỉnh sâu. Cuộn/focus tới proposal khi tạo. |
| H4 | Biểu đồ không đọc được trên mobile: SVG viewBox 760 co về 321px, chữ trục 11px thành **~4.6px**. | Đo DOM ở 390px. | Dưới 720px: dùng viewBox hẹp (≈360) hoặc vẽ lại với nhãn ở kích thước CSS thật; chỉ 3 nhãn ngày (1/15/30); hoặc thay bằng danh sách "Day 15: −$17,000" dưới biểu đồ. |
| H5 | Nút "Start with my inputs" thực chất **xóa** danh mục hiện tại về trống (có `window.confirm`). Cùng với "Try an example", hai nút này lặp lại trên mọi trang, kể cả Scenario Lab. Empty state còn có cặp nút thứ hai cùng ý ("Add my bank balances" / "Explore example portfolio"). | `treasury-workspace.tsx:79–82`, `:159`, `:162`. | Đổi nhãn thành "New blank plan" và đưa vào menu phụ (cạnh Import/Export). Chỉ hiện CTA bắt đầu trong empty state. Dùng dialog trong app thay `window.confirm`. |

## Ưu tiên TRUNG BÌNH

| # | Phát hiện | Sửa |
|---|---|---|
| M1 | **Ngày tương đối 1–30** thay vì ngày lịch. SME nghĩ "payroll ngày 15/10", không nghĩ "day 5 của sự cố giả định". Ngoài ra không có thanh toán định kỳ (payroll 2 tuần/lần phải nhập tay 2 dòng). | Cho chọn ngày bắt đầu kịch bản (mặc định hôm nay), nhập ngày lịch, hiển thị cả "Oct 15 · day 9". Thêm "repeats every 2 weeks / monthly" cho dòng chi. |
| M2 | Gánh nặng nhập liệu nhỏ nhưng có ma sát: ô số tiền mặc định `0` phải xóa; bank mới có tên rỗng; nút "Next: payments" bị khóa mà không nói vì sao; dropdown "Optional evidence link" chỉ ~32 ngân hàng lớn và **ghi đè** tên bank người dùng đã gõ bằng tên pháp lý FDIC. | Ô trống có placeholder thay vì 0; nhắc lý do khi nút bị khóa; giữ tên người dùng, hiển thị liên kết FDIC như nhãn phụ; nói rõ "evidence available for 32 large banks only". |
| M3 | Thuật ngữ không nhất quán cho cùng một con số: "Maximum shortfall", "cumulative obligations unmet", "cash gap", "Scenario remaining", "Maximum cumulative shortfall". "Allocate" dùng cho việc thực chất là chuyển tiền trước sự cố. | Chọn một bộ: "Shortfall" (số âm lớn nhất), "Cash left", "Move before the freeze". Ghi chú ngắn: "this is a plan, not a transfer". |
| M4 | Thanh "Inspect day" mặc định Day 1 → hiển thị "Due $0.00", thông tin vô ích. Ngày tiền trở lại (day 22) và các ngày chi không được đánh dấu trên biểu đồ. Trục Y có mốc giữa lẻ ("$81,500"). | Mặc định chọn ngày thiếu hụt đầu tiên; đánh dấu điểm chi và "funds return" trên trục; dùng mốc tròn (0, 50k, 100k, 150k). |
| M5 | Đề xuất minimum ($21,250) đưa thiếu hụt về **đúng $0**, không có biên an toàn; nhắc nhở cutoff/approval nằm cuối trang dạng chú thích. | Thêm tùy chọn buffer (ví dụ +10% hoặc nhập số); đặt checklist vận hành (destination ready, payroll instructions, cutoff) ngay trong card xác nhận. |
| M6 | Hai design system chồng nhau: `globals.css` (theme teal/navy cũ, font DM Sans/Manrope không được nạp) + `finance-design.css` (tím). Hệ quả thấy được: tab bước đang chọn có **viền xanh lục** lệch tông (`globals.css:2` `.journey button[aria-current=step]{outline:2px solid #23806d}` + class `secondary`). `app/workspace.tsx` (UI cũ, theme tối) không còn được dùng nhưng vẫn trong repo. | Gom về một file token; xóa outline xanh và class `secondary` trên tab; xóa hoặc chuyển `workspace.tsx` ra khỏi `app/`. |
| M7 | Khả năng tiếp cận: rất nhiều chữ 8–11px (`.day-badge` 8px, `.scenario-receipt small` 9px, ghi chú 9–10px); màu `#898492` trên trắng ≈3.6:1 (dưới 4.5:1 cho chữ nhỏ); đường "No interruption" `#a8b3c8` ≈2.2:1 (dưới 3:1 cho đồ họa); link "Manage banks/payments/Edit scenario" cao 19px trên mobile (dưới 24px). Ước tính độ tương phản theo mã màu, chưa chạy công cụ audit. | Sàn chữ 12px (13–14px trên mobile), màu chữ phụ ≥ `#6b6e7c`, đường baseline đậm hơn hoặc nét đứt; vùng chạm ≥ 44px trên mobile. Chạy axe/Lighthouse để xác nhận. |
| M8 | Mobile: điều hướng chính và Import/Export JSON chiếm phần đầu màn; tab "Overview" rơi xuống dòng riêng; khi có thông báo "Latest confirmed simulation" thì kết quả bị đẩy xuống thêm. | Bottom nav hoặc nav gọn 1 dòng; đưa Import/Export vào menu "⋯"; tab bước cuộn ngang 1 dòng; gộp thông báo vào card kết quả. |

## Ưu tiên THẤP

- L1. "↗" trên "Edit scenario" và "Prepare one-page plan" gợi ý mở link ngoài, nhưng là điều hướng nội bộ. Trong Scenario Lab, "Edit scenario ↗" trỏ về chính trang đó; nút "See results" đưa người dùng rời khỏi trang dù kết quả nằm ngay bên dưới.
- L2. "Import JSON / Export JSON" là thuật ngữ kỹ thuật với chủ SME. Đề xuất "Save plan file / Open plan file".
- L3. Sidebar "Plan with confidence" và ô "CG · Operating cash" giống danh tính tài khoản; dễ hiểu nhầm là đã kết nối. Đổi thành "Local plan · not connected to your bank".
- L4. Bank Evidence hiện "Next-quarter deposit growth estimate" ở từng bank. Có chú thích "not a failure probability", nhưng chưa nói vì sao nó giúp quyết định thanh toán. Nên thu gọn mặc định, đặt sau câu "Optional context; does not change your result."
- L5. Sau khi đã có ví dụ, không có dấu hiệu thường trực "Example data" trên Overview ngoài tên "Example bank A". Thêm badge "Example data" cho đến khi người dùng sửa số.
- L6. Proposal chưa xác nhận vẫn vẽ đường "Proposed allocation" trên Overview nhưng không có nút xác nhận ở đó; nên có link "Review proposal".

## Điều đang làm tốt (nên giữ)

- Số liệu trung thực: đến cent, tabular numerals, "Covered under assumptions", "Planned obligations, not completed transactions", "No real money moved", không suy xác suất đổ vỡ.
- Biểu đồ bậc thang đúng bản chất dòng tiền rời rạc; vùng âm tô màu; aria-label tóm tắt kết quả; bảng tính từng ngày có sẵn.
- Xác nhận hai bước (tick + confirm), sửa đầu vào thì hủy proposal; tổng tiền bảo toàn.
- Không tràn ngang ở 390px; tiếng Anh, USD nhất quán đúng định hướng.

## Thứ tự làm đề xuất

1. H1 (sửa chuỗi), H5 (đổi nhãn nút reset), M6 (bỏ viền xanh): nhỏ, rủi ro thấp.
2. H2 + H3: đưa câu trả lời và phương án minimum vào màn đầu. Đây là thay đổi quyết định việc đạt mục tiêu "5 phút".
3. H4 + M7 + M8: mobile và accessibility.
4. M1, M2: ngày lịch và nhập định kỳ, nên kiểm chứng với 3–5 SME trước khi làm vì thay đổi mô hình nhập.

Sau khi sửa, đo thực tế với người dùng: thời gian đến "biết ngày thiếu hụt", thời gian đến "có phương án", và tỷ lệ diễn giải đúng con số shortfall.
