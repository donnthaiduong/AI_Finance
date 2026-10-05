# CascadeGuard — nền tảng và hướng đi cần chốt

Ngày 04/10/2026; cập nhật thực thi 05/10/2026. Đây là đề xuất cùng nền tảng cục bộ; không phải bằng chứng
đã hoàn tất nghiên cứu mở rộng, deployment hoặc thử người dùng.

## 1. Quyết định đã được người dùng chốt

- Ưu tiên nghiên cứu trước demo.
- Chạy cục bộ, dùng snapshot có nguồn; hosting quyết định sau.
- Có thể tiếp cận chủ SME hoặc người phụ trách tài chính sử dụng ngân hàng Mỹ.
- Giữ CascadeGuard với Treasury Workspace, Bank Evidence và Scenario Lab; tiếng Anh, USD.

## 2. Hai câu hỏi khác nhau cần kiểm chứng

**Nghiên cứu:** thông tin chồng lấn địa lý tiền gửi có cải thiện dự báo thay đổi tiền gửi
quý kế tiếp so với Ridge, lag growth và mô hình neural bỏ mạng không?

**Sản phẩm:** chủ SME có hiểu và hoàn thành tác vụ kiểm tra tiền đủ chi 30 ngày khi
một phần tiền tạm thời không khả dụng không? Cải thiện dự báo ngân hàng không tự
chứng minh giá trị sản phẩm; phép mô phỏng thanh khoản vẫn hoạt động độc lập mô hình.

Pilot tái lập chứng minh khả năng chạy lại, chưa chứng minh novelty hay nhu cầu thị
trường. Chưa làm systematic review trong đợt này; không tuyên bố research gap mới.
Tài liệu API chính thức: https://api.fdic.gov/banks/docs.

## 3. Kiến trúc đã xây dựng

| Lớp | Thành phần | Trách nhiệm |
|---|---|---|
| Giao diện | Next.js, React; ba màn hình kế thừa | Nhập giả định, đọc bằng chứng, so sánh và xác nhận |
| Domain | scenario.ts, simulation.ts, copilot.ts | Cent, kiểm tra đầu vào, xác nhận, giải thích xác định |
| API cục bộ | banks, bank detail, scenario | Đọc snapshot đã kiểm tra schema; tính cùng công cụ domain |
| Evidence | snapshot-validation.ts, pipeline/audit.py | Nguồn chính thức, version, thời gian, hash và lỗi thiếu dữ liệu |
| Nghiên cứu | collect.py, train.py, reproduce.py | Corpus đóng băng, temporal split, đối chứng, manifest từng run |

Không import cấu hình Site, token hoặc node_modules cũ. Adapter cục bộ có endpoint
quản trị được bảo vệ, kiểm tra snapshot và backup hợp lệ gần nhất; chưa bật lịch cập nhật.
Quyết định triển khai D1/R2 thuộc giai đoạn
hosting sau. Copilot hiện là công cụ xác định, chưa cần LLM để hoàn thành tác vụ.

## 4. Kết quả quan sát tại repo này

Corpus kế thừa: 1.344 bank-quarter, 52 metadata nguồn; audit khớp raw SHA-256,
không thấy trùng bank-quarter hoặc thiếu ASSET/DEP/EQ/ROA trong corpus này.
Run cục bộ có manifest; metric test và lựa chọn khớp kết quả kế thừa.

| Mô hình | MAE test (điểm phần trăm) | Recall nhóm giảm mạnh 20% |
|---|---:|---:|
| Lag growth | 3,044 | 26,79% |
| Ridge | 3,021 | 21,43% |
| GraphSAGE — seed chọn theo validation | 2,706 | 19,64% |
| Neural bỏ mạng — trung bình 3 seed | 2,329 | 26,19% |

Validation MAE GraphSAGE 4,194, đối chứng bỏ mạng tốt nhất 3,667. Vì vậy chưa đủ
bằng chứng lợi ích mạng và Ridge tiếp tục là mặc định. So sánh seed được chọn với
trung bình seed chỉ là bảng mô tả; bước kế tiếp phải dùng so sánh seed ghép cặp.
Không suy tỷ lệ phong tỏa, xác suất phá sản hoặc lây lan nhân quả từ kết quả này.

## 5. Lộ trình theo gate, chưa gán lịch khi thiếu hạn cụ thể

**G0 — nền tảng tái lập:** giữ corpus/hash, đóng băng cấu hình, test phép tính, tách
kết quả thực thi khỏi dữ liệu kế thừa. Đã tái lập, chạy 22 test JavaScript, 7 test Python,
typecheck, build, kiểm tra API quản trị và tương tác trình duyệt. Báo cáo chi tiết ở
`docs/CORE_IMPLEMENTATION_STATUS.md`; chưa coi G0 là xác minh đầy đủ đơn vị nguồn.

**G1 — đề cương và dữ liệu:** chốt mục tiêu, universe, thời hạn, compute; tìm và đọc
tài liệu gốc, ghi limitation có locator, kiểm tra bài sau có khép limitation không.
Đối chiếu định nghĩa đơn vị từng trường FDIC. Xác định dữ liệu lịch sử có ngày phát hành
không; nếu không, giữ nhãn retrospective và không làm tuyên bố early warning.

**G2 — thiết kế thí nghiệm đăng ký trước:** giữ pilot frozen làm replication; mở rộng
bank universe thành experiment riêng. Rolling-origin theo thời gian, feature scaler fit
trên train mỗi fold, tuning trên validation, khóa test. Lag growth, Ridge, neural bỏ mạng,
GraphSAGE và một đối chứng mạnh từ tài liệu đã xác minh. Ít nhất 5 seed cho neural;
ngân sách tuning/capacity tương xứng; tách ảnh hưởng graph, feature và độ rộng mô hình.

**G3 — đánh giá:** MAE cùng recall nhóm giảm mạnh, theo fold và bank-size strata;
so sánh seed ghép cặp; uncertainty dùng resampling theo block thời gian, không IID từng
bank-quarter. Ghi runtime/memory, missingness, coverage, survivorship bias, tuning cost.
Ngưỡng cải thiện có ý nghĩa thực tế và margin phải chốt trước khi xem kết quả mở rộng.
Không chọn phương pháp sau khi nhìn test. Nếu mạng không tốt hơn, báo kết quả âm và
giữ mô hình đơn giản. Pipeline hiện chưa thực hiện rolling-origin/CI hoặc các ablation này.

**G4 — liên hệ với SME:** nghiên cứu tính phù hợp universe với ngân hàng người thử dùng;
đánh giá tác vụ riêng, không chuyển metric dự báo thành lời khuyên ngân hàng. Thử 5
người phù hợp, mục tiêu ít nhất 4 hoàn thành trong 5 phút và giải thích đúng giả định;
ghi lỗi, cách hiểu, mức hữu ích và willingness-to-pay như dữ liệu khảo sát, không doanh thu.

**G5 — demo và hosting:** sau gate nghiên cứu phù hợp, soạn demo và báo cáo giới hạn;
chốt hosting, bảo vệ import quản trị, last-valid snapshot, budget và rollback trước deploy.
Không bật lịch hoặc đăng công khai trước khi quyết định này được chốt.

## 6. Câu hỏi cần người dùng quyết định

1. Mục tiêu chính là kiểm định lợi ích mạng địa lý cho dự báo tiền gửi, hay stress test
   thanh khoản và tính hữu ích cho SME? Đề xuất mục tiêu nghiên cứu thứ nhất, sản phẩm
   vẫn giữ công cụ thanh khoản độc lập.
2. Tái lập pilot 32 ngân hàng trước rồi mở rộng theo ngân hàng SME dùng, hay mở rộng
   ngay sang ngân hàng nhỏ/trung bình? Đề xuất phương án thứ nhất để tách replication
   khỏi experiment mới; bước tái lập đầu đã hoàn tất.
3. Hạn demo/nộp bài cụ thể, thời gian làm mỗi tuần, ngân sách tính toán và hosting?
4. Có danh sách ngân hàng từ người dùng thử không; dự kiến có thể mời 5 người vào lúc nào?
5. Tiêu chí đóng góp muốn ưu tiên: kết quả âm có giá trị, benchmark tái lập, hay phương
   pháp mới có chứng minh? Đề xuất benchmark và kiểm định giả thuyết trước khi đổi kiến trúc.

Các câu chưa trả lời là pending. Hướng đề xuất không tự trở thành quyết định được phê duyệt.

## 7. Rà soát nội bộ theo sáu chiều

- D1 — bằng chứng: có raw corpus và tái lập; thiếu literature review để bảo vệ novelty.
- D2 — khả năng bác bỏ: giả thuyết mạng thất bại nếu không hơn đối chứng bỏ mạng; cần
  chốt margin và uncertainty trước experiment mới.
- D3 — phạm vi: pilot large surviving banks, chưa đại diện SME banks hoặc xác suất failure.
- D4 — logic: dự báo tiền gửi và giả định tiền bị gián đoạn tách biệt trong code và UI.
- D5 — exploration: chưa thực hiện method transfer hoặc đánh giá phương án nghiên cứu mới.
- D6 — phương pháp: temporal split và train-only scaler có trong pilot; còn thiếu
  rolling-origin, paired CI, lịch phát hành thật và kiểm tra universe mở rộng.

Đây là tự rà soát, chưa phải peer review độc lập hoặc Gate 8 được chấp nhận. Đề cương
mở rộng chưa đủ điều kiện tuyên bố hoàn tất.
