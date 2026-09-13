# ADR-013: Multi-Tenant Resource Isolation Policy

**Decision:**
The system will implement a defense-in-depth tenant isolation strategy relying on both context guards and strictly scoped repositories. Cross-organization resource access attempts will default to returning `404 Not Found`.

**Rationale:**
1. **Trusted Context:** The authoritative `organizationId` must always be derived securely from the authenticated JWT session (`request.user.organizationId`). Client-supplied overrides (in body, query, or params) are explicitly ignored or rejected by the `OrganizationContextGuard`.
2. **Defense in Depth:** Guards alone are insufficient because internal service calls could bypass them. Therefore, domain repositories must mandate `organizationId` in their data-access methods (e.g., `findById(organizationId, id)`).
3. **IDOR Prevention (404 vs 403):** Returning `403 Forbidden` for cross-tenant access leaks the existence of a resource. Returning `404 Not Found` guarantees that users cannot enumerate or verify the existence of data outside their organization.

**Architecture Flow:**
```text
JWT
 ↓
OrganizationContextGuard
 ↓
OrganizationContext (Request scoped)
 ↓
Authorization (PermissionsGuard)
 ↓
Organization-scoped Repositories
 ↓
Database Query (Prisma)
```

**Consequences:**
- Services should NEVER directly inject `PrismaService`. They must rely on domain repositories to ensure the `organizationId` predicate is always applied.
- `403 Forbidden` is reserved exclusively for permission failures *within* the user's own organization.

**Alternatives Rejected:**
- **Relying solely on Prisma Client Extensions (RLS):** While Prisma supports RLS-like extensions, explicitly passing `organizationId` through the repository layer provides better static type safety and clearer intent in domain logic.
