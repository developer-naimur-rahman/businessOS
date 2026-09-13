# Permission Matrix

> Defines the granular permission model for the Scalable Business Operating System.
> Roles are customizable collections of permissions. The mappings below are **defaults** — the owner can customize any role.

---

## Permission Naming Convention

Permissions follow the pattern: `module.entity.action`

Examples:
- `finance.journal.create` — Create journal entries
- `finance.journal.post` — Post (finalize) journal entries
- `finance.period.lock` — Lock fiscal periods
- `pos.sale.create` — Create POS sales
- `pos.refund.request` — Request a refund (not approve)
- `pos.refund.approve` — Approve a refund
- `inventory.stock.receive` — Receive stock into inventory
- `inventory.stock.adjust` — Submit stock adjustments
- `inventory.stock.adjust.approve` — Approve stock adjustments

---

## Default Role Permissions

### Legend
- ✓ = Granted
- R = Can request (requires approval)
- — = Not granted

| Permission | Owner | Gen. Manager | Accountant | Inv. Manager | Cashier | HR |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **ORGANIZATION** | | | | | | |
| `org.unit.create` | ✓ | — | — | — | — | — |
| `org.unit.update` | ✓ | — | — | — | — | — |
| `org.branch.manage` | ✓ | ✓ | — | — | — | — |
| **FINANCE** | | | | | | |
| `finance.journal.create` | ✓ | — | ✓ | — | — | — |
| `finance.journal.post` | ✓ | — | ✓ | — | — | — |
| `finance.journal.reverse` | ✓ | — | R | — | — | — |
| `finance.report.view` | ✓ | ✓ | ✓ | — | — | — |
| `finance.report.pl` | ✓ | ✓ | ✓ | — | — | — |
| `finance.account.manage` | ✓ | — | ✓ | — | — | — |
| `finance.period.lock` | ✓ | — | ✓ | — | — | — |
| `finance.expense.create` | ✓ | ✓ | ✓ | — | — | — |
| `finance.payment.record` | ✓ | ✓ | ✓ | — | — | — |
| **POS / SALES** | | | | | | |
| `pos.sale.create` | ✓ | ✓ | — | — | ✓ | — |
| `pos.sale.void` | ✓ | ✓ | — | — | — | — |
| `pos.refund.request` | ✓ | ✓ | — | — | R | — |
| `pos.refund.approve` | ✓ | ✓ | — | — | — | — |
| `pos.discount.apply` | ✓ | ✓ | — | — | — | — |
| `pos.register.open` | ✓ | ✓ | — | — | ✓ | — |
| `pos.register.close` | ✓ | ✓ | — | — | ✓ | — |
| **INVENTORY** | | | | | | |
| `inventory.product.manage` | ✓ | ✓ | — | ✓ | — | — |
| `inventory.stock.receive` | ✓ | ✓ | — | ✓ | — | — |
| `inventory.stock.adjust` | ✓ | ✓ | — | R | — | — |
| `inventory.stock.adjust.approve` | ✓ | ✓ | — | — | — | — |
| `inventory.stock.transfer` | ✓ | ✓ | — | ✓ | — | — |
| `inventory.price.change` | ✓ | ✓ | — | R | — | — |
| **HR / EMPLOYEES** | | | | | | |
| `hr.employee.view` | ✓ | ✓ | — | — | — | ✓ |
| `hr.employee.manage` | ✓ | — | — | — | — | ✓ |
| `hr.attendance.manage` | ✓ | ✓ | — | — | — | ✓ |
| `hr.payroll.run` | ✓ | — | ✓ | — | — | ✓ |
| `hr.payroll.approve` | ✓ | — | — | — | — | — |
| `hr.salary.change` | ✓ | — | — | — | — | R |
| **USERS / ROLES** | | | | | | |
| `iam.user.manage` | ✓ | — | — | — | — | — |
| `iam.role.manage` | ✓ | — | — | — | — | — |
| `iam.permission.assign` | ✓ | — | — | — | — | — |
| **AUDIT** | | | | | | |
| `audit.log.view` | ✓ | ✓ | ✓ | — | — | — |

---

## Approval Workflow Summary

Actions marked **R** above require an approval workflow:

1. User with `*.request` permission submits a request.
2. System creates a pending `ApprovalRequest` record.
3. User with `*.approve` permission reviews and approves/rejects.
4. Upon approval, the system executes the action and posts the financial transaction.
5. All steps are recorded in the Audit Log.

---

## Notes

- The **Owner** role has all permissions. This is the only role that is not customizable.
- **Gen. Manager** has broad operational permissions but cannot manage users/roles or lock fiscal periods.
- **Accountant** has broad financial permissions but no POS or inventory operational access.
- Roles are fully customizable — the owner can create new roles and assign any combination of permissions.
- Direct user-to-permission assignment is intentionally NOT supported. All permissions flow through roles.
