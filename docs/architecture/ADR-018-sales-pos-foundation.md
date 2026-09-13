# ADR-018: Sales and POS Foundation

## Status
Approved and Implemented (Phase 5)

## Context
The system required a foundation for recording commercial transactions (Sales) that could support both physical products (involving inventory deduction) and service-based products (involving no physical inventory), without generating duplicate financial ledgers or leaking transaction boundaries across modules.

## Decisions

### 1. Sales as the Source of Commercial Truth
The Sales module is introduced as the authoritative source of truth for commercial transactions. 
- It captures the historical snapshot of `unitPrice`, `discount`, and `lineTotal` at the time of sale.
- It calculates final authoritative totals on the server.
- Completed sales are immutable.

### 2. Product vs Service Behavior
- **Physical Products (`ProductType.PRODUCT`)**: Result in an `InventoryMovement` (Type: `ISSUE`) and decrement the warehouse `StockBalance`.
- **Services (`ProductType.SERVICE`)**: Record commercial lines on the sale but bypass physical inventory deduction completely.

### 3. Application Unit of Work (Transaction Boundary)
To maintain the architectural boundary and avoid leaking Prisma's `$transaction` types into application domain logic:
- We introduced an application-level Unit of Work (`IUnitOfWork` and `PrismaClientManager`) backed by Node.js `AsyncLocalStorage`.
- Repositories inject `PrismaClientManager` and access the active transaction transparently.
- `SalesService` orchestrates the cross-module transaction (`createSale` + `deductStockForSale` + `payment`). If `InventoryService` throws due to insufficient stock, the entire POS transaction rolls back seamlessly.

### 4. Concurrency-Safe Sale Numbering
Instead of unsafe `MAX()` or `COUNT()` logic, we introduced the `DocumentSequence` model.
- Uses `upsert` with an atomic `increment` to safely generate sequential numbering (`SALE-YYYY-XXXXXX`) across concurrent requests.

### 5. Idempotency 
- **Database Level:** `@@unique([organizationId, idempotencyKey])` enforces global constraints.
- **Transactional Level:** Before initiating a sale, the system checks for existing idempotency keys. Crucially, a secondary read-committed check happens *inside* the transaction to preempt strict concurrency race conditions and return the originally completed sale.

### 6. Finance and Payment Boundary
- Payments are recorded natively as `SalePayment` reflecting POS reality.
- We deliberately avoided mutating `JournalEntry` or `FinancialAccount` directly from Sales to preserve Finance as the ultimate ledger. Full Finance integration will occur via formal event/journal bridges in subsequent phases.

## Consequences
- **Positive:** True atomic cross-module operations without leaking DB contexts. Clean separation of physical vs service sales. Safe concurrency handling.
- **Negative:** AsyncLocalStorage adds a minor conceptual layer to data access in Repositories, requiring developers to properly utilize `PrismaClientManager.client` instead of injecting PrismaService directly.
