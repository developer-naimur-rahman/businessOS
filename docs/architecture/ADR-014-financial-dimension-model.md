# ADR-014: Financial Dimension Model

**Decision:**
The `JournalLine` (financial ledger) will strictly support macro-level business dimensions for tracking Profit & Loss (P&L) and balance sheets. 

The finalized dimension model for `JournalLine` is:
- `BusinessUnit` (Operational segment)
- `Branch` (Physical location)
- `Department` (Internal HR/Cost grouping)
- `Project` (Specific endeavor / cost center)

**Employee is explicitly NOT a JournalLine accounting dimension.**

**Rationale:**
1. **Domain Boundary Preservation:** Employee-level payroll details (payslips, deductions, individual salaries) belong strictly in the HR/Payroll domain (the subledger).
2. **Ledger Bloat Prevention:** If an organization has 10,000 employees, posting an individual `JournalLine` per employee per month creates 20,000+ ledger lines. 
3. **Aggregated Finance Design:** The HR/Payroll module owns the `PayrollRun`. When finalized, the Application Orchestrator posts a single, aggregated `JournalEntry` to Finance, grouping the lines by `Department` or `BusinessUnit`. The `referenceId` on the `JournalEntry` points back to the `PayrollRun` for detailed reconciliation.

**Consequences:**
- The Finance module stays lean and scalable.
- HR rules (like changing a salary or individual tax deduction) do not require complex financial ledger adjustments unless the macro aggregated amount changes.
- Requires building robust aggregation logic in the Application Orchestrator when integrating HR and Finance.

**Alternatives Rejected:**
- **Model A (employeeId on JournalLine):** Rejected due to massive ledger bloat and inappropriate mixing of HR operational details with pure accounting data.
- **Model C (Generic Dimension Tables):** Rejected because it introduces unnecessary JOIN complexity for reporting when the core 4 dimensions are universally applicable.
