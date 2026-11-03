# Cấu trúc thư mục dự án

```text
enterprise-app/
├── .github/
│   └── workflows/
│       └── ci.yml                     # lint, test, build
│
├── app/                               # UI
│   ├── common/
│   │   └── leave-request/             # Fiori Elements (Draft)
│   ├── mm/
│   │   ├── purchase-requisition/      # Fiori Elements
│   │   └── vendor-import/             # Fiori Elements + upload
│   ├── sd/
│   │   ├── sales-order-approval/      # Fiori Elements
│   │   └── sales-dashboard/           # React + UI5 Web Components
│   ├── fi/
│   │   ├── invoice-processing/        # Fiori Elements
│   │   └── finance-dashboard/         # React + UI5 Web Components
│   ├── router/                        # Approuter (xs-app.json)
│   └── annotations/                   # annotation dùng chung (nếu có)
│
├── db/
│   ├── common/
│   │   ├── aspects.cds                # aspect dùng chung: auditable, workflowEnabled
│   │   ├── code-lists.cds             # Statuses, LeaveTypes, Currencies...
│   │   └── leave-request.cds
│   ├── mm/
│   │   ├── purchase-requisition.cds
│   │   └── vendor-import.cds
│   ├── sd/
│   │   └── sales-order.cds
│   ├── fi/
│   │   └── invoice.cds
│   ├── data/                          # CSV seed: code list, test data
│   └── schema.cds                     # entry point, using các file trên
│
├── srv/
│   ├── common/
│   │   ├── common-service.cds
│   │   ├── common-service.ts          # bootstrap, chỉ register handler
│   │   └── handlers/
│   │       └── leave-request/
│   │           ├── index.ts
│   │           ├── submit.ts
│   │           └── update-approval-result.ts
│   ├── mm/
│   │   ├── mm-service.cds
│   │   ├── mm-service.ts
│   │   └── handlers/
│   │       ├── purchase-requisition/
│   │       └── vendor-import/
│   ├── sd/
│   │   ├── sd-service.cds
│   │   ├── sd-service.ts
│   │   └── handlers/
│   │       └── sales-order/
│   ├── fi/
│   │   ├── fi-service.cds
│   │   ├── fi-service.ts
│   │   └── handlers/
│   │       └── invoice/
│   │
│   ├── services/                      # business logic (class)
│   │   ├── common/LeaveRequestService.ts
│   │   ├── mm/PurchaseRequisitionService.ts
│   │   ├── mm/VendorImportService.ts
│   │   ├── sd/SalesOrderService.ts
│   │   └── fi/InvoiceService.ts
│   │
│   ├── integrations/                  # client gọi hệ thống ngoài
│   │   ├── bpa/BpaClient.ts
│   │   ├── s4/BusinessPartnerClient.ts
│   │   ├── s4/PurchaseOrderClient.ts
│   │   ├── s4/SalesOrderClient.ts
│   │   ├── s4/SupplierInvoiceClient.ts
│   │   ├── dox/DocumentExtractionClient.ts
│   │   ├── events/EventPublisher.ts
│   │   └── ai/AiClient.ts
│   │
│   ├── shared/
│   │   ├── constants/                 # status, entity name, destination name
│   │   ├── errors/                    # AppError, mapping status code
│   │   ├── destinations/              # resolve destination, đọc custom property
│   │   └── utils/                     # date, validation, logging
│   │
│   ├── external/                      # EDMX/CSN import từ S/4 (cds import)
│   └── generated/                     # Cloud SDK generated client (không commit)
│
├── @cds-models/                       # type sinh bởi cds-typer (không commit)
│
├── test/
│   ├── unit/                          # test service class, mock client
│   ├── integration/                   # cds.test với SQLite
│   └── http/                          # file .http theo module (không chứa secret)
│       ├── common.http
│       ├── mm.http
│       ├── sd.http
│       └── fi.http
│
├── bpa/                               # export BPA project (.mtar/.zip) để backup
├── docs/
│   ├── PROJECT.md
│   ├── ROADMAP.md
│   ├── STRUCTURE.md
│   └── evidence/                      # ảnh, request/response khi test
│
├── xs-security.json                   # scope và role template theo module
├── mta.yaml
├── package.json
├── tsconfig.json
├── .cdsrc.json                        # chỉ config chung, không binding
├── .cdsrc-private.json                # binding hybrid (không commit)
├── .eslintrc.json
├── .prettierrc
├── .gitignore
└── README.md
```

## Quy ước

| Thư mục | Trách nhiệm | Không được chứa |
|---|---|---|
| `db/` | Domain model, code list, seed data | Annotation UI |
| `srv/<module>/*.cds` | Service projection, action, phân quyền | Logic nghiệp vụ |
| `srv/<module>/handlers/` | Nhận request CAP, gọi service class, map lỗi | Query phức tạp, gọi API ngoài |
| `srv/services/` | Business logic, validation, status transition | Chi tiết HTTP, destination |
| `srv/integrations/` | Gọi BPA, S/4, DOX, Event Mesh, AI | Business rule |
| `srv/shared/` | Constants, error, utils dùng chung | Logic riêng một module |
| `app/<module>/` | UI và annotation riêng của app | Logic backend |

## Phân quyền theo module

| Role template | Scope | Truy cập |
|---|---|---|
| `Employee` | `common.read`, `common.write` | Leave Request |
| `MMUser` | `mm.read`, `mm.write` | Purchase Requisition, Vendor Import |
| `SDUser` | `sd.read`, `sd.write` | Sales Order |
| `FIUser` | `fi.read`, `fi.write` | Invoice |
| `Approver` | `approval.callback` | Callback từ BPA |
| `Admin` | tất cả | Toàn bộ |

## `.gitignore` tối thiểu

```gitignore
node_modules/
gen/
mta_archives/
@cds-models/
srv/generated/
.cdsrc-private.json
.env
*.sqlite
db.sqlite
test/http/*.private.http
```
