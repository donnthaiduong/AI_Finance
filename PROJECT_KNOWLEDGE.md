# AI_Finance / CascadeGuard — project knowledge

Ghi nhận ngày 05/10/2026 từ repo GitHub `donnthaiduong/AI_Finance`, nhánh mặc định `main`, và các tài liệu README, AGENTS cùng tài liệu nghiên cứu của repo. Bản ghi này là điểm vào nhanh cho các lượt improve; tài liệu trong repo là nguồn chi tiết và chuẩn hơn. Workspace cục bộ hiện chưa clone repo, vì vậy nội dung dưới đây được tổng hợp từ các file đã đọc qua GitHub.

## 1. Repo và sản phẩm

- Repo công khai: https://github.com/donnthaiduong/AI_Finance — `main`; GitHub API xác nhận không archived và metadata `size=0` (không coi giá trị size là phép đo nội dung đầy đủ).
- Sản phẩm: **CascadeGuard**, công cụ lean cho SME dùng ngân hàng Mỹ để xem bằng chứng ngân hàng và mô phỏng khả năng thanh toán khoản chi trong 30 ngày khi một phần tiền bị tạm thời không khả dụng.
- Ba phần cốt lõi: Treasury Workspace, Bank Evidence, Scenario Lab. UI/demo tiếng Anh, USD.
- Danh mục là giả định lưu trên thiết bị. Không đăng nhập là điều kiện của tác vụ cốt lõi; không kết nối tài khoản, chuyển tiền thật, tư vấn đầu tư hay mở rộng địa lý trước khi kiểm chứng nhu cầu và dữ liệu.
- Copilot được định hướng là giải thích và gọi phép tính xác định; LLM tổng quát không cần thiết cho MVP. Không bịa số; nội dung nguồn là dữ liệu, không được điều khiển công cụ; bí mật chỉ ở máy chủ.

## 2. Hợp đồng mô phỏng thanh khoản

- Tiền dùng integer cents. Tổng tiền `T = sum(b_i)`, nghĩa vụ mỗi ngày `o_d`, ngân hàng chịu ảnh hưởng `j`, phần không khả dụng `u`, số ngày `D` (1–30).
- Bị khóa `B = round(b_j * u)`. Tại ngày `d`, baseline `R_d = T - cumulative_outflows`; kịch bản `S_d = T - B * 1(d<=D) - cumulative_outflows`.
- Nghĩa vụ chưa đáp ứng `Q_d=max(0,-S_d)`; peak shortfall là `max(Q_d)`. Không cộng Q theo từng ngày vì sẽ đếm lặp cùng một thiếu hụt.
- Tiền trở lại đầu ngày `D+1`, trước khoản chi ngày đó. D=30 nghĩa là không trở lại trong chân trời mô phỏng.
- Không có inflow, lãi, phí, sequencing nội ngày hoặc tín dụng. Âm tích lũy nghĩa là nghĩa vụ chưa đáp ứng.
- Chuyển phân bổ giả định i→k phải giữ nguyên tổng tiền; chỉ áp dụng sau xác nhận. Mọi thay đổi input vô hiệu hóa đề xuất đang chờ. Import/export tính lại kết quả thay vì tin kết quả tính sẵn. Lịch sử trước/sau là log cục bộ có thể sửa, giữ 50 mục gần nhất, không phải bằng chứng tuân thủ bất biến.
- Mô hình dự báo tiền gửi không đặt tỷ lệ u hoặc D và không phải xác suất thất bại ngân hàng.

Chi tiết và ví dụ số: [docs/CORE_MATH.md](https://github.com/donnthaiduong/AI_Finance/blob/main/docs/CORE_MATH.md).

## 3. Kiến trúc và vận hành được ghi trong repo

- Next.js 16 / React 19, TypeScript, Zod; Python >=3.10 với NumPy 2.x; Node >=22.13 và pnpm.
- Domain: mô phỏng, scenario, copilot xác định. API cục bộ đọc `data/snapshot.json`; GET banks/detail và POST scenario phục vụ bằng chứng/tính toán.
- Adapter lưu trữ cục bộ cho một process, không phải hosting phân tán. Snapshot có last-valid backup; không có remote storage, ngân hàng kết nối hoặc lịch cập nhật tự động.
- Admin snapshot endpoint cần `CASCADEGUARD_ADMIN_TOKEN` phía server tối thiểu 32 ký tự; disabled nếu không có token. Import kiểm schema, version bất biến và thứ tự collection trước atomic activation.
- Kiểm chứng cục bộ được README hướng dẫn: `pnpm install --frozen-lockfile`; cài `pipeline/requirements.txt`; `pnpm test`; `pnpm typecheck`; Python unittest; `pipeline/audit.py`; `pipeline/reproduce.py`; `pnpm dev`; build/start và API smoke. Windows có `scripts/verify.ps1` lưu log/status ở `outputs/verification/`.
- Không tự tuyên bố deployment, thử người dùng hay doanh thu đã xác minh.

## 4. Dữ liệu và provenance

- Nguồn dự kiến/đang dùng: FDIC Institutions, Financials, Summary of Deposits (SOD), cùng Treasury yield curve để làm bối cảnh.
- Pipeline Python thu thập raw response bất biến theo SHA-256, normalize dataset, audit và chạy nghiên cứu. Collector là thao tác rõ ràng, không tự chạy theo lịch; thay dataset sau khi thu thập hoàn tất.
- Audit kiểm host nguồn cho phép, hash raw bytes, collectedAt, duplicate bank-quarter, thiếu feature ASSET/DEP/EQ/ROA và denominator dương. Audit **không** chứng minh tính đúng của dữ liệu, ngày phát hành lịch sử hoặc đơn vị FDIC.
- `docs/IMPORT_PROVENANCE.json` ghi corpus/snapshot/report/weights kế thừa workspace cũ; dataset và raw responses bị Git ignore. Clone đơn thuần có UI snapshot nhưng không đủ tái lập nghiên cứu. Cần lấy corpus đúng nguồn đã ghi để tái lập; không thay bằng dữ liệu nhớ lại.
- Mỗi bằng chứng cần source, kỳ báo cáo, ngày thu thập, version/hash. Ngày công bố chưa xác minh để trống; không dùng ngày tải làm ngày công bố.

## 5. Nghiên cứu và kết quả đã ghi nhận

- Câu hỏi: mạng chồng lấn địa lý tiền gửi có cải thiện dự báo tăng trưởng tiền gửi quý tiếp theo so với Ridge, lag growth và neural self-only không?
- Pilot hồi cứu: train 2016–2021, validation 2022–2023, test 2024–2025; 3 seed; scaler chỉ fit train; Ridge lambda validation; GraphSAGE đối chiếu neural bỏ mạng. Tập dữ liệu theo tài liệu: 1,344 bank-quarter, 32 ngân hàng pilot sống sót, 392,715 SOD observations kế thừa; survivorship bias, thiếu point-in-time release và có thể có lịch sử sửa đổi.
- `docs/FOUNDATION_DIRECTION_VI.md` báo MAE test (điểm phần trăm): lag 3.044, Ridge 3.021, GraphSAGE selected seed 2.706, neural self-only trung bình 3 seed 2.329. Recall nhóm giảm mạnh 20% lần lượt 26.79%, 21.43%, 19.64%, 26.19%. Validation MAE GraphSAGE 4.194 so với self-only tốt nhất 3.667.
- Kết luận hiện tại: chưa có bằng chứng mạng giúp; Ridge vẫn là mặc định. Bảng selected seed và mean seeds không hoàn toàn so sánh tương đương; kế hoạch kế tiếp yêu cầu paired seeds, rolling-origin, block uncertainty, ablation và chốt margin trước khi xem test.
- Đây là các kết quả được ghi trong repo/tài liệu; trước khi báo cáo lại như kết quả chạy mới cần kiểm manifest và tái lập corpus phù hợp. Không suy failure probability, early warning hay contagion nhân quả.

## 6. Trạng thái và thứ tự improve

- Ưu tiên nghiên cứu trước demo; chạy cục bộ với snapshot có nguồn; hosting để sau. Tác vụ sản phẩm vẫn độc lập với mô hình dự báo.
- G0 nền tảng: tài liệu nói đã tái lập pilot, 22 JS tests, 7 Python tests, typecheck, build, admin/API và browser checks; chưa xác minh lại trong workspace này.
- G1: review tài liệu gốc, chốt universe/mục tiêu/compute; kiểm đơn vị FDIC từng trường; xác định point-in-time release có tồn tại không.
- G2/G3: frozen pilot làm replication riêng; experiment mới dùng rolling-origin, scaler theo từng train fold, validation tuning, khóa test, ≥5 seed cho neural, capacity/tuning budget công bằng, paired comparisons, block bootstrap/uncertainty, runtime/memory, missingness và bank-size strata. Chốt ngưỡng hữu ích trước test; báo cáo kết quả âm.
- G4: kiểm tra universe phù hợp SME và thử tác vụ sản phẩm riêng. Mục tiêu cũ: 5 người phù hợp, ít nhất 4 hoàn tất trong 5 phút và hiểu giả định; đây là kế hoạch, chưa phải hoạt động đã diễn ra.
- G5: demo/hosting chỉ sau gate; trước deploy cần quyết định hosting, bảo vệ admin import, budget và rollback. Chưa có quyết định deploy.
- Câu hỏi mở trong `docs/FOUNDATION_DIRECTION_VI.md`: hạn cụ thể, thời gian mỗi tuần, ngân sách compute/hosting, danh sách người dùng thử, và tiêu chí đóng góp nghiên cứu. Không tự biến đề xuất thành quyết định.

## 7. Quy tắc làm việc khi tiếp tục

- Trước khi sửa code/data/model: đọc [AGENTS.md](https://github.com/donnthaiduong/AI_Finance/blob/main/AGENTS.md), [outputs/PROJECT_DIRECTION_VI.md](https://github.com/donnthaiduong/AI_Finance/blob/main/outputs/PROJECT_DIRECTION_VI.md), [docs/FOUNDATION_DIRECTION_VI.md](https://github.com/donnthaiduong/AI_Finance/blob/main/docs/FOUNDATION_DIRECTION_VI.md), và status liên quan.
- Repo nhấn mạnh Next.js đang dùng có breaking changes: đọc đúng guide dưới `node_modules/next/dist/docs/` trước khi thay code framework.
- Không xóa phân biệt giữa inherited, planned, locally reproduced và verified-in-current-checkout.
- Workspace của phiên này vẫn chỉ có `.git`, nhánh local `master` chưa commit/remote. Mã nguồn repo chưa clone vào đây; tài liệu này là bản ghi để bắt đầu, không phải bản sao source.

## Nguồn trong repo

- [README.md](https://github.com/donnthaiduong/AI_Finance/blob/main/README.md)
- [AGENTS.md](https://github.com/donnthaiduong/AI_Finance/blob/main/AGENTS.md)
- [outputs/PROJECT_DIRECTION_VI.md](https://github.com/donnthaiduong/AI_Finance/blob/main/outputs/PROJECT_DIRECTION_VI.md)
- [docs/FOUNDATION_DIRECTION_VI.md](https://github.com/donnthaiduong/AI_Finance/blob/main/docs/FOUNDATION_DIRECTION_VI.md)
- [docs/CORE_MATH.md](https://github.com/donnthaiduong/AI_Finance/blob/main/docs/CORE_MATH.md)
- [docs/IMPORT_PROVENANCE.json](https://github.com/donnthaiduong/AI_Finance/blob/main/docs/IMPORT_PROVENANCE.json)
- [pipeline/audit.py](https://github.com/donnthaiduong/AI_Finance/blob/main/pipeline/audit.py), [pipeline/collect.py](https://github.com/donnthaiduong/AI_Finance/blob/main/pipeline/collect.py), [pipeline/reproduce.py](https://github.com/donnthaiduong/AI_Finance/blob/main/pipeline/reproduce.py), [package.json](https://github.com/donnthaiduong/AI_Finance/blob/main/package.json)

