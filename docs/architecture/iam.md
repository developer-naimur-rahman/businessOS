# IAM & Authentication Architecture (Phase 1A)

## Overview
This document outlines the Identity and Access Management (IAM) and Authentication foundation for `my-business-os`. The system enforces a strict boundary between authentication (verifying identity) and authorization (verifying permissions).

## Security Boundaries & Principles
1. **Never trust client-provided IDs:** Client-provided `organizationId`, `roleId`, or `permissions` in request bodies, queries, or params are explicitly ignored for authorization and context derivation.
2. **Server-Side Context is Authoritative:** The `organizationId` and effective permissions are strictly derived server-side from the authenticated user's JWT payload mapping to the database.
3. **No Cross-Organization Leaks:** All IAM operations (creating users, assigning roles) are tightly scoped to the `organizationId`. Cross-org role assignments are rejected.
4. **Passwords:** Hashed with `argon2`. Never returned via API responses.

## Request Pipeline

1. **JWT Authentication:** 
   `JwtAuthGuard` intercepts the request, decodes the JWT, and extracts the `userId` (`sub`).
2. **Authenticated User Resolution:** 
   The `JwtStrategy` queries the database for the user and dynamically resolves all assigned roles and flattening their permissions.
3. **Trusted Context Construction:** 
   The strategy constructs and attaches the `AuthenticatedUser` object to the Express request.
4. **Organization Context:** 
   `@CurrentOrganization()` safely extracts the `organizationId` directly from the trusted context.
5. **Permissions Authorization:** 
   `PermissionsGuard` intercepts the request, checks route metadata defined by `@RequirePermissions()`, and ensures the trusted context contains the required permission.
6. **Resource Authorization:** 
   Organization-scoped services (`findByIdWithinOrganization`) ensure the entity belongs to the trusted `organizationId`.

## Authentication Flow

- `POST /auth/login`: Validates `email` and `password` via `argon2`. Generates a short-lived JWT containing only `sub: userId`.
- `GET /auth/me`: Returns the authenticated user profile and effective permissions without sensitive fields.

## IAM Structure
- **UsersService:** Organization-scoped user queries and permission flattening.
- **RolesService:** Organization-scoped role creation and assignment. 

## Permission Matrix
See `docs/architecture/permission-matrix.md` for the explicit list of available permissions. This matrix is the only source of truth for permission strings.

## Limitations & Future Extensions
- **Phase 1B (Next):** Organization Context / Tenant Isolation interceptors for broader application security.
- **Future:** Password resets, MFA, and refresh tokens.
