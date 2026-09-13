# Finance Journal Posting Rules

> This document defines the exact double-entry journal entries for every supported financial operation.
> Every posted entry must satisfy: `SUM(debits) = SUM(credits)`.
> Amounts use BDT with `NUMERIC(19,4)` precision.
> All posted entries are immutable.

---

## Posting Convention

- **Assets** increase with DEBIT, decrease with CREDIT.
- **Liabilities** increase with CREDIT, decrease with DEBIT.
- **Equity** increases with CREDIT, decreases with DEBIT.
- **Revenue** increases with CREDIT, decreases with DEBIT.
- **Expenses** increase with DEBIT, decrease with CREDIT.

Each JournalLine carries exactly one positive amount in either `debit` or `credit`, never both.

---

## 1. Cash Sale (৳10,000)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Cash [ASSET] | ৳10,000 | |
| 2 | Sales Revenue [REVENUE] | | ৳10,000 |

Dimensions: Business Unit = Shop, Branch = Main

---

## 2. Credit Sale (৳10,000)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Accounts Receivable [ASSET] | ৳10,000 | |
| 2 | Sales Revenue [REVENUE] | | ৳10,000 |

Note: Revenue is recognized at point of sale, not at payment.

---

## 3. Customer Advance Payment (৳5,000)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Cash [ASSET] | ৳5,000 | |
| 2 | Customer Advance / Unearned Revenue [LIABILITY] | | ৳5,000 |

Note: This is NOT revenue until goods/services are delivered.

---

## 4. Customer Payment Against Credit Sale (৳10,000)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Cash [ASSET] | ৳10,000 | |
| 2 | Accounts Receivable [ASSET] | | ৳10,000 |

---

## 5. Full Refund of Cash Sale (৳10,000)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Sales Returns & Allowances [CONTRA-REVENUE] | ৳10,000 | |
| 2 | Cash [ASSET] | | ৳10,000 |

Note: The original sale entry remains untouched. The refund is a separate entry.

---

## 6. Inventory Purchase — Cash (৳50,000)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Inventory Asset [ASSET] | ৳50,000 | |
| 2 | Cash [ASSET] | | ৳50,000 |

---

## 7. Inventory Purchase — On Credit (৳50,000)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Inventory Asset [ASSET] | ৳50,000 | |
| 2 | Accounts Payable [LIABILITY] | | ৳50,000 |

---

## 8. Inventory Sale — COGS Recognition (Cost ৳6,000)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Cost of Goods Sold [EXPENSE] | ৳6,000 | |
| 2 | Inventory Asset [ASSET] | | ৳6,000 |

Note: This is posted alongside the revenue entry (#1 or #2). Together they produce:
- Revenue ৳10,000
- COGS ৳6,000
- Gross Profit ৳4,000

---

## 9. General Expense — Electricity via bKash (৳2,000)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Electricity Expense [EXPENSE] | ৳2,000 | |
| 2 | bKash Account [ASSET] | | ৳2,000 |

Dimensions: Business Unit, Branch as applicable.

---

## 10. Supplier Payment Against Payable (৳20,000)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Accounts Payable [LIABILITY] | ৳20,000 | |
| 2 | Bank Account [ASSET] | | ৳20,000 |

---

## 11. Owner Capital Injection (৳100,000)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Bank Account [ASSET] | ৳100,000 | |
| 2 | Owner's Capital [EQUITY] | | ৳100,000 |

Note: This is NOT revenue. It is an equity transaction.

---

## 12. Owner Withdrawal / Drawings (৳10,000)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Owner's Drawings [EQUITY] | ৳10,000 | |
| 2 | Cash [ASSET] | | ৳10,000 |

Note: This is NOT an expense. It reduces owner's equity.

---

## 13. Internal Transfer — Cash to Bank (৳5,000)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Bank Account [ASSET] | ৳5,000 | |
| 2 | Cash Account [ASSET] | | ৳5,000 |

Note: This is NOT revenue or expense. It is a movement between asset accounts.

---

## 14. Payroll Accrual — End of Month (৳30,000)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Salary Expense [EXPENSE] | ৳30,000 | |
| 2 | Salary Payable [LIABILITY] | | ৳30,000 |

Dimensions: Business Unit, Branch, Department, Project (where applicable).

> Note: Employee is not a JournalLine accounting dimension. Employee-level payroll information remains owned by HR/Payroll and is transformed into Finance postings through the application orchestration layer.

---

## 15. Payroll Payment — Salary Disbursement (৳30,000)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Salary Payable [LIABILITY] | ৳30,000 | |
| 2 | Bank Account [ASSET] | | ৳30,000 |

---

## 16. Asset Purchase — Computer (৳80,000)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Computer Equipment [FIXED ASSET] | ৳80,000 | |
| 2 | Bank Account [ASSET] | | ৳80,000 |

---

## 17. Discount on Sale (Sale ৳10,000, Discount ৳500)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Cash [ASSET] | ৳9,500 | |
| 2 | Sales Discount [CONTRA-REVENUE] | ৳500 | |
| 3 | Sales Revenue [REVENUE] | | ৳10,000 |

---

## 18. Business-Unit-to-Business-Unit Transfer (৳5,000 Shop → Agro)

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Inter-Unit Receivable [ASSET] (BU=Agro) | ৳5,000 | |
| 2 | Inter-Unit Payable [LIABILITY] (BU=Shop) | | ৳5,000 |

AND on the cash movement side:

| Line | Account | Debit | Credit |
|------|---------|-------|--------|
| 1 | Cash - Agro [ASSET] (BU=Agro) | ৳5,000 | |
| 2 | Cash - Shop [ASSET] (BU=Shop) | | ৳5,000 |

Note: This is NOT revenue or expense. It is an internal movement.

---

## Correction / Reversal Rules

1. **Posted entries are NEVER modified or deleted.**
2. To correct a posted entry, create a **Reversal Entry** that mirrors the original with debits/credits swapped.
3. The reversal entry's `reversalOfId` field links to the original entry.
4. The original entry's status changes to `REVERSED`.
5. If needed, a new corrected entry is then posted.
