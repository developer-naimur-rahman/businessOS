# Automation-First Dynamic UX Architecture

> **Core Principle:** Maximum Automation + Minimum User Effort + Full Manual Control When Needed

The entire My Business OS is designed around an intelligent, automation-heavy User Experience that derives complex technical and financial consequences from simple business inputs, while always providing an explicit override path for advanced control.

---

## 1. Context-Aware Abstraction
Users operate on business intent (e.g., "Sell an item", "Receive a payment"). The system shields them from:
- Journal Entries, Debits/Credits, and Ledger Accounts
- Inventory Valuation and WAC Calculations
- Internal Financial Dimension IDs
- Complex technical references

The backend derives the technical requirements from the business context.

## 2. Automation Pipeline
Every major business operation follows a strict pipeline:
1. **User Input** (Minimal required fields)
2. **Context Detection** (Branch, User, Defaults)
3. **Automatic Defaults** (Apply configuration-driven mappings)
4. **Business Rule Engine** (Calculations, taxes, discounts)
5. **Automatic Cross-Module Actions** (e.g., reduce inventory, recognize COGS)
6. **User Review** (Visual confirmation)
7. **Optional Manual Override** (Advanced mode adjustments)
8. **Validation & Confirmation**
9. **Atomic Transaction & Audit Trail**

## 3. Dynamic Forms & Progressive Disclosure
Forms are progressively disclosed:
- **Simple Mode:** Essential business fields only (e.g., Customer, Product, Quantity).
- **Advanced Mode:** Optional overrides (e.g., Branch, Warehouse, Tax rules).
- **Manual Override:** Expert-level controls (e.g., specific ledger accounts, cost centers).

## 4. Configuration-Driven Mappings
Business rules are NEVER hardcoded in controllers. They are driven by configurable mappings managed by administrators:
- **Product Category** → Maps to Revenue, Inventory, COGS accounts, Tax rules.
- **Payment Method** → Maps to specific Financial Accounts (e.g., Cash, Bank, Mobile).
- **Branch** → Maps to Default Warehouse, Default Cash Account, Default Revenue Account, Timezone.
- **Department** → Maps to Payroll Expense accounts.

## 5. Smart Defaults & Dropdown-First UI
- Free-text inputs and ID typing are strictly avoided.
- Use searchable dropdowns, comboboxes, and autocomplete.
- The system remembers user context (e.g., default branch, recent payment methods) and automatically pre-selects them.

## 6. Automation With Human Override
Automation never means a loss of control. Every automated decision (e.g., an automatically selected Revenue Account) provides a "Change" or "Override" option. The system explicitly flags whether a value was:
- Automatically selected
- Manually overridden
- Inherited from branch/configuration
