# Domain Model

> This document defines the domain entities, their boundaries, and relationships for the Scalable Business Operating System.

---

## Domain Boundary Map

```
┌─────────────────────────────────────────────────────────────┐
│                     CORE ENGINE                             │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Organization │  │   Identity   │  │    Finance        │  │
│  │              │  │   & Access   │  │    (Ledger)       │  │
│  │ Org          │  │              │  │                   │  │
│  │ BusinessUnit │  │ User         │  │ ChartOfAccounts   │  │
│  │ Branch       │  │ Role         │  │ Account           │  │
│  │ Department   │  │ Permission   │  │ FiscalPeriod      │  │
│  │ CostCenter   │  │ UserRole     │  │ JournalEntry      │  │
│  │ ProfitCenter │  │ RolePerm     │  │ JournalLine       │  │
│  │ Project      │  │              │  │                   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Audit      │  │  Attachment  │                        │
│  │              │  │  (Future)    │                        │
│  │ AuditLog     │  │              │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 APPLICATION LAYER                           │
│                                                             │
│  User → UI / API → Application Use Case / Orchestrator      │
│  (Manages IUnitOfWork and Business Rules)                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                 SPECIALIZED MODULES                         │
│                 (Expose Ports. Depend on Core, not on       │
│                  each other. Communicate via Orchestrator)  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Inventory   │  │  Retail/POS  │  │    HR/Payroll     │  │
│  │              │  │              │  │                   │  │
│  │ Product      │  │ Order        │  │ Employee          │  │
│  │ Category     │  │ OrderItem    │  │ Attendance        │  │
│  │ SKU          │  │ Cart         │  │ Leave             │  │
│  │ Warehouse    │  │ Register     │  │ PayrollRun        │  │
│  │ StockMovement│  │ Invoice      │  │ SalaryComponent   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │    Agro      │  │   Services   │  │    CRM            │  │
│  │              │  │              │  │                   │  │
│  │ Farm         │  │ ServiceType  │  │ Customer          │  │
│  │ Plot         │  │ Booking      │  │ Supplier          │  │
│  │ CropProject  │  │ Flexiload    │  │ ContactInfo       │  │
│  │ Harvest      │  │              │  │                   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Entity Definitions

### Organization
- The top-level isolation boundary.
- All data is scoped to an Organization.
- Future: supports multi-organization if needed.

### Business Unit
- A distinct operational segment within an Organization (e.g., Shop, Agro, Printing, Studio).
- Dynamically creatable — no schema changes required.
- `type` field is metadata-driven (not a hard-coded enum).
- Used as a financial dimension on Journal Lines.

### Branch
- A physical or logical location within an Organization.
- Optionally belongs to a Business Unit.
- Used as a financial dimension on Journal Lines.
- Future: multi-branch support with branch-specific employees, inventory, and cash.

### Department
- Internal organizational structure.
- Used for HR grouping and optional financial dimension.

### Cost Center / Profit Center
- Financial tracking concepts for internal accounting.
- Cost Center: tracks where money is spent (e.g., "Farm A operations").
- Profit Center: tracks revenue responsibility (e.g., "Online Sales channel").
- Phase 0 approach: use Project model as the primary cost/profit tracking dimension. Dedicated CostCenter/ProfitCenter models can be added when the business requires formal cost center accounting.

### Project
- A finite business endeavor with a defined scope and lifecycle.
- Examples: "Tomato Crop 2027", "Store Renovation", "Wedding Photography Job"
- Used as a financial dimension on Journal Lines to track project-level P&L.
- Agro crops, construction projects, events, etc. all share this model.
- Organization-scoped.

---

## Finance Entity Definitions

### Chart of Accounts
- The master structure organizing all financial accounts.
- Organization-scoped. Each org has its own COA.

### Account
- A specific ledger bucket (e.g., "Cash - BDT", "Inventory Asset", "Sales Revenue").
- Classified by AccountType: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE.
- Account codes must be unique within the Organization.
- Accounts can be deactivated but never deleted.

### Fiscal Period
- A defined timeframe for financial reporting (e.g., "January 2027", "FY 2027").
- States: OPEN → CLOSED → LOCKED.
- Organization-scoped.
- Locked periods prevent any posting.

### Journal Entry
- An immutable financial event.
- States: DRAFT → POSTED → REVERSED.
- Posted entries are immutable. Corrections require a new reversal/adjustment entry.
- Must have a reference to the source operation (referenceType + referenceId).
- Must support an idempotency key to prevent duplicate postings.
- Reversal entries should link back to the original entry.

### Journal Line
- The debit/credit entry within a Journal Entry.
- Tagged with financial dimensions: Account, Business Unit, Branch, Project.
- Exactly one of debit or credit should be positive per line (never both).
- Money stored as PostgreSQL `NUMERIC(19,4)`.
- Insert-only — never updated or deleted.

---

## Module Interaction Rules

1. **Specialized modules NEVER write directly to finance tables.** They expose ports/capabilities that the Application Orchestrator calls. The Orchestrator then calls the Finance Service to post the journal entry within an atomic `IUnitOfWork`.
2. **Specialized modules depend on Core. Core does not depend on specialized modules.**
3. **Specialized modules do not depend on each other.** If POS needs to decrease inventory, the Application Orchestrator handles the cross-module workflow. They do not directly import each other's repositories.
4. **All entities are Organization-scoped.** Every query must include organization context to enforce data isolation through scoped repositories.
