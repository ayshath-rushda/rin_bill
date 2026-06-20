# RINBILL — Feature Toggle System & Hidden GST Module

---

## Feature Toggle System

All feature flags are stored in the `settings` collection and cached in Redux.

### Available Flags

| Key | Type | Default | Description |
|---|---|---|---|
| `gstEnabled` | boolean | `false` | Enable GST module |
| `multiWarehouse` | boolean | `false` | Enable multi-warehouse inventory |
| `multiBranch` | boolean | `false` | Enable multi-branch support |
| `purchaseManagement` | boolean | `false` | Enable purchase order management |

### Architecture

```
                    ┌───────────────────┐
                    │  settings DB       │
                    │  collection        │
                    └────────┬──────────┘
                             │
              ┌──────────────┴──────────────┐
              │                              │
              ▼                              ▼
    ┌─────────────────┐            ┌──────────────────┐
    │ Backend Check   │            │ Frontend Check   │
    │                 │            │                  │
    │ Middleware:     │            │ settingsSlice    │
    │ gstGuard.js     │            │ .gstEnabled      │
    │                 │            │                  │
    │ Routes mounted  │            │ Conditional      │
    │ conditionally   │            │ rendering        │
    └─────────────────┘            └──────────────────┘
```

### Super Admin Settings Page

Located at `/admin/settings`. Contains toggle switches for each flag. Super Admin only.

```json
// Settings page UI
[
  { "key": "gstEnabled", "label": "Enable GST Module", "type": "toggle", "default": false },
  { "key": "multiWarehouse", "label": "Enable Multi Warehouse", "type": "toggle", "default": false },
  { "key": "multiBranch", "label": "Enable Multi Branch", "type": "toggle", "default": false },
  { "key": "purchaseManagement", "label": "Enable Purchase Management", "type": "toggle", "default": false },
]
```

### Caching Strategy

1. On app startup, `settingsSlice` fetches all settings via `GET /api/settings`
2. Settings stored in Redux for instant access across components
3. React Query could also be used, but Redux is preferred for synchronous route guard checks
4. When Super Admin toggles a setting → `PUT /api/settings/:key` → update Redux

---

## Hidden GST Module — Detailed Specification

### Concept

GST (Goods & Services Tax) is a legal requirement in India. However, RINBILL may initially operate in regions or business contexts where GST is not applicable. The GST module must **exist in code but remain completely invisible** until a Super Admin enables it via the feature toggle.

### When GST is Disabled (Default)

| Aspect | Behavior |
|---|---|
| **Sidebar** | No GST menu items |
| **URL access** | `/admin/system/gst*` routes return 404 |
| **Product form** | HSN Code and GST Rate fields hidden |
| **Invoice** | No CGST/SGST/IGST columns |
| **Reports** | No GST reports in report list |
| **API** | GST routes not mounted; 404 if accessed |

### When GST is Enabled

| Aspect | Behavior |
|---|---|
| **Hidden routes work** | `/admin/system/gst*` accessible |
| **Product form** | HSN Code + GST Rate fields visible |
| **Invoice** | CGST/SGST/IGST automatically calculated |
| **Reports** | Sales GST, Tax Summary, HSN reports available |
| **API** | GST routes mounted and functional |

### Implementation — Backend

#### 1. Conditional Route Mounting

```javascript
// app.js
const setting = await Setting.findOne({ key: 'gstEnabled' });
if (setting?.value === true) {
  app.use('/api/gst', gstRoutes);
}
```

#### 2. GST Guard Middleware (Safety Net)

```javascript
// middleware/gstGuard.js
module.exports = async (req, res, next) => {
  const setting = await Setting.findOne({ key: 'gstEnabled' });
  if (!setting?.value) {
    return res.status(404).json({ message: 'Not found' });
  }
  next();
};
```

#### 3. GST Invoice Computation

```javascript
// Intra-state (same state): CGST (9%) + SGST (9%) = 18%
// Inter-state (different state): IGST (18%)

function computeGST(taxableValue, gstRate, fromStateCode, toStateCode) {
  if (fromStateCode === toStateCode) {
    return {
      cgst: (taxableValue * gstRate / 2) / 100,
      sgst: (taxableValue * gstRate / 2) / 100,
      igst: 0,
      totalTax: taxableValue * gstRate / 100
    };
  } else {
    return {
      cgst: 0,
      sgst: 0,
      igst: taxableValue * gstRate / 100,
      totalTax: taxableValue * gstRate / 100
    };
  }
}
```

### Implementation — Frontend

#### 1. GST Route Guard

```javascript
// routes/GstRoute.jsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function GstRoute({ children }) {
  const { user } = useSelector(state => state.auth);
  const { gstEnabled } = useSelector(state => state.settings);

  if (!user || user.role !== 'super_admin' || !gstEnabled) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
```

#### 2. GST-aware Product Form

```javascript
// In ProductForm.jsx
const { gstEnabled } = useSelector(state => state.settings);

// Only render when enabled
{gstEnabled && (
  <div className="grid grid-cols-2 gap-4">
    <FormField label="HSN Code" ... />
    <FormField label="GST Rate" type="select" options={[0,5,12,18,28]} ... />
  </div>
)}
```

#### 3. Sidebar Conditional Rendering

```javascript
// In AdminSidebar.jsx
const { gstEnabled } = useSelector(state => state.settings);

// GST sections are NOT rendered regardless of gstEnabled
// Super Admin must memorize the URL or bookmark it
```

### GST Data Flow for Invoices

```
Order Items
    │
    ▼
Compute subtotal per item (qty × price)
    │
    ▼
If gstEnabled:
    ├── Look up HSN code & GST rate for each product
    ├── Determine intra/inter-state (billing address vs business state)
    ├── Compute CGST + SGST or IGST
    └── Add to invoice as separate line items
    │
    ▼
Save invoice with gstDetails embedded
    │
    ▼
Display on invoice (if enabled) or hide (if disabled)
```

### GST Slabs

| Rate | CGST | SGST | IGST |
|---|---|---|---|
| 0% | 0% | 0% | 0% |
| 5% | 2.5% | 2.5% | 5% |
| 12% | 6% | 6% | 12% |
| 18% | 9% | 9% | 18% |
| 28% | 14% | 14% | 28% |

### Future GST Features (v2)

- GSTR-1 monthly/quarterly return export
- E-Invoice JSON generation (schema v1.03)
- E-Way bill integration
- Input tax credit (ITC) tracking
- Auto-populated return forms
