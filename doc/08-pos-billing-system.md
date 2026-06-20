# RINBILL — POS Billing System

---

## Overview

The POS (Point of Sale) Billing System supports both Retail (B2C) and Wholesale (B2B) operations from a single interface.

---

## Retail Billing (B2C)

**Workflow:**
```
Select Product → Generate Invoice → Receive Payment → Print Invoice
```

**Features:**
- Barcode/SKU quick search (debounced, real-time)
- Product lookup by code, name, or SKU
- Quantity increment/decrement buttons
- Itemized bill with subtotal, discount, tax, total
- Multiple payment methods (Cash, UPI, Bank Transfer)
- Instant invoice generation
- Thermal printer support (via browser print)

---

## Wholesale Billing (B2B)

**Additional Features:**
- Dealer/Customer selection dropdown
- Credit sales (invoice without full payment)
- Business customer management
- Credit limit tracking
- GST-ready invoice architecture

---

## POS UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Barcode/Search Input — auto-focus]         Retail │ Wholesale│
├──────────────────────┬──────────────────────────────────────┤
│   Product Results    │         Invoice Cart                  │
│                      │                                      │
│  ┌──────┬─────────┐  │  ┌──────┬──────┬────┬────┬──────┐  │
│  │Code  │Name     │  │  │#     │Item  │Qty │Rate│Total │  │
│  ├──────┼─────────┤  │  ├──────┼──────┼────┼────┼──────┤  │
│  │P001  │Product A│  │  │1     │Prod A│ 2  │100 │ 200  │  │
│  │P002  │Product B│  │  │2     │Prod B│ 1  │150 │ 150  │  │
│  │P003  │Product C│  │  │      │      │    │    │      │  │
│  │P004  │Product D│  │  │      │      │    │    │      │  │
│  └──────┴─────────┘  │  └──────┴──────┴────┴────┴──────┘  │
│                      │                                      │
│  [Keyboard: F1-F4]   │  Subtotal: 350                      │
│  Quick add codes     │  Discount: 0                        │
│                      │  Tax:     0                         │
│                      │  ─────────────────────              │
│                      │  TOTAL:  350                        │
│                      │                                      │
│                      │  [Customer: Walk-in] [Payment]      │
│                      │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

---

## POS Keyboard Shortcuts

| Key | Action |
|---|---|
| F1 | Focus search input |
| F2 | Quick add by product code |
| F3 | Open payment dialog |
| F4 | Print last invoice |
| Enter | Add selected product |
| Delete | Remove selected item |
| +/- | Increase/decrease quantity |

---

## Invoice Number Format

```
INV-{YYYYMMDD}-{XXXXX}
Example: INV-20260620-00001
```

---

## Payment Dialog

```
┌──────────────────────────────────┐
│         Receive Payment          │
│                                   │
│  Total Amount: ₹ 350.00          │
│  Amount Paid:  [___350.00___]    │
│  Balance:      ₹ 0.00            │
│                                   │
│  Method:                         │
│  ○ Cash    ○ UPI    ○ Bank Trf   │
│                                   │
│  Transaction Ref: [optional]     │
│                                   │
│  [Cancel]     [Complete Sale]    │
└──────────────────────────────────┘
```

---

## Invoice Print Format

```
        RINBILL STORE
    123, Main Street, City
    Phone: +91-9876543210
    GSTIN: [if enabled]
═══════════════════════════════
    TAX INVOICE (RETAIL)
═══════════════════════════════
Invoice No: INV-20260620-00001
Date: 20 Jun 2026
Customer: Walk-in Customer
───────────────────────────────
# │ Item         │ Qty │ Amt
───────────────────────────────
1 │ Product A    │  2  │ 200
2 │ Product B    │  1  │ 150
───────────────────────────────
Subtotal:         350.00
Discount:           0.00
Tax (if GST):      63.00
═══════════════════════════════
TOTAL:           ₹ 413.00
═══════════════════════════════
Payment: Cash     ₹ 500.00
Change:           ₹  87.00
───────────────────────────────
         Thank You!
   Visit us again at rinbill.com
```
