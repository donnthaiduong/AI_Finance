# CascadeGuard — điều tra giao diện và hành trình người dùng

Ngày: 07/10/2026. Phạm vi: chỉ khảo sát, không sửa mã. Dựa trên main tại `cb74b14`.

Ba loại nội dung được tách riêng: **Quan sát** (đã thấy trực tiếp), **Đề xuất** (ý kiến của người rà soát) và **Chưa kiểm chứng**.

## 1. Phương pháp

- Chạy bản dev (`127.0.0.1:3000`) bằng Chromium (Playwright) ở 1440×900 và 390×844, đi hết thẻ nhiệm vụ trong `docs/SME_USER_STUDY.md`: ví dụ, tìm mức chuẩn bị tối thiểu, xác nhận, Scenario Lab, kế hoạch một trang.
- Ảnh lưu cùng thư mục: `desktop-01…06`, `mobile-01…06`. Ảnh chụp toàn trang nên sidebar sticky và thanh điều hướng dưới trên mobile hiện giữa trang. Đó là hiệu ứng của ảnh chụp, không phải lỗi bố cục.
- Đây là một người rà soát chạy kịch bản. Không phải thử nghiệm với SME, nên không có số đo về thời gian hay mức hiểu của người dùng thật.
- Không dùng Chrome extension (không khả dụng trong phiên này).

## 2. Quan sát

### 2.1 Hành trình theo thẻ nhiệm vụ
- Từ trang trống đến kế hoạch một trang cần **6 lần bấm** trên cả desktop và mobile: Explore example, Find minimum, tick, Confirm, Scenario Lab, Prepare plan. Thời gian chạy kịch bản khoảng 10 giây (do máy, không phải thời gian người dùng).
- Không có tràn ngang ở 390px.
- Hero hiện kết quả ngay: "…you are $17,000.00 short from day 15 (Suppliers)", kèm hành động chuẩn bị bên phải.

### 2.2 Năm câu hỏi hiểu đúng và nơi chúng được trả lời
Kiểm tra bằng tìm chuỗi văn bản trên trang sau khi đi hết luồng:

| Câu hỏi | Kết quả |
|---|---|
| Giả định của người dùng, không phải dự báo | Có ("RESULT UNDER YOUR ASSUMPTIONS", "not a prediction") |
| Không chuyển tiền thật | Có ("no real money moves") |
| Doanh thu tương lai bị loại; tiền trở lại ngày 22 | Có (chú thích dưới chart, "Funds return · day 22") |
| Không bảo đảm khi ngân hàng khác bị ảnh hưởng | Chỉ có ở dòng nhỏ trong Scenario Lab ("Only the selected bank interruption is evaluated"). Không có trong hero |
| Không phải dự đoán sụp đổ ngân hàng | Chỉ rõ ở Bank Evidence và kế hoạch; hero chỉ nói "not a prediction" |

### 2.3 Vấn đề thấy trên màn hình
1. **Hai hệ điều hướng:** sidebar 3 mục (Treasury Workspace / Bank Evidence / Scenario Lab) và stepper 4 bước (Cash accounts → Overview). Bước cuối tên "Overview", trùng nghĩa với mục sidebar.
2. **Giả định hiện hai nơi:** bước 3 của stepper và Scenario Lab. Chuẩn bị phương án cũng hiện hai nơi: hero và Scenario Lab.
3. **Kế hoạch một trang nằm cuối Scenario Lab**, sau form, bảng, Copilot và cảnh báo. Người dùng phải biết cuộn tới đó.
4. **Mở/lưu kế hoạch ẩn trong menu "Plan"** ở topbar.
5. **Số tiền luôn có .00 ở mọi cấp độ** (KPI, hero, chart callout). Số lớn có cả cent làm khó quét nhanh; cent chỉ cần ở chi tiết.
6. **Chart:** vùng "Access limited" màu vàng phủ gần hết chart, che thông điệp chính (vùng âm). Callout "Day 15 −$17,000" đè lên đường và nhãn.
7. **Khối thông báo ("Example assumptions loaded…") bị nhét vào ô hành động của hero**, làm ô chật.
8. **Scenario Lab sau khi đã đủ tiền vẫn hiện "Compare preparation"** và nút "Find minimum preparation", dù không còn thiếu hụt.
9. **Hero trên mobile dài**: KPI và chart nằm dưới màn hình đầu tiên.
10. **Phông chữ:** CSS khai báo Inter nhưng không có `@font-face`, `@import` hay `next/font`, nên máy người dùng sẽ dùng phông hệ thống. `globals.css` còn tham chiếu Manrope/DM Sans không được nạp.
11. **Mã không dùng:** `app/workspace.tsx` (25 KB) không được import ở đâu (đã grep `app`, `lib`, `tests`). Có vẻ là mã cũ.

### 2.4 Các mục còn mở từ lượt rà soát trước
- #1 Headline "covered" không nêu phạm vi một ngân hàng. Hiện ở dòng phụ.
- #4 Chuẩn bị tối thiểu chưa tính sẵn.
- #6 Biên an toàn nằm ở card phụ.
- #9 `whole()` làm tròn giá trị âm nhỏ.
- #10 Tooltip "Concentration" hơi suy diễn.

## 3. Bản đồ mẫu thiết kế: Nasdaq và kiểu tư vấn

**Giới hạn bằng chứng:** WebFetch tới nasdaq.com và mckinsey.com đều hết thời gian chờ. Điều đã xác nhận chỉ là kết quả tìm kiếm cho thấy CSS của Nasdaq dùng Inter (chính) và Bitter (phụ), có font biểu tượng riêng. Các mẫu bên dưới dựa trên kiến thức chung về loại giao diện này, **chưa được đối chiếu với trang thật** trong phiên này.

| Mẫu | Nên chuyển | Nên điều chỉnh | Nên bỏ |
|---|---|---|---|
| Số liệu dạng bảng, tabular figures | Có (đã có `tabular-nums` ở vài chỗ; áp dụng nhất quán) | | |
| Khối số chính ở đầu trang + ngày "as of" | | Hero + dòng "Assumptions as of …" và nguồn dữ liệu | |
| Tab phụ trong trang | Gộp stepper thành tab một cấp | | |
| Bảng dày, nhiều cột | | Chỉ ở Bank Evidence, không ở Treasury | |
| Ticker, đỏ/xanh nhấp nháy, mua/bán | | | **Bỏ**: ngụ ý thị trường trực tiếp, đầu tư, dự báo; trái AGENTS.md |

Cách đọc "phong cách tư vấn" (cần bạn xác nhận ở mục 5): kiểu trình bày exhibit của các hãng tư vấn chiến lược.

| Nguyên tắc | Áp dụng cho CascadeGuard |
|---|---|
| Tiêu đề hành động nêu kết luận | Hero hiện đã làm vậy; thêm cho từng chart |
| Tóm tắt điều hành trước | Hero + một dòng khuyến nghị |
| Một thông điệp mỗi chart | Tách "cash outlook" và "obligations by day" rõ ý |
| Nguồn và "as of" dưới mỗi exhibit | Dòng nguồn dưới chart: "Source: your entered balances and payments" |

Về hành trình: nguyên tắc "một việc mỗi trang" và tiết lộ dần của GOV.UK Design System đã được xác nhận ([Question pages](https://design-system.service.gov.uk/patterns/question-pages/)). Ý nghĩa với sản phẩm: bước nhập liệu nên tách rõ khỏi kết quả. Con số "68% bỏ onboarding" từ blog SEO **không được dùng** vì không kiểm chứng được.

## 4. Đề xuất (chưa làm, chờ quyết định)

1. **Một luồng dẫn dắt thay vì hai hệ điều hướng:** Nhập liệu → Kết quả → Chuẩn bị → Kế hoạch. Bank Evidence là mục phụ. Bỏ trùng lặp giữa stepper và sidebar.
2. **Gộp giả định và chuẩn bị về một nơi** (hiện hai nơi mỗi thứ).
3. **Đưa "kế hoạch một trang" thành bước cuối của luồng**, không chôn cuối Scenario Lab. Đưa Open/Save ra ngoài menu nếu cần.
4. **Hero:** nêu phạm vi một ngân hàng ngay trong headline; thêm dòng "ngân hàng khác chưa được mô hình hóa" ở mức đọc được.
5. **Số tiền:** làm tròn đô la ở headline và KPI, giữ cent ở chi tiết và bảng.
6. **Chart:** giảm cường độ vùng vàng, đưa vùng âm lên làm tâm điểm; chuyển callout khỏi đường dữ liệu.
7. **Phông chữ:** nạp thật Inter bằng `next/font` hoặc bỏ khai báo.
8. **Dọn mã:** xóa `app/workspace.tsx` và phông không dùng, sau khi bạn xác nhận.
9. **Mobile:** đưa kết quả và hành động lên màn hình đầu, rút ngắn hero.
10. **Thu gọn Scenario Lab khi không thiếu hụt:** ẩn "Compare preparation".

## 5. Chưa kiểm chứng
- Hành vi thật của SME: thời gian hoàn thành, mức hiểu chart, mức hiểu năm câu hỏi. Cần chạy giao thức pilot trong `docs/SME_USER_STUDY.md` (chưa có người tham gia nào).
- Chi tiết thiết kế Nasdaq/McKinsey (timeout, xem mục 3).
- Hiển thị trên trình duyệt khác (Safari, Firefox) và thiết bị thật.
- Trợ năng (đọc màn hình, tương phản). Chưa chạy kiểm tra.

## 6. Câu hỏi cần bạn quyết định
1. **Ai là người dùng chính:** chủ SME, hay kế toán/fractional CFO hỗ trợ họ?
2. **Mật độ thông tin:** dày kiểu Nasdaq, hay thoáng và bình tĩnh hơn?
3. **Luồng:** một luồng dẫn dắt, hay giữ 3 view cộng stepper?
4. **Sidebar xanh navy tối:** giữ hay chuyển sang nền sáng?
5. **Mobile:** là ưu tiên, hay desktop trước?
6. **"Ngân hàng xấu nhất" (#1 trước):** có nằm trong phạm vi không?
7. **"Phong cách tư vấn":** có đúng là kiểu exhibit với tiêu đề hành động, tóm tắt trước, nguồn dưới mỗi chart không?

## 7. Đã triển khai theo quyết định của bạn (07/10/2026, chưa commit)

Quyết định: người dùng chính là CFO; giao diện sạch và thân thiện; một luồng dẫn dắt; thanh điều hướng đưa lên trên cùng; desktop trước; có "ngân hàng xấu nhất"; phong cách exhibit tư vấn ở mức nhẹ.

- **Một luồng 5 bước ở thanh trên cùng:** 1 Cash accounts · 2 Payments · 3 Scenario Lab · 4 Results · 5 Plan. Bank Evidence và menu File nằm bên phải. Sidebar đã bỏ; không còn stepper thứ hai.
- **Scenario Lab là bước 3:** kết quả hiện tại, form giả định duy nhất, bảng "nếu ngân hàng khác bị gián đoạn" (cùng % và số ngày, có nút chọn làm ngân hàng bị ảnh hưởng), chi tiết tính toán, Verify và Copilot.
- **Results là bước 4:** hero, chuẩn bị tối thiểu, KPI, biểu đồ. Hero có dòng "All banks" nêu phạm vi. Chuẩn bị chỉ còn một nơi (hero).
- **Plan là bước 5:** kế hoạch một trang, ghi chú "Before relying on this preparation" nằm trong phần in.
- **Tiêu đề hành động và dòng nguồn** dưới các biểu đồ chính. Số tiền hiện đô la tròn khi cent bằng 0, ngược lại giữ đủ cent; không làm tròn xuống.
- Chart nhẹ hơn (vùng vàng mờ hơn, callout đặt ở đầu vùng vẽ).
- Thông báo cũ tự tắt khi bấm bước hoặc Bank Evidence trên thanh trên cùng.

Kiểm tra: `tsc` sạch, `npm test` 69/69, `next build` thành công. Kịch bản trình duyệt (`after/`) ở 1440, 1280 và 390px: mọi kiểm tra đạt, gồm tổng $180,000, $72,000 không khả dụng, thiếu $17,000 từ ngày 15, chuẩn bị $21,250.00, sau xác nhận đủ tiền, tiền trở lại ngày 22, đổi đích làm mất đề xuất, không tràn ngang, in ẩn thanh trên cùng.

Chưa kiểm chứng / chưa làm: thử nghiệm với CFO thật, trợ năng, trình duyệt ngoài Chromium, bố cục mobile chỉ kiểm tra không tràn. Chưa nạp phông Inter (vẫn dùng phông hệ thống). `app/workspace.tsx` (mã cũ) chưa xóa vì chưa được duyệt. Lệnh `npm run dev` đang chạy tại 127.0.0.1:3000.

## 8. Điều chỉnh: website nhiều dịch vụ, tool là một dịch vụ (07/10/2026, chưa commit)

Phản hồi của bạn: giao diện giống một công cụ tính toán; website còn các dịch vụ khác, nên luồng 5 bước làm điều hướng chính của cả site là không thực tế. Quyết định: dịch vụ gồm Báo cáo và nghiên cứu, Tư vấn; giá trị cốt lõi là minh bạch nguồn và giả định, chính xác và kiểm chứng được; khách mới "hiểu dịch vụ trước"; tool ở trang con riêng có luồng riêng.

Cấu trúc mới:
- `/` Trang chủ: hero, thẻ ví dụ minh họa (có nhãn dữ liệu ví dụ), ba dịch vụ, hai giá trị cốt lõi kèm "What we do not do", tóm tắt cách dùng Liquidity Check, ghi chú nghiên cứu, kêu gọi liên hệ.
- `/tools` và `/tools/liquidity-check`: tool với luồng 5 bước riêng nằm trong thanh công cụ dưới header của site; không chiếm điều hướng của cả site.
- `/research`: kết quả pilot, lấy từ `outputs/REPRODUCTION_REPORT.json`, nêu rõ mạng không vượt đối chứng bỏ mạng.
- `/advisory`: trang tư vấn. Header và footer dùng chung (`app/site-header.tsx`, `app/site-footer.tsx`, `lib/site.ts`).

Kiểm tra: `tsc` sạch, 69/69 test, `next build` thành công, mọi trang trả 200 và không tràn ngang ở 1440 và 390px. Kịch bản của tool chạy lại ở đường dẫn mới, không có FAIL. Ảnh ở `site/`.

Cần chủ dự án xác nhận (chưa kiểm chứng): nội dung trang Advisory là bản nháp chỉ dựa trên những gì sản phẩm đã làm; chưa có thông tin về mô tả dịch vụ, quy trình, giá hay hồ sơ. Địa chỉ liên hệ lấy từ biến môi trường `NEXT_PUBLIC_CONTACT_EMAIL`; chưa đặt nên trang hiển thị "Contact details are not configured yet." Chưa có tên miền, deployment, thử người dùng hay dữ liệu khách hàng.

## 9. Bộ câu hỏi nhập liệu theo thẻ nhỏ (07/10/2026, chưa commit)

Yêu cầu: chia câu hỏi thành các nhóm nhỏ, xong một nhóm thì trượt sang nhóm kế tiếp trong cùng bước.

- **Cash accounts:** mỗi ngân hàng là một thẻ (tên + số dư + liên kết bằng chứng tùy chọn), cuối là thẻ tổng kết (thêm ngân hàng khác hoặc tiếp tục).
- **Payments:** mỗi khoản chi là một thẻ (mô tả + số tiền + ngày đến hạn), cuối là thẻ tổng kết.
- **Scenario Lab:** 3 câu hỏi (ngân hàng nào; không dùng được bao nhiêu %, có nút nhanh 25/50/80/100; bao nhiêu ngày, có nút nhanh 7/14/21/30), rồi thẻ tổng kết. Kết quả hiện tại, bảng từng ngân hàng và chi tiết tính toán chỉ hiện khi tới thẻ tổng kết.
- **Điều khiển:** nút Next chỉ bật khi nhóm hợp lệ; Enter để sang thẻ kế; vuốt ngang (hoặc kéo chuột) để tiến/lùi, vuốt tiến chỉ khi thẻ hợp lệ; chấm tiến độ để quay lại; hoạt ảnh trượt tắt khi người dùng chọn giảm chuyển động.
- **Chế độ danh sách** cũ vẫn còn qua nút "Edit everything as a list" cho người muốn sửa nhanh.

Kiểm tra (`questions/`, 1440 và 390px): chạy trọn thẻ nhiệm vụ từ trang trống, tổng $180,000.00 và $150,000.00, hero thiếu $17,000 từ ngày 15, chuẩn bị $21,250.00, vuốt tiến/lùi, Next bị khóa khi thiếu dữ liệu, không tràn ngang, không lỗi trang. Chưa kiểm chứng: vuốt trên thiết bị cảm ứng thật (kịch bản dùng kéo chuột), đọc màn hình, thử với CFO thật.

## 10. Trang Results gọn và chuyên nghiệp hơn (07/10/2026, chưa commit)

Yêu cầu: bố cục kết quả đơn giản, chuyên nghiệp; biểu đồ trông cao cấp hơn; không có đường cong. Cách hiểu của người rà soát: bỏ mọi hình tròn/bo cong (donut, đầu nét tròn, thanh bo góc, thẻ bo lớn) và giữ đường bậc thang vì số dư chỉ đổi vào ngày có khoản chi. Đường chéo kiểu thị trường sẽ gợi ý tiền giảm dần giữa hai khoản chi, nên chỉ làm nếu bạn muốn.

Thay đổi:
- **Thứ tự:** hero, dải KPI một khối có vạch ngăn, một biểu đồ chính, hai biểu đồ thanh ngang, bảng nghĩa vụ, nút bước. Đã bỏ gauge, donut, biểu đồ nghĩa vụ riêng, thanh trượt ngày và ba ô chi tiết ngày.
- **Biểu đồ chính (giá và khối lượng):** trục giá trị bên phải, lưới 1px, đường 0 đậm, vùng gián đoạn nhạt, đường "Funds return", ô vuông đánh dấu ngày thiếu đầu tiên, con trỏ chữ thập; hàng số liệu cố định phía trên cập nhật theo ngày đang chọn (đủ cent); khoản chi nằm dưới cùng trục ngày, ngày thiếu hụt màu đỏ. Điều khiển bằng chuột, chạm hoặc phím mũi tên, Home, End, PageUp, PageDown (`role="slider"`).
- **Thanh ngang sắp xếp:** tiền theo ngân hàng, và thiếu hụt nếu từng ngân hàng bị gián đoạn (cùng X% và N ngày, không dùng từ xếp hạng rủi ro). Chuẩn bị tối thiểu vẫn chỉ cho ngân hàng đã chọn.
- **Hình dạng:** một biến bán kính (`--r`, 6px) cho toàn tool; góc vuông ở biểu đồ, thanh, chấm tiến độ, nút, thẻ. Bỏ hoạt ảnh đếm số và vẽ dần.
- Không dùng chi tiết cụ thể của Nasdaq hay Tableau (cả hai lần lấy trang đều hết thời gian); chỉ áp dụng quy ước chung của biểu đồ tài chính và bảng điều khiển.

Kiểm tra (`results/`, 1440, 1280, 390px): `tsc`, 69/69 test, `next build` thành công; không có donut hay gauge, không có `rx` hay hình tròn trong biểu đồ; tại ngày 15 hàng số liệu hiện -$17,000.00 và thanh khoản chi ngày 15 màu đỏ; phím mũi tên và Home di chuyển ngày; rê chuột đổi ngày; không tràn ngang, không lỗi trang. Kịch bản cũ (luồng, bộ câu hỏi, các trang site) vẫn đạt. Chưa kiểm chứng: thiết bị cảm ứng thật, đọc màn hình, thử với CFO thật.
