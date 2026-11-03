# Roadmap triển khai

7 giai đoạn, mỗi giai đoạn có deliverable kiểm chứng được. Không chuyển giai đoạn khi chưa đạt Definition of Done.

---

## Phase 0 — Chuẩn bị môi trường

**Mục tiêu:** có môi trường và nơi lưu code an toàn.

- [ ] Tạo BTP trial, Cloud Foundry org/space `dev`
- [ ] Kiểm tra Entitlements: Work Zone, Event Mesh, Job Scheduling, AI Core, Document Information Extraction
- [ ] (Tùy chọn) Kiểm tra Integration Suite nếu muốn làm iFlow
- [ ] Tạo repo GitHub, branch `main` và `develop`
- [ ] Cài `@sap/cds-dk`, `mbt`, `cf` CLI
- [ ] Tạo HANA Cloud qua HANA Cloud Central, map vào CF org, thêm IP BAS/local

**Done khi:** `cf target` đúng space, HANA `RUNNING`, repo có commit đầu tiên.

---

## Phase 1 — Nền tảng CAP TypeScript

**Mục tiêu:** khung project chạy được local và cloud.

- [ ] `cds init enterprise-app --add nodejs,typescript,hana,xsuaa,mta,approuter`
- [ ] Cài `@cap-js/cds-typer`, `@cap-js/sqlite`, `@cap-js/hana`
- [ ] Cấu hình profile `development` (SQLite) / `hybrid` / `production` (HANA)
- [ ] Tạo cấu trúc thư mục theo module (xem `STRUCTURE.md`)
- [ ] Entity chung: `cuid`, `managed`, bảng status, code list
- [ ] ESLint, Prettier, Jest
- [ ] GitHub Actions: lint + test + build

**Done khi:** `npm run watch` chạy, `npm test` pass, deploy MTA lên CF thành công.

---

## Phase 2 — Common: Leave Request bản chuẩn

**Mục tiêu:** kiểm chứng toàn bộ stack với một scenario quen thuộc.

- [ ] Entity `LeaveRequests`, `ApprovalHistory`, `LeaveTypes`, `Statuses`
- [ ] Fiori Elements có Draft (Create / Edit / Save chuẩn)
- [ ] Value help cho Leave Type và Status
- [ ] Bound action `submit` trên Object Page
- [ ] `BpaClient`: CAP → BPA API Trigger
- [ ] BPA: Manager Approval → Senior Approval theo số ngày
- [ ] BPA Action `updateApprovalResult` → CAP
- [ ] Bảng Approval History trên Object Page
- [ ] Unit test cho service và handler

**Done khi:** Create → Submit → My Inbox Approve/Reject → Fiori hiển thị status cuối và history.

---

## Phase 3 — Launchpad và React

**Mục tiêu:** có launchpad thật với tab theo module.

- [ ] Approuter + XSUAA role collections theo module
- [ ] HTML5 Application Repository
- [ ] SAP Build Work Zone: Spaces/Pages Common, MM, SD, FI
- [ ] Một app React + UI5 Web Components thử nghiệm, chạy được trên Work Zone
- [ ] Phân quyền: user chỉ thấy space của module được cấp

**Done khi:** đăng nhập Work Zone, chuyển tab giữa các module, mở được cả app Fiori và React.

---

## Phase 4 — MM

**Mục tiêu:** scenario mua hàng và import dữ liệu.

- [ ] Entity `PurchaseRequisitions`, `PRItems`, `Vendors`, `ImportJobs`, `ImportJobItems`
- [ ] Fiori: tạo và theo dõi Purchase Requisition
- [ ] BPA Decision: routing duyệt theo tổng giá trị
- [ ] Sau khi duyệt: tạo Purchase Order qua S/4 Sandbox API
- [ ] Vendor Import: upload Excel/CSV, validate, bulk insert theo batch
- [ ] Báo cáo dòng lỗi khi import

**Done khi:** PR duyệt xong có PO number; file vendor import ghi đúng số dòng thành công/lỗi.

---

## Phase 5 — SD

**Mục tiêu:** scenario bán hàng có kiểm tra hạn mức.

- [ ] Entity `SalesOrderRequests`, `SOItems`, `CreditLimits`
- [ ] Đọc Business Partner / Customer qua Cloud SDK
- [ ] Kiểm tra hạn mức tín dụng trong CAP
- [ ] BPA duyệt khi vượt hạn mức
- [ ] Tạo Sales Order trên S/4 Sandbox
- [ ] React dashboard: doanh số, đơn chờ duyệt, tỷ lệ duyệt

**Done khi:** đơn vượt hạn mức đi qua BPA; đơn trong hạn mức tạo thẳng Sales Order.

---

## Phase 6 — FI

**Mục tiêu:** xử lý hóa đơn từ PDF.

- [ ] Entity `Invoices`, `InvoiceItems`, `InvoiceDocuments`
- [ ] Upload PDF, lưu tham chiếu tài liệu
- [ ] Document Information Extraction: header + line items + confidence
- [ ] Validate: vendor, PO, số tiền, thuế, trùng invoice
- [ ] BPA: form chỉnh sửa khi confidence thấp, sau đó duyệt
- [ ] Post Supplier Invoice qua S/4 Sandbox, lưu số chứng từ
- [ ] React dashboard: hóa đơn theo trạng thái, giá trị chờ duyệt
- [ ] Entity `ExchangeRates` (currency, rate, date, source)
- [ ] CAP action `syncExchangeRates`: gọi API tỷ giá công khai qua Destination, upsert HANA
- [ ] Job Scheduling Service: chạy `syncExchangeRates` mỗi ngày
- [ ] Quy đổi số tiền invoice về currency chuẩn khi validate

**Done khi:** PDF đi hết luồng extract → validate → duyệt → `POSTED` có số chứng từ; job tỷ giá chạy theo lịch và invoice dùng tỷ giá mới nhất.

---

## Phase 7 — Mở rộng

**Mục tiêu:** event-driven, AI, RPA và integration tùy chọn.

- [ ] Event Mesh: CAP phát event, BPA nhận bằng Event Trigger (thay API Trigger ở một scenario)
- [ ] AI Core: tóm tắt lý do, phân loại chứng từ, gợi ý quyết định duyệt
- [ ] RPA: Desktop Agent thao tác một app UI-only
- [ ] Monitoring, logging tập trung, retry và idempotency cho các action tích hợp

**Tùy chọn — Integration Suite (chỉ làm nếu trial có và muốn học CPI):**

- [ ] iFlow theo lịch: gọi API tỷ giá → mapping XML/JSON → gọi CAP lưu `ExchangeRates`
- [ ] Tắt job Job Scheduling tương ứng để tránh chạy trùng
- [ ] So sánh hai cách (CAP + Job Scheduling vs iFlow) trong `docs/`

**Không làm:** iFlow bọc lại API S/4 mà CAP gọi trực tiếp, hoặc iFlow làm trung gian CAP ↔ BPA.

**Done khi:** mỗi công nghệ bắt buộc có ít nhất một use case end-to-end và có evidence.

---

## Tổng hợp

| Phase | Nội dung | Phụ thuộc |
|---|---|---|
| 0 | Môi trường, Git, HANA | — |
| 1 | Nền tảng CAP TypeScript, CI | 0 |
| 2 | Leave Request bản chuẩn | 1 |
| 3 | Work Zone, Approuter, React | 1 |
| 4 | MM | 2, 3 |
| 5 | SD | 2, 3 |
| 6 | FI + đồng bộ tỷ giá (Job Scheduling) | 2, 3 |
| 7 | Event Mesh, AI, RPA; Integration Suite (tùy chọn) | 4, 5, 6 |

Phase 2 và 3 có thể làm song song. Phase 4, 5, 6 độc lập với nhau sau khi xong 2 và 3.

## Quy tắc mỗi phase

- Commit và push trước khi kết thúc ngày làm việc.
- Export BPA project sau mỗi thay đổi workflow.
- Cập nhật tracker và lưu evidence (request/response, ảnh My Inbox, dữ liệu HANA).
- Không lưu secret trong repo.
