# Architecture Decision Records (ADR)

> These are the foundational architectural decisions for the Scalable Business Operating System.
> All decisions below have been **reviewed and approved** by the owner.

---

## ADR-001: Technology Stack

**Decision:** NestJS (TypeScript) backend, Next.js (TypeScript) frontend, PostgreSQL database.

**Why:**
- NestJS provides a modular, strongly-typed backend with clean domain boundaries via its module system. This is ideal for a core engine with pluggable specialized modules (Agro, Retail, Services, etc.).
- Next.js is excellent for building complex, data-dense React applications (Admin OS) and performant customer-facing applications (Public Portal).
- PostgreSQL is the industry standard for transactional integrity and financial systems. Its ACID compliance, robust constraint checking, and `NUMERIC`/`DECIMAL` types are non-negotiable for accounting.

**Trade-off:** NestJS has a learning curve compared to Express.js, but its enforced structure prevents the "big ball of mud" pattern that would cripple a system of this scope.

**Future Impact:** These choices are stable, widely supported, and can scale horizontally without re-platforming.

---

## ADR-002: Modular Monolith (Not Microservices)

**Decision:** Build as a modular monolith with strict internal module boundaries.

**Why:**
- Microservices introduce immense operational complexity (deployment, networking, observability, distributed transactions).
- Distributed transactions are especially dangerous for accounting — a sale that creates an inventory change AND a financial journal entry must be atomic, not eventually consistent.
- A modular monolith gives clean code boundaries now while deferring deployment complexity until scaling demands it.

**Trade-off:** Single deployment unit. Harder to scale individual modules independently. Acceptable for current business scale.

**Future Impact:** If needed in 5+ years, any module (e.g., Reporting, Agro) can be extracted into a service because domain boundaries are already enforced at the code level.

---

## ADR-003: Double-Entry Accounting with Immutable Ledger

**Decision:** Every financial event generates an immutable journal entry where `SUM(debits) = SUM(credits)`.

**Why:**
- Prevents "money out of nowhere" bugs.
- Provides a complete, auditable, reconstructable history of the business's financial state.
- Historical truth cannot be silently rewritten.
- Corrections happen transparently through reversal or adjustment entries.

**Trade-off:** Higher initial development complexity. No "edit sale amount" button — corrections require posting new entries. This is the correct behavior for a real business system.

**Future Impact:** This is the same model used by every professional accounting system. It will never need to be replaced.

---

## ADR-004: Dimensional Accounting (Not Hard-Coded Business Types)

**Decision:** Tag financial journal lines with optional business dimensions (Business Unit, Branch, Project, Cost Center) rather than creating separate accounting subsystems per business type.

**Why:**
- One accounting engine generates Company P&L, Business Unit P&L, Branch P&L, and Project P&L by filtering dimensions.
- Adding a new business unit (e.g., Fish Farming) requires no schema changes — just a new BusinessUnit record.
- Agro crop projects, construction projects, and any future project-based business reuse the same `Project` dimension.

**Trade-off:** Dimensions are nullable, so application-layer enforcement is required to ensure proper tagging. Database constraints alone are insufficient.

**Future Impact:** This is the architecture that professional ERP systems (SAP, Oracle) use. It eliminates the need for separate accounting modules per business type.

---

## ADR-005: Event Sourcing Deferred

**Decision:** Use immutable transactional records (JournalEntry, StockMovement) with derived current state. Do NOT implement full event sourcing infrastructure.

**Why:**
- Full event sourcing adds complexity (event store, projections, replay, eventual consistency) that is unnecessary for our scale.
- Immutable records plus derived state gives us auditability, reconstructability, and reliability without the overhead.

**Trade-off:** We cannot replay arbitrary past states from an event stream. This is acceptable — we have full transaction history.

**Future Impact:** If event sourcing is ever needed for a specific domain, it can be added to that module without affecting others.

---

## ADR-006: Inventory Valuation — Weighted Average Cost (WAC)

**Decision:** V1 will use Weighted Average Cost for inventory valuation.

**Why:**
- Simpler to implement reliably in a continuous system than strict FIFO lot tracking.
- Provides accurate COGS calculations.
- Common in retail environments.

**Trade-off:** Less precise than FIFO for businesses with large price variation between batches. Acceptable for V1.

**Future Impact:** FIFO can be added as an alternative valuation method later without redesigning the finance core. The StockMovement table captures per-receipt cost data regardless of valuation method.

---

## ADR-007: Soft Delete / Immutability Policy

**Decision:**
- Financial records (JournalEntry, JournalLine): **NEVER deletable** (hard or soft).
- Stock movements: **NEVER deletable** (hard or soft).
- Audit logs: **NEVER deletable** (hard or soft).
- Master data (Products, Customers, Suppliers, Employees): **Soft delete** via `deletedAt` timestamp.

**Why:**
- Financial and audit integrity require absolute immutability.
- Master data with historical references must be deactivated, not destroyed.

**Trade-off:** Disk usage grows over time. Acceptable — financial integrity is non-negotiable.

**Future Impact:** Archival strategies can be added later for very old data, but the principle of never deleting financial history is permanent.

---

## ADR-008: Money Representation

**Decision:** Use PostgreSQL `NUMERIC(19,4)` (mapped to `Decimal` in Prisma). Never use JavaScript floating-point (`number`) for financial amounts.

**Why:**
- JavaScript `Number` type uses IEEE 754 floating point, which cannot exactly represent `0.1 + 0.2`.
- Financial calculations require exact decimal arithmetic.
- `NUMERIC(19,4)` supports values up to 999,999,999,999,999.9999 with 4 decimal places — sufficient for BDT and future currencies.

**Trade-off:** Prisma returns `Decimal` objects (from `decimal.js`), not plain numbers. All arithmetic must use the Decimal library, not `+`/`-` operators.

**Future Impact:** Multi-currency support can be added later with a `currency` field. The precision is sufficient for any currency.

---

## ADR-009: Timezone Strategy

**Decision:** Store all timestamps as UTC in the database. Use `Asia/Dhaka` (UTC+6) as the business timezone for display and reporting.

**Why:**
- UTC storage prevents ambiguity.
- Business date (e.g., "which day does this sale belong to?") is determined by converting UTC to Asia/Dhaka.

**Trade-off:** Every display layer must convert. Acceptable — this is standard practice.

**Future Impact:** Multi-timezone support (e.g., for branches in different cities) requires adding timezone to the Branch model. The underlying UTC storage is already correct.

---

## ADR-010: ORM — Prisma

**Decision:** Use Prisma as the ORM.

**Why:**
- Excellent TypeScript type safety.
- Schema-first design with automatic migration generation.
- Good developer experience.

**Trade-off:** Prisma's transaction API requires careful use for complex financial operations (interactive transactions with `$transaction`). Raw SQL may be needed for specific financial integrity checks (e.g., database-level constraints).

**Future Impact:** Prisma is actively maintained. If limitations arise, raw SQL queries can be used alongside Prisma without replacing it.

---

## ADR-011: Prisma v6 (Stable) Over Prisma v8 (RC)

**Decision:** Use Prisma v6 (stable, currently 6.19.3) instead of Prisma v8.0.0-rc.

**Why:**
- Prisma v8 RC has a fundamentally different architecture: it replaces `prisma-client-js` with `@prisma/orm-postgres`, changes the schema location to `src/prisma/contract.prisma`, and requires a new `prisma.config.ts` format.
- It adds `"type": "module"` to `package.json`, which breaks NestJS/Nx webpack builds.
- It replaces standard CLI commands (`validate`, `migrate dev`) with incompatible alternatives (`contract emit`, `db`).
- As an RC, it carries stability and compatibility risks that are unacceptable for a financial system's foundation.
- Prisma v6 has proven NestJS integration, stable migration workflows, and mature documentation.

**Trade-off:** We miss Prisma 8's new features (e.g., `temporal.updatedAt()`). These can be evaluated when v8 reaches stable release.

**Future Impact:** When Prisma v8 reaches stable and has proven NestJS/Nx compatibility, migration can be evaluated. The schema (PSL syntax) is largely forward-compatible.

