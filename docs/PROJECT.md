# Enterprise Automation Platform on SAP BTP

Ứng dụng enterprise trên SAP BTP mô phỏng các nghiệp vụ **FI, SD, MM**, kết hợp **CAP TypeScript**, **Fiori Elements + React**, **SAP Build Process Automation** và tích hợp **S/4HANA**. Người dùng truy cập qua **SAP Build Work Zone**, chuyển đổi giữa các module bằng tab.

---

## 1. Mục tiêu

- Xây dựng một nền tảng CAP dùng chung cho nhiều module nghiệp vụ.
- Mỗi module có ít nhất một scenario end-to-end: UI → CAP → HANA → BPA → S/4.
- Áp dụng 4 nhóm automation: approval workflow, import Excel/CSV, trích xuất PDF, RPA.
- Mở rộng thêm event-driven, integration và AI.
- Có CI/CD và lưu code trên Git để không phụ thuộc vào vòng đời BTP trial.

## 2. Phạm vi nghiệp vụ

| Module | Scenario | Kết quả |
|---|---|---|
| **Common** | Leave Request | Tạo đơn, submit, duyệt nhiều cấp, lịch sử duyệt |
| **MM** | Purchase Requisition | Tạo PR, duyệt theo giá trị, tạo PO trên S/4 |
| **MM** | Vendor Import | Import nhà cung cấp từ Excel/CSV, validate, lưu HANA |
| **SD** | Sales Order Approval | Kiểm tra hạn mức tín dụng, duyệt, tạo Sales Order |
| **FI** | Invoice Processing | Upload PDF, trích xuất dữ liệu, duyệt, post Supplier Invoice |
| **FI** | Exchange Rate Sync | Đồng bộ tỷ giá hằng ngày từ API công khai, dùng quy đổi tiền tệ trên invoice |

## 3. Kiến trúc

```text
SAP Build Work Zone (Launchpad)
├── Space: Common   → Leave Request, My Inbox
├── Space: MM       → Purchase Requisition, Vendor Import
├── Space: SD       → Sales Order Approval, Sales Dashboard (React)
└── Space: FI       → Invoice Processing, Finance Dashboard (React)
            │
        Approuter + XSUAA
            │
CAP Node.js TypeScript
├── CommonService  /common
├── MMService      /mm
├── SDService      /sd
├── FIService      /fi
└── Shared         BPA client, S/4 client, event publisher, logging
            │
   ┌────────┼─────────────┬──────────────┬─────────────┐
HANA Cloud  BPA      Event Mesh   S/4 Sandbox APIs   AI Core
            │
   Document Information Extraction
            │
   Job Scheduling Service  (hoặc Integration Suite, tùy chọn)
            │
   Exchange Rate API công khai (nguồn dữ liệu ngoài thật)
```

## 4. Tech stack

| Lớp | Công nghệ |
|---|---|
| Backend | CAP Node.js, TypeScript, cds-typer, SAP Cloud SDK |
| Database | SAP HANA Cloud, HDI Container, SQLite (local) |
| Frontend | Fiori Elements OData V4 (Draft), React + UI5 Web Components for React |
| Launchpad | SAP Build Work Zone, HTML5 Application Repository, Approuter |
| Security | XSUAA, CAP `@requires` / `@restrict` |
| Integration | Destination Service, Business Accelerator Hub Sandbox, Event Mesh, Job Scheduling Service |
| Tùy chọn | SAP Integration Suite (Cloud Integration / iFlow) |
| Automation | BPA Workflow, Decision, Actions, API/Event Trigger, Document Information Extraction, RPA |
| AI | SAP AI Core, Generative AI Hub |
| DevOps | Git, GitHub Actions, MTA, Cloud Foundry, ESLint, Prettier, Jest |

## 5. Nguyên tắc thiết kế

- **CAP là lõi.** BPA, Event Mesh, Job Scheduling (và Integration Suite nếu dùng) là kênh tích hợp, không chứa business rule chính.
- **Mỗi module một service và một namespace** (`fi`, `sd`, `mm`, `common`).
- **Handler chỉ là adapter**, business logic nằm trong class service, tích hợp ngoài nằm trong client.
- **Persist trước, workflow sau.** CAP lưu dữ liệu rồi mới trigger BPA.
- **API-first.** Có API thì dùng Action/Cloud SDK; RPA chỉ cho hệ thống UI-only.
- **Không hardcode secret.** Dùng Destination, service binding, `.cdsrc-private.json` (không commit).
- **Status rõ ràng.** Business status không dùng tên `DRAFT` để tránh nhầm với Fiori Draft.

## 6. Chiến lược Integration

Dự án cá nhân không có hệ thống ngoài thật ngoài S/4 Sandbox, nên **Integration Suite không bắt buộc**. CAP + Cloud SDK + Destination đã đủ để gọi S/4 Sandbox.

| Tình huống | Cách làm |
|---|---|
| Gọi S/4 Sandbox (BP, PO, SO, Supplier Invoice) | CAP + Cloud SDK trực tiếp |
| Gọi qua lại CAP và BPA | API Trigger + BPA Action |
| Đồng bộ dữ liệu định kỳ (tỷ giá) | **Mặc định:** CAP action + Job Scheduling Service |
| Học CPI / có Integration Suite trong trial | **Tùy chọn:** iFlow cho cùng use case tỷ giá |

**Không dùng iFlow** để bọc lại API mà CAP đang gọi trực tiếp, hoặc làm trung gian CAP ↔ BPA, vì chỉ thêm một tầng và thêm điểm lỗi.

## 7. Status chuẩn

| Status | Ý nghĩa |
|---|---|
| `NEW` | Vừa tạo, chưa submit |
| `SUBMITTED` | Đã submit, đang khởi tạo workflow |
| `PENDING_APPROVAL` | Đang chờ duyệt trên BPA |
| `APPROVED` | Đã duyệt |
| `REJECTED` | Bị từ chối |
| `POSTED` | Đã tạo chứng từ trên S/4 |
| `FAILED` | Lỗi kỹ thuật, cần xử lý lại |
| `CANCELLED` | Đã hủy |

## 8. Chạy local

```bash
npm install
npm run watch            # SQLite + mocked auth
npm run bind:hybrid      # bind HANA, XSUAA, Destination
npm run watch:hybrid     # HANA thật
npm test                 # unit test
```

## 9. Deploy

```bash
npm run build
npm run deploy           # mbt build + cf deploy
```

## 10. Lưu ý BTP trial

- Trial có thời hạn; code luôn push lên Git, export BPA project sau mỗi thay đổi lớn.
- HANA Cloud free tier tự dừng định kỳ; start lại trước khi test.
- Thêm IP của BAS/local vào HANA Allowed Connections khi chạy hybrid.
- Kiểm tra Entitlements trước khi dùng Work Zone, Event Mesh, Job Scheduling, AI Core, Document Information Extraction. Integration Suite chỉ kiểm tra nếu làm phần tùy chọn.

## 11. Tài liệu liên quan

- `docs/ROADMAP.md` — kế hoạch triển khai theo giai đoạn
- `docs/STRUCTURE.md` — cấu trúc thư mục
