# ADR 019: Sales to Finance Integration

## Status
Accepted

## Context
Phase 6 establishes the first safe integration between completed Sales and the Finance ledger. The core principle is that Sales records commercial reality, while Finance derives accounting reality from that commercial event. The system must remain auditable, idempotent, tenant-safe, retryable, and recoverable.

## Decision
1. **Transactional Outbox**: An `OutboxEvent` is created atomically with the `Sale` completion using `PrismaClientManager.runInTransaction`. This ensures that a completed sale always has a corresponding outbox event to be processed.
2. **Finance Anti-Corruption Layer (ACL)**: A dedicated `FinanceIntegrationModule` acts as an ACL between Sales and Finance. It listens to outbox events, reads the domain event payload, translates it to Finance language (Debits/Credits based on Configuration), and calls `FinanceService`.
3. **Idempotency**: The `OutboxEvent.id` is used as the `idempotencyKey` for the `JournalEntry`. The `idempotencyKey` constraint on `JournalEntry` is scoped to the `organizationId`. The processor uses an atomic conditional claim (`status: PENDING` -> `PROCESSING`) to avoid double processing.
4. **Configuration-Driven Mapping**: A `FinanceIntegrationConfig` model mapped 1:1 with `Organization` stores basic account mappings (`cashAccountId`, `salesRevenueAccountId`, etc.). This configuration is used by the ACL to determine the appropriate accounts for debit and credit lines.
5. **Worker Concurrency**: The worker claims events atomically using a PostgreSQL-safe conditional update. A recovery mechanism identifies and resets stale `PROCESSING` events (e.g., in case of a crash).
6. **Error Handling**: Missing business configuration (like missing revenue accounts) results in a `FAILED` event, whereas transient errors (like DB connectivity) leave the event `PENDING` for retry.
7. **COGS Deferral**: Cost of Goods Sold (COGS) is explicitly deferred to a future phase.

## Consequences
- **Positive**: Strict decoupling between Sales and Finance boundaries is maintained. Idempotency is guaranteed at the database level.
- **Negative**: Adds complexity with asynchronous processing and outbox management. Configuration errors require manual intervention to retry.
