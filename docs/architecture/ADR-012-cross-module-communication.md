# ADR-012: Cross-Module Communication & Orchestration

**Decision:**
Cross-module communication and atomic operations (e.g., Sale + Stock Decrease + Financial Journal) will be managed through an Application-Level Orchestrator utilizing a Unit of Work (UoW) pattern, rather than direct module-to-module dependencies or an asynchronous event bus.

**Rationale:**
1. **Financial Integrity:** Operations like Sales MUST atomically update inventory and finance. Eventual consistency via decoupled event buses introduces unacceptable risks (e.g., selling out of stock while waiting for an event).
2. **Domain Encapsulation:** Specialized modules (POS, Inventory, Finance) should not be tightly coupled to each other's implementations. They should expose business capabilities (Ports/Interfaces).
3. **Infrastructure Decoupling:** Domain services must not directly depend on Prisma-specific transaction clients. The Application layer manages the `IUnitOfWork` and passes the execution context down.

**Architecture Flow:**
```text
Application / Orchestrator
        ↓
IUnitOfWork (Transaction Boundary)
        ↓
Domain/Application Ports (POS, Inventory, Finance)
        ↓
Infrastructure Adapters (Prisma Repositories)
        ↓
Prisma (PostgreSQL)
```

**Consequences:**
- Complex operations are centralized in use-case orchestrators (e.g., `CheckoutUseCase`), making the business flow visible in one place.
- Modules remain independent and testable without requiring the full system state.
- Requires building a clean `IUnitOfWork` abstraction over Prisma's `$transaction` API.

**Alternatives Rejected:**
- **Microservices / Event Bus:** Adds massive deployment and transaction-rollback complexity for a system that can comfortably run as a modular monolith.
- **Direct Module Dependencies (POSService injecting InventoryService):** Creates tangled, unmaintainable "spaghetti" dependencies and circular references.
