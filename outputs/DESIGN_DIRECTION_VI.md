# CascadeGuard — hướng xây dựng giao diện (HTML/CSS) và thiết kế

Ghi nhận ngày 15/10/2026 theo yêu cầu của chủ dự án: định hướng lại cách tiếp cận giao diện cho thân thiện với người dùng và tập trung vào trải nghiệm chính của phần mềm. Tài liệu này là **hướng đi**, chưa sửa mã. Bổ sung, không thay `outputs/PROJECT_DIRECTION_VI.md`; khi mâu thuẫn, `PROJECT_DIRECTION_VI.md` và `AGENTS.md` thắng.

Cơ sở: mã hiện tại trên `main` (`a3d886c`) **cộng 11 tệp đã sửa và 5 tệp mới chưa commit** (`app/cash-chart.tsx`, `app/example-outlook.tsx`, `lib/chart-data.ts`, `lib/example-portfolio.ts`, `tests/chart-data.test.mjs`); đánh giá cũ `outputs/ux-review-20261007/UI_REVIEW_VI.md`; kết quả `lint.mjs` và `draw.mjs` của taste-skill chạy ngày 15/10. Chưa chạy `inspect.mjs`, chưa chụp màn hình, chưa có người dùng SME thật tham gia.

## 1. Nguyên tắc gốc: trải nghiệm chính đứng trước giao diện

Phần mềm chỉ có một việc: trả lời **"Nếu một ngân hàng tạm thời không dùng được, tiền còn lại có đủ trả các khoản thiết yếu trong 30 ngày không — và nếu không thì cần chuẩn bị gì?"** Mọi quyết định thiết kế được chấm bằng một câu hỏi: nó làm hành trình dưới đây nhanh hơn, rõ hơn hay an toàn hơn không? Nếu không, bỏ.

**Hành trình chính (mục tiêu ≤ 5 phút, theo tiêu chí thử 5 người dùng):**

1. Nhập tiền theo ngân hàng → 2. Nhập khoản chi thiết yếu 30 ngày → 3. Chọn ngân hàng bị ảnh hưởng, % không khả dụng, số ngày → 4. **Câu trả lời** → 5. **Phương án tối thiểu ngay tại chỗ** → 6. Xác nhận → 7. Xuất kế hoạch một trang.

Bank Evidence, Calculation details, Copilot, so sánh "nếu ngân hàng khác bị ảnh hưởng" là **lớp phụ**: luôn truy cập được, không bao giờ chen vào giữa bước 3 và bước 6.

### Quy tắc trải nghiệm (áp cho mọi màn hình ứng dụng)

| # | Quy tắc | Cụ thể |
|---|---|---|
| U1 | Câu trả lời trước, chi tiết sau | Dòng đầu màn hình kết quả là một câu có số: "If Bank A is 80% unavailable for 21 days, you are **$17,000 short on day 15**." Chỉ số, biểu đồ, bảng nằm dưới. |
| U2 | Một câu hỏi mỗi bước | Tiêu đề bước là câu hỏi người dùng trả lời được ("Which bank might become unavailable?"). Đã có trong `treasury-workspace.tsx`; giữ. |
| U3 | Từ thiếu hụt đến phương án không quá 2 thao tác | Chọn ngân hàng đích (có mặc định) → thấy "Move $X from A to B → gap $0" → tick xác nhận. Không chuyển trang. |
| U4 | Giả định luôn hiện tên là giả định | Giá trị mặc định ghi "default assumption"; số dư, lịch chi, % phong tỏa là của người dùng. Không đặt chúng từ mô hình. |
| U5 | Thay đổi đầu vào làm phương án chờ hết hiệu lực, **và người dùng thấy điều đó** | Phương án cũ chuyển trạng thái "Out of date — recalculate", nút xác nhận khóa. |
| U6 | Số chính xác ở câu trả lời, số tròn ở trục | Câu trả lời và phương án đến cent; trục biểu đồ được làm tròn. |
| U7 | Điện thoại là bố cục riêng | Chữ trên biểu đồ đúng cỡ CSS thật (≥ 13px), ô nhập và nút đủ cho ngón cái, câu trả lời nằm trong màn hình đầu ở 390px. |
| U8 | Trạng thái trống, lỗi, dữ liệu cũ đều có câu hướng dẫn | Dữ liệu ngân hàng lỗi cập nhật: giữ bản hợp lệ gần nhất, ghi ngày thu thập; không thay bằng số giả. |
| U9 | Tiến trình hiển thị bằng tên bước, không bằng nhãn "STEP 2 OF 5" viết hoa | Thanh tiến trình liệt kê tên bước (Cash · Payments · Scenario · Plan), bước hiện tại đậm. Là `<ol>` thật cho trình đọc màn hình. |

## 2. Hai phạm vi, hai bộ luật

taste-skill ghi rõ không dành cho dashboard/màn hình ứng dụng. Vì vậy tách:

| Phạm vi | Tệp | Luật áp dụng |
|---|---|---|
| **Website giới thiệu** | `app/page.tsx`, `app/research/`, `app/advisory/`, `app/tools/page.tsx`, `app/site.css`, `site-header.tsx`, `site-footer.tsx`, `example-outlook.tsx` | Toàn bộ house rules của taste-skill + gate `lint.mjs` và `inspect.mjs`. |
| **Ứng dụng Liquidity Check** | `treasury-workspace.tsx`, `liquidity-overview.tsx`, `cash-chart.tsx`, `question-flow.tsx`, `ui.tsx`, `finance-design.css` | Quy tắc U1–U9 ở trên đứng đầu. House rules áp dụng cho phần trang trí; **bảng dữ liệu, ô nhập, biểu đồ và thanh tiến trình giữ quy ước của chúng** (đường kẻ bảng, viền ô nhập), đánh dấu `data-ui` hoặc `/* taste-skill-ignore: <lý do> */`. |

### Kết quả lint ngày 15/10 (tách theo phạm vi)

| Mẫu bị cấm | Website | Ứng dụng | Hướng xử lý |
|---|---|---|---|
| Eyebrow (nhãn nhỏ trên tiêu đề) | 4 | 7 | Bỏ. Ở app: thông tin "Result under default assumptions" chuyển vào câu trả lời; "STEP x OF y" thành thanh tiến trình U9. |
| Shadow lúc nghỉ | 3 | 7 | Bỏ; tách bề mặt bằng bậc tông nền. Giữ shadow cho menu, dialog, tooltip `HelpTip`. |
| Gradient | 0 | 2 | Bỏ; màu phẳng. |
| Backdrop blur (glass) | 1 | 1 | Header thành thanh nền đặc. |
| Đường kẻ mảnh / hộp viền 1px | 6 + 8 | 16 + 20 | Website: bỏ hết. App: giữ cho bảng/ô nhập (đánh dấu), bỏ ở card và phân cách section. |
| Font mặc định Inter | 1 | 1 | Đổi sang font của direction (mục 3). |
| **Tổng** | **13 FAIL, 10 WARN** | **32 FAIL, 23 WARN** | Con số app sẽ giảm khi đánh dấu đúng bảng/ô nhập. |

Hai hệ CSS (`site.css` và `finance-design.css`) đang chồng nhau và cùng khai báo font, header blur. Gộp token màu/chữ về **một** khối `:root` dùng chung; mỗi tệp chỉ giữ bố cục của phạm vi mình.

## 3. Website giới thiệu: direction đã rút

`draw.mjs --sector finance --have product-ui`, chọn **`colour-chapters`** trong ba hướng (borrowed-category, colour-chapters, dark-room). Seed `1102627100`, lưu ở `.taste-skill/direction.json`. Xem lại: `node <skill>/scripts/draw.mjs --show`.

**Vì sao chọn:** câu trả lời của sản phẩm tự nó là một chuỗi chương theo thời gian — ngày 1 có tiền, ngày ngân hàng bị gián đoạn, ngày thiếu hụt đầu tiên, việc cần làm trước ngày 1. `dark-room` hợp với vật thể/ảnh, sản phẩm này không có; `borrowed-category` rủi ro làm công cụ tài chính mất vẻ đáng tin.

**Câu ý tưởng:** *Trên trang này, **lịch tiền 30 ngày của chính người dùng — ngày ngân hàng ngừng, ngày tiền thiếu, khoản cần chuyển trước** — trở thành **các chương màu nối tiếp nhau**.* Thử với đối thủ (công cụ dự báo dòng tiền chung): họ có lịch tiền nhưng không có "ngày một ngân hàng ngừng" và "khoản chuyển tối thiểu đến cent", nên câu không còn đúng — ý tưởng thuộc về CascadeGuard.

**Một thứ sống được trên trang:** ví dụ tương tác ở hero (`example-outlook.tsx` đã có) thêm một thanh trượt "% unavailable" — kéo là ngày thiếu hụt và khoản chuyển tối thiểu cập nhật, tính bằng chính `lib/` (cùng hàm của app, không số dựng sẵn). Không có script: hiển thị kết quả ví dụ tĩnh.

| Phần sheet | Áp dụng |
|---|---|
| Hero | "Stacked name, two inks": tên sản phẩm/câu hỏi lớn hai màu mực, ví dụ tương tác ngay cạnh hoặc dưới. Nút chính duy nhất "Check my cash". |
| Chương | showcase (headline gõ được → câu trả lời mẫu) · how-it-works (ba giai đoạn **trên một thanh**, thay danh sách 1/2/3) · proof (dấu lớn trên ô màu: nguồn FDIC, kỳ báo cáo, cent-exact, "simulation only" — **không** khách hàng/trích dẫn bịa) · faq (mỗi câu hỏi một dải) · cta (ô hành động) · footer (tên lớn toàn chiều ngang). |
| Chữ | Albert Sans 400/500/600, một họ chữ; số dùng `font-variant-numeric: tabular-nums`. Dùng chung cho cả app. |
| Màu | "Report blocks": nền trắng, mực đen, nhấn cam `#fe7141` (chỉ trên nút chính), trường sage `#d1ddd3`, vàng `#f0ff1c`, đen. Mỗi màu gắn nghĩa chương. Đã chốt 15/10, xem mục 7. |
| Hình | Không có ảnh sản phẩm thật → hình của trang là **mảnh giao diện thật dựng bằng HTML** (`data-ui`): câu trả lời, biểu đồ bậc thang, thẻ "Move $21,250", bảng nguồn FDIC. Không ảnh stock tài chính, không dashboard xám giả, không khung thiết bị. Đủ ≥ 4 mảnh. |
| Chuyển động | "Masked headline" là chuyển động chính; mỗi section vào theo thứ tự tiêu đề → chữ → mảnh UI; có `prefers-reduced-motion`. |

### Thay thế cụ thể trên `app/page.tsx`

| Hiện tại | Thay bằng |
|---|---|
| Eyebrow `CASH PLANNING FOR SMALL BUSINESSES` | Bỏ; nội dung đã nằm trong câu dẫn. |
| `how-steps` đánh số 1/2/3 | Một thanh ba giai đoạn có tên (Add cash → Test an interruption → Prepare your plan). |
| Ba `service-card` có icon trên đầu | Giữ ba mục cạnh nhau (đã chốt, mục 7), bỏ icon và viền thẻ; mỗi cột một mảnh UI thật khác nhau (Liquidity check, Evidence, Advisory). |
| `home-trust` tick list | Gộp vào chương proof dưới dạng dấu lớn. |
| Header blur `site.css:4` | Thanh nền đặc: wordmark, 3–4 link, một nút. |

## 4. Ứng dụng: trạng thái các phát hiện cũ (07/10)

| Phát hiện | Trạng thái 15/10 | Bằng chứng |
|---|---|---|
| H1 chuỗi `duration+1` lộ ra UI | **Đã sửa** | `lib/scenario.ts:39` sinh `day ${durationDays+1}`. |
| H2 câu trả lời không ở đầu | **Đã sửa** (đo 15/10) | H2 đầu tiên là câu trả lời "If Example bank A is 80% unavailable for 21 days, you are $17,000 short from day 15". 1440×900: y=402. 390×844: y=557–681, vẫn trong màn hình đầu nhưng phía trên còn ~280px gồm eyebrow "STEP 4 OF 5 · …", H1 "Results", phụ đề, badge, eyebrow thứ hai. |
| H3 gap → phương án dài | **Đã sửa** (đo 15/10) | Ngay tại kết quả: "Find minimum preparation" → "Move $21,250.00 from Example bank A to Example bank B · $17,000 → $0" → tick → Confirm: 3 thao tác, không đổi trang. Sau xác nhận, câu trả lời chuyển thành "Your entered cash covers every scheduled payment…". **Còn lại:** ở 390px nút "Find minimum" nằm ở y=1069 (dưới màn hình đầu); thông báo "Review the minimum…" và "Simulation updated…" hiện ở y=272 trong khi người dùng đang ở y≈750–1050, nên không thấy. |
| H4 biểu đồ không đọc được trên mobile | **Đã sửa** (đo 15/10) | Ở 390px: `viewBox` = chiều rộng thật (309), chữ trục 12px CSS (trước là ~4.6px). Còn thấp hơn mức 13px của U7. |
| U5 phương án chờ hết hiệu lực | **Logic đúng, chưa hiển thị** (đo 15/10) | Đổi đầu vào hoặc ngân hàng đích xóa phương án và bỏ tick (`treasury-workspace.tsx:93`, `:138`). Xác nhận kiểm tra fingerprint (`lib/simulation.ts:10`, có test). Nhưng phương án **biến mất không kèm lời giải thích**: `:93` xóa luôn notice, không có trạng thái "Out of date — recalculate". |
| Các mục còn lại của review | Chưa rà lại | — |

**Phạm vi lần đo P0 ngày 15/10:** dùng ví dụ có sẵn ("Or explore an example portfolio"), không nhập tay bước 1–3. 1440×900: đi đến tạo phương án và đổi ngân hàng đích. 390×844: đi hết tạo phương án → xác nhận → "Create one-page plan" (mở bước "Your plan", có nút PDF). Không bấm tải PDF. Đo bằng DOM trong trình duyệt của app; ảnh chụp màn hình phần lớn bị timeout. Từ kết quả đến kế hoạch: 5 thao tác (Find minimum → tick → Confirm → Create one-page plan → PDF). Không có chuỗi `duration+1`, `undefined` hay `NaN` trên trang.

**Việc sửa tiếp theo (P1, theo kết quả đo):**
1. U5: khi đầu vào đổi lúc có phương án chờ, giữ một dòng "Inputs changed — the previous proposal is out of date. Find the minimum again." tại chỗ của phương án.
2. Thông báo đặt cạnh nơi người dùng vừa thao tác (trong khối "Move cash before the freeze"), không ở đầu trang.
3. Điện thoại: bỏ eyebrow/phụ đề/badge trên câu trả lời để khối "Move cash" lên gần màn hình đầu.
4. Chữ trục biểu đồ ≥ 13px.

**Đã sửa ngày 15/10 (chưa commit), đo lại ở 390×844 với ví dụ có sẵn:**

| Mục | Thay đổi | Kết quả đo |
|---|---|---|
| 1. Phương án hết hiệu lực | `treasury-workspace.tsx`: state `prepNote`; `edit()` và `chooseDestination()` đặt câu "…the previous proposal is out of date. Find the minimum again." khi đang có phương án chờ. | Đổi ngân hàng đích sau khi có phương án: câu hiện trong khối "Move cash", y=1032 khi đang cuộn ở 580 → trong màn hình. |
| 2. Thông báo cạnh hành động | Thông báo của "Find minimum" và "Confirm simulation" chuyển từ đầu trang sang `.prep-note` trong khối hành động (`liquidity-overview.tsx`, `role="status"`, có nút đóng). | Sau xác nhận: "Simulation updated. No real money moved." ở y=1118 khi đang ở 882 → trong màn hình. Dải "Latest confirmed simulation" ở đầu trang giữ nguyên. |
| 3. Bớt phần trên câu trả lời (≤ 720px) | Ẩn eyebrow trang và eyebrow kết quả, phụ đề trang, tên công cụ trên thanh công cụ; H1 và badge cùng một hàng. | Câu trả lời y=557 → 468. "Find minimum preparation" y=1069 → 980, **vẫn dưới màn hình đầu 844px**. Desktop không đổi. |
| 4. Chữ biểu đồ | `.axis-label`, `.chart-note`: 12px → 13px. | Nhỏ nhất 13px ở 390 và 1440. Không tràn ngang. |

Typecheck và 72 test đạt.

**Đưa khối hành động lên sau câu trả lời (15/10, chưa commit).** Trong `liquidity-overview.tsx`, hero được tách thành bốn phần theo thứ tự DOM: biểu tượng → câu trả lời (`.hero-answer`) → khối hành động (`.hero-action`) → giải thích (`.hero-details`: định nghĩa thiếu hụt, so sánh các ngân hàng, chips giả định). `finance-design.css` dùng `grid-template-areas`: desktop giữ khối hành động ở cột phải; ≤ 1150px xếp câu trả lời → hành động → giải thích; ≤ 720px biểu tượng 36px nằm cạnh câu trả lời. Thứ tự focus khớp thứ tự nhìn ở mọi độ rộng.

| Độ rộng | Đo được |
|---|---|
| 390×844 | Câu trả lời y=408 (trước 468). "Find minimum preparation" y=676–720, **trong màn hình đầu** (trước 980). Có cả dải "Example assumptions loaded" ở trên. Không tràn ngang. |
| 768×1024 | Câu trả lời y=448, hành động y=602, giải thích y=799; không tràn ngang. |
| 1440×900 | Câu trả lời và khối hành động cùng bắt đầu ở y=377, khối hành động ở cột phải (x=869), giải thích dưới câu trả lời. |

Typecheck và 72 test đạt; console không lỗi. Đo bằng DOM; ảnh chụp trong pane không hiển thị ổn định nên chưa có ảnh.
| Màu nhấn tím (README 07/10) | **Không còn trong mã** | CSS hiện dùng xanh `#2563eb`; không có tím/indigo. |

## 5. Cách xây code HTML/CSS từ nay

1. **Viết chữ trước markup.** Mỗi màn hình: câu hỏi/câu trả lời, một câu phụ, một hành động chính. Tiêu đề ≤ 2 dòng ở mọi độ rộng (~32 ký tự an toàn).
2. **Token trước component.** Một khối `:root` (màu theo vai trò: ground, ink, accent, field-n, shortfall, covered; năm bậc cỡ chữ; một bán kính bo; một cặp lề). Component chỉ tham chiếu token.
3. **Tái dùng thứ đã có.** `CashChart`, `HelpTip`, `exact`/`tidy` trong `ui.tsx`, `calculatePortfolio`, `minimumPreparation`. Không viết lại phép tính ở tầng giao diện; số luôn từ `lib/`.
4. **Màu ngữ nghĩa trong app cố định:** nền trung tính; thiếu hụt = đỏ (`#b91c1c` đang dùng), đủ = một màu "covered", phương án chờ = nét đứt. Cam `#fe7141` của website chỉ trên nút chính, không dùng để báo trạng thái.
5. **Phân cấp bằng cỡ chữ và bậc tông**, không bằng viền, bóng, thẻ lồng thẻ.
6. **Gate trước khi coi là xong:**
   ```bash
   node "C:/Users/Admin/.claude/local-plugins/plugins/taste-skill/skills/taste-skill/scripts/lint.mjs" app
   ```
   ```bash
   node "C:/Users/Admin/.claude/local-plugins/plugins/taste-skill/skills/taste-skill/scripts/inspect.mjs" http://localhost:3000/
   ```
   Website: 0 FAIL. App: 0 FAIL ngoài các dòng đã đánh dấu có lý do. Sau đó chụp 1440/768/390, đi hết hành trình 7 bước với ví dụ có sẵn, ghi số thao tác và vị trí câu trả lời.
7. **Kiểm thử đi kèm**: test hiện có (`tests/`) phải còn đạt; thêm test khi đổi logic hiển thị phụ thuộc phép tính (ví dụ trạng thái phương án hết hiệu lực).

## 6. Thứ tự ưu tiên đến mốc MVP 20/10

| Ưu tiên | Việc | Vì sao |
|---|---|---|
| P0 | ~~Đi hết hành trình 7 bước ở 1440 và 390; xác minh H2, H3, H4, U5~~ — làm 15/10 bằng ví dụ có sẵn, kết quả ở mục 4. Còn thiếu: nhập tay bước 1–3. | Đây là trải nghiệm chính; chưa đo thì chưa biết đạt. |
| P0 | Commit phần UI đang dang dở (11 tệp sửa + 5 tệp mới) sau khi test đạt | Tránh mất việc và để có mốc so sánh. |
| P1 | Dọn FAIL trong app: eyebrow → câu trả lời/thanh tiến trình, bỏ shadow/gradient/blur, đánh dấu bảng và ô nhập | Rõ hơn, ít nhiễu, không đổi hành vi. |
| P1 | Gộp token CSS, đổi font | Một hệ thống thay vì hai. |
| P2 | Dựng lại trang chủ theo `colour-chapters` + thanh trượt ví dụ | Quan trọng cho demo nhưng không phải trải nghiệm chính. |
| P3 | `/research`, `/advisory`, `/tools` theo cùng hệ | Sau khi trang chủ ổn. |

## 7. Câu hỏi còn mở (chủ dự án quyết định)

1. **Màu thương hiệu — đã chốt 15/10/2026:** website dùng bảng "Report blocks" (cam `#fe7141`, sage `#d1ddd3`, vàng `#f0ff1c`, đen) cho các chương. App giữ nền trung tính (trắng/xám nhạt, mực đen) và màu ngữ nghĩa của mình (đỏ thiếu hụt, màu "covered"); chỉ lấy cam `#fe7141` làm màu nút chính, thay xanh `#2563eb` ở vai trò này. Xanh không còn là màu nhấn; nếu còn dùng thì chỉ cho dữ liệu biểu đồ.
2. **Ba "dịch vụ" (Tools/Research/Advisory) trên trang chủ — đã chốt 15/10/2026:** giữ ba mục ngang hàng, đặt cạnh nhau. Để không thành hàng thẻ icon giống hệt nhau (house rule), mỗi cột mang một mảnh giao diện thật khác nhau (câu trả lời/biểu đồ cho Tools, bảng nguồn FDIC cho Research, câu hỏi giả định cho Advisory), không icon trên đầu, cùng cỡ chữ và cùng mép trái. Nút chính "Check my cash" ở hero vẫn là hành động duy nhất có màu cam.

## 8. Đã dựng trang chủ theo `colour-chapters` và biểu đồ matplotlib (15/10/2026)

Làm trên nhánh `ui/core-journey-design` (PR #2). Chưa có người dùng thật xem; kiểm bằng `lint.mjs`, `inspect.mjs` và xem ảnh chụp.

**Trang chủ và khung website.** `app/page.tsx` gồm 5 chương nền phẳng nối liền nhau: hero (tiêu đề 136px hai dòng + ví dụ tương tác có thanh trượt "% unavailable" chạy cùng hàm `calculatePortfolio` của app), sage (ba giai đoạn trên một thanh), vàng ("Built to be checked": ba dấu lớn + hai biểu đồ), đen ("Three ways in": Tools, Research, Advisory cạnh nhau, mỗi cột một mảnh khác nhau, không icon), cam (CTA). Một họ chữ Albert Sans dùng chung cho website và app (thay Inter, Manrope, DM Sans). Header nền đặc, không blur. Footer: tên lớn toàn chiều ngang. Chuyển động: `app/reveal.tsx` cho các phần của mỗi chương trồi lên lần lượt (chỉ transform và opacity, có `prefers-reduced-motion`, nội dung vẫn hiện nếu script lỗi). Nút chính trong app đổi sang cam `#fe7141` chữ đen, theo quyết định ở mục 7.

**Python và matplotlib.** `pipeline/figures.py` đọc `outputs/REPRODUCTION_REPORT.json` và vẽ ba hình vào `public/figures/`: kết quả test (MAE và recall), MAE theo seed, recall theo seed. Không số nào gõ tay. Script dừng nếu báo cáo thôi ghi `graphIncrementEstablished: false`, nếu khoảng MAE của hai mô hình bắt đầu chồng nhau, hoặc nếu khoảng recall không còn chồng nhau (chú thích hình sẽ sai). `tests/test_figures.py` kiểm bảng số ở `app/research/page.tsx` khớp với báo cáo mà hình đọc. Chạy lại: `python pipeline/figures.py` (đã thêm `matplotlib` vào `pipeline/requirements.txt`). Hình dùng ở trang chủ (chương vàng và cột Research) và trang Research.

**Kết quả gate (15/10).** Trang chủ: `lint.mjs` 0 FAIL; `inspect.mjs` 0 FAIL, 1 WARN (không có video; chưa có đoạn phim trung thực về chủ đề phần mềm này). `/research`: `lint` sạch; `inspect` còn 2 FAIL (chỉ 3 ảnh thật; màn hình đầu chưa có phần tử chủ đạo cỡ lớn) và 2 WARN. `/advisory` và `/tools`: còn FAIL về số ảnh, phần tử chủ đạo và cỡ chữ thân 14px. Đây là phần P3 (trang trong), chưa làm. Trang Liquidity Check không thuộc phạm vi `inspect` của website.

**Chưa làm / chưa kiểm:** trang trong (`/advisory`, `/tools`, bố cục `/research`); video; kiểm trên thiết bị thật; hàng thẻ giống nhau ở 390px (cảnh báo `card-rows`, đã có từ trước khi sửa) chưa được xử lý.

