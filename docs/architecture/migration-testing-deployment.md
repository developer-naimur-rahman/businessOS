# Migration, Testing & Deployment Strategy

---

## Migration Strategy

### Principles
1. **All schema changes go through Prisma migrations.** No manual DDL.
2. **Migrations are version-controlled.** They live in `prisma/migrations/` and are committed to Git.
3. **Destructive changes require review.** Any migration that drops columns, tables, or changes types must be reviewed before applying.
4. **Financial tables are append-only.** Migrations that modify JournalEntry, JournalLine, or AuditLog columns must preserve existing data.

### Workflow
1. Modify `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name descriptive_name` in development.
3. Review the generated SQL migration file.
4. Commit the migration to Git.
5. In production: `npx prisma migrate deploy` applies pending migrations.

### Safety Rules
- Never use `prisma migrate reset` in production.
- Never modify a migration file after it has been applied.
- Always back up the database before applying migrations in production.

---

## Testing Strategy

### Financial Invariant Tests (Critical)
These tests must PASS before any code is merged:

1. **Balance Test:** Every posted JournalEntry must satisfy `SUM(debits) = SUM(credits)`.
2. **Single-Side Test:** Each JournalLine must have a positive value in ONLY debit or credit, never both.
3. **Immutability Test:** Verify that posted JournalEntries cannot be updated via the API.
4. **Reversal Test:** Reversing an entry creates a new entry with swapped debits/credits and links back.
5. **Idempotency Test:** Posting the same transaction twice (same idempotency key) must not create duplicate entries.
6. **Period Lock Test:** Posting to a LOCKED fiscal period must fail.
7. **Account Balance Test:** Account balance derived from journal lines matches expected value after a sequence of operations.

### RBAC Tests
1. Unauthorized users cannot access protected endpoints.
2. Users without specific permissions are rejected.
3. Approval workflows enforce the correct multi-step flow.

### Inventory Tests (Future phases)
1. Stock balance derived from movements matches expected quantity.
2. WAC cost is correctly recalculated on each receipt.
3. COGS is correctly posted on sale.

### Test Infrastructure
- **Unit Tests:** Jest (already included with Nx/NestJS).
- **Integration Tests:** Jest with Prisma test database (separate from development DB).
- **E2E Tests:** Playwright (already scaffolded for admin-dashboard).

---

## Deployment Strategy

### Phase 0 / Development
- Local PostgreSQL instance.
- `npm run serve` for NestJS API.
- `npm run dev` for Next.js Admin Dashboard.
- `.env` file for configuration (never committed to Git).

### Future Production
- PostgreSQL managed service (e.g., Supabase, Railway, AWS RDS).
- NestJS API deployed as a Node.js process or container.
- Next.js deployed on Vercel or as a container.
- Environment variables managed via deployment platform.

### Backup Strategy
- Automated daily database backups via provider.
- Point-in-time recovery capability.
- Monthly export of financial data (CSV/JSON) for offline archives.
- Audit logs preserved independently of application data.

---

## Environment Configuration

### Required Environment Variables
```
DATABASE_URL=postgresql://user:password@localhost:5432/business_os?schema=public
JWT_SECRET=<strong-random-secret>
PORT=3000
NODE_ENV=development
TZ=UTC
BUSINESS_TIMEZONE=Asia/Dhaka
```

### .env File Rules
- `.env` must be in `.gitignore` (currently missing — flagged in gap report).
- `.env.example` should be committed with placeholder values.
- Production secrets must never appear in the repository.

---

## Phase 0 Migration Record

**Migration Name:** `20260913173340_init`  
**Migration Date:** 2026-09-13  
**Prisma Version:** 6.19.3 (stable)  
**PostgreSQL Version:** 16 (embedded-postgres for local dev)  

**Custom SQL Constraints Added:**
- `journal_line_debit_credit_check`: Ensures `debit >= 0 AND credit >= 0 AND (debit = 0 OR credit = 0) AND (debit + credit > 0)` on the `JournalLine` table.

**Validation Commands Run:**
- `npx prisma validate` - Passed
- `npx prisma generate` - Passed
- `npx nx build api-server` - Passed

**Test Status:** 
- Financial Invariant Test Foundation scaffolded in `api-server/src/app/finance/finance.service.spec.ts`.

---

## Phase 0.1 Migration Record

**Migration Name:** `20260913182009_phase0_amendment`  
**Migration Type:** Additive Architectural Amendment  

**Changes Applied:**
- `Organization.timezone` added (`String @default("Asia/Dhaka")`)
- `Branch.timezone` added (`String?`)
- `JournalLine.departmentId` added (`String?` + relation to `Department`)

**Validation Workflow:**
1. Architecture decisions finalized
2. Documentation synchronized
3. Prisma schema amended
4. Migration created
5. Prisma validation
6. Client generation
7. Tests
8. Git diff review
9. Phase 0 freeze (completed)
