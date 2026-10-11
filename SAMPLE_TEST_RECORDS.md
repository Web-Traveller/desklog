# DeskLog Complete Manual Test Records & Verification Guide

Use this document to systematically test every feature, component, modal, and edge-case in DeskLog on Windows or Linux.

---

## 📋 1. Test Records Dataset

### A. Sample Customers to Add

| Name | Mobile Number | Aadhaar Number | Remarks / Notes | Expected Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Ramesh V. Sharma** | `9820012345` | `1234 5678 9012` | Regular walk-in client for PAN & Aadhaar | Toast: *"Customer "Ramesh V. Sharma" added successfully."* |
| **Priya S. Patel** | `9876543210` | `9876 5432 1098` | Urgent government exam form fill-up | Profile created with initials **PP** |
| **Amit K. Verma** | `9820012345` | `4567 8901 2345` | Brother of Ramesh (Shares same family mobile) | Shared Mobile Banner appears with option to create as separate profile |

---

### B. Sample Tasks & Work Orders

| Customer | Service / Title | Status | Target Date | Billing Amount | Expected Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ramesh V. Sharma** | `PAN Card New Application` | `PENDING` | Tomorrow | ₹150 | Badge: `PENDING` |
| **Priya S. Patel** | `Online Exam Form Fillup` | `READY` | Today | ₹200 | Badge: `READY` |
| **General / Walk-in** | `Aadhaar Update Linkage` | `DELIVERED` | Yesterday | ₹100 | Completed timestamp logged |
| **Ramesh V. Sharma** | `Income Certificate Application` | `CANCELLED` | Next Week | ₹250 | Prompts for Cancellation Reason |

---

### C. Sample Banking Transactions (AePS / Transfers / Deposits)

| Type | Payment Mode | Customer | Amount | Ref Number / Details | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Withdrawal** | `AePS` | **Ramesh V. Sharma** | ₹3,000 | `Aadhaar: **** 9012 (SBI)` | Logged under Banking table & Toast |
| **Transfer** | `UPI / IMPS` | **Priya S. Patel** | ₹1,500 | `UPI Ref: 42910482910` | Green transfer badge displayed |
| **Deposit** | `Cash` | **General Client** | ₹5,000 | `Cash deposit at counter` | Net balance updated |

---

### D. Sample Service Catalog Entries

| Service Name | Default Price | Status | Action |
| :--- | :--- | :--- | :--- |
| `PAN Card Application` | ₹150 | `Active` | Auto-fills billing price during task creation |
| `Aadhaar Linkage & Update` | ₹100 | `Active` | Selectable in task drop-down |
| `Passport Online Application` | ₹350 | `New Custom Service` | Test adding custom service in Services page |

---

## 🧪 2. Step-by-Step Manual Component Test Plan

### Test 1: Add Customer Modal (`Ctrl + Shift + C`)
1. Press `Ctrl + Shift + C` or click **+ Add Customer**.
2. Enter Name: `Ramesh V. Sharma`, Mobile: `9820012345`.
3. Click **Create New Person**.
4. **Verification**: 
   - [x] Success Toast notification appears bottom-right.
   - [x] Customer appears under Customer Directory and Dashboard.

### Test 2: Shared Mobile Detection
1. Click **+ Add Customer**.
2. Enter Name: `Amit K. Verma`, Mobile: `9820012345` (same number as Ramesh).
3. **Verification**:
   - [x] Yellow warning banner appears indicating shared mobile number.
   - [x] Clicking **Create New Person** succeeds without error.

### Test 3: Add Task Modal (`Ctrl + N`)
1. Press `Ctrl + N` or click **+ New Task**.
2. Select Customer: `Ramesh V. Sharma`, Service: `PAN Card New Application`.
3. Click **Save Task**.
4. **Verification**:
   - [x] Task appears in Dashboard list.
   - [x] Activity timeline logs *"New task created: PAN Card New Application"*.

### Test 4: Task Status Transition & Payments
1. Locate Ramesh's task on Dashboard or Tasks page.
2. Change status to `READY`, then `DELIVERED`.
3. Click **Record Payment** (e.g. ₹150).
4. **Verification**:
   - [x] Payment Toast appears.
   - [x] Total revenue counter updates.

### Test 5: Banking Page
1. Navigate to **Banking** tab in left sidebar.
2. Click **+ New Transaction**.
3. Select `Withdrawal`, Mode: `AePS`, Amount: `3000`.
4. Click **Save Transaction**.
5. **Verification**:
   - [x] Transaction appears in Banking table.
   - [x] Filter by `Withdrawal` and `Today` works smoothly.

### Test 6: Settings Page & CSV Exports
1. Navigate to **Settings** tab.
2. Edit Shop Name to `Apex Cyber Desk` and click **Save Shop Profile**.
3. Test **Customers CSV**, **Tasks CSV**, and **Payments CSV** export buttons.
4. **Verification**:
   - [x] Software Updates card is cleanly removed.
   - [x] Subtle version badge `DeskLog v1.0.0` is visible in bottom-right corner.
   - [x] CSV files download successfully.

---

## 🎨 3. Offline Icon Verification
- Disconnect internet / disable Wi-Fi.
- Re-open DeskLog.
- **Verification**: All icons (search, delete, add, store, group, settings) display as crisp vectors without raw text.
