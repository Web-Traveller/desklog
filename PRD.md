# Master PRD + Technical Specification

## Local Service Shop Management Desktop App

**Document purpose:** This is the master specification for the AI coding agent. The agent should treat this document as the source of truth and **audit/refactor the existing application**, rather than continuing the previous screen-by-screen implementation approach.

The existing application may contain partially implemented screens, inconsistent terminology, duplicated logic, or incorrect data relationships. **Do not preserve broken architecture merely because it already exists.** Reuse working UI/components where appropriate, but redesign/refactor anything that conflicts with this specification.

---

# 1\. Product Overview

Build a **Windows desktop application** for a small local online-service shop.

The shop helps customers with services such as:

- PAN card changes/applications
- Aadhaar-related services
- Bank account linking
- Online exam/application forms
- Result downloads
- Government/online portal services
- Other manually defined local services

The application is an internal **shop/work management system**.

Its primary purpose is to let the shop operator:

1. Maintain customers profiles.
2. Create and manage service tasks.
3. Schedule tasks for future dates/times.
4. Track task progress.
5. Track billing and partial/full payments.
6. See what needs attention today.
7. Search historical customers/tasks.
8. View scheduled work and historical activity on a calendar.
9. Maintain all data locally on the Windows computer.
10. Back up and restore the local database.

The application is **not** intended to be:

- A cloud CRM
- A customer-facing portal
- An accounting/GST application
- A multi-branch SaaS application
- A document-management system
- A file-storage system
- A mobile application

---

# 2\. Most Important Product Principle

The application should feel like a **fast shop counter/work desk**, not enterprise software.

The operator should be able to do:

> Find customer → select service → set schedule → enter amount → save

with as few clicks and as little typing as possible.

Do not introduce unnecessary complexity.

---

# 3\. Platform

## Required

- Windows desktop application
- Local-first
- Data stored on the local computer
- Application should work normally without an internet connection

## Preferred architecture

Use an embedded local database such as:

**SQLite**

The exact desktop framework can remain whatever the current project already uses if it is technically sound.

Do **not** rewrite the entire application into another framework solely for architectural preference.

First inspect the existing codebase.

If the current stack is reasonable:

> Refactor and improve it.

If the current stack fundamentally prevents the requirements from being implemented reliably:

> Recommend and perform a controlled architectural migration.

---

# 4\. Core Domain Model

The application revolves around five major concepts:

```
Customer
   │
   └── Tasks
          │
          ├── Service
          ├── Schedule
          ├── Status
          ├── Payment
          └── Activity History
```

There must be a clear separation between these concepts.

---

# 5\. Customer Model — IMPORTANT

## Do NOT make mobile number the unique customer identifier.

This is a critical requirement.

A single mobile number can belong to multiple people.

Example:

```
9876543210
│
├── Rajesh Sharma
│
├── Amit Sharma
│
└── Priya Sharma
```

Another example:

```
9876543210
│
├── Father
├── Sonil
├── Daughter
└── Wife
```

Therefore:

> **Mobile number is a searchable contact attribute, NOT a unique key.**

Never implement:

```
UNIQUE(mobile)
```

on the customer table.

---

# 6\. Customer Relationships

The application should support people who share the same mobile number.

Example:

```
Rajesh Sharma
Mobile: 9876543210

Amit Sharma
Mobile: 9876543210
```

The system should allow a customer profile to be associated with another customer/profile.

---

# 7\. Customer Structure

Recommended model:

```
Customer
    id
    name
    mobile
    note
    created_at
    updated_at
```

The important behavioral requirement is:

> The shop operator must be able to distinguish two people even when they have the same mobile number.

---

# 8\. Customer Creation UX

When creating a customer:

```
Name *
Mobile
Note
```

Mobile is optional/normal contact information, but **must not be unique**.

If the entered mobile already exists, do NOT show:

> "Customer already exists."

Instead show something like:

> "This mobile number is already used by 2 customers."

Then offer:

```
Existing people

Rajesh Sharma
Amit Sharma

[Select Existing] [Create New Person]
```

The operator must be able to create another person with the same number.

---

# 9\. Customer Detail

Customer detail should show:

### Identity

- Name
- Mobile
- Note

### Tasks

All tasks belonging to this person.

### Related people

Example:

```
Related People

Rajesh Sharma

Priya Sharma
```

The operator should be able to navigate between related people.

---

# 10\. Customer Search

Search must work using:

- Name
- Mobile
- Partial name
- Partial mobile
- Task/service associated with customer

Example:

Searching:

```
98765
```

may return:

```
Rajesh Sharma
Amit Sharma
Priya Sharma
```

because all use that number.

The UI must clearly distinguish them.

---

# 11\. Tasks

A task represents one service request/work item for one specific customer/person.

Example:

```
Customer:
Amit Sharma

Service:
PAN Card Correction

Status:
Processing

Scheduled:
Monday 10:00 AM

Target completion:
Tuesday

Billing:
₹300

Paid:
₹100

Payment:
Partially Paid
```

---

# 12\. Task Fields

Every task should support:

### Required

- Customer
- Service/task title
- Status

### Optional

- Task note/reminder
- Scheduled date
- Scheduled time
- Target completion date
- Billing amount
- Amount paid

### System generated

- Task ID
- Created timestamp
- Updated timestamp
- Completed/delivered timestamp
- Activity history

---

# 13\. Service Templates

This is a core feature.

The operator should not have to repeatedly type:

> PAN Card Correction

every time.

Create a **Services** configuration section.

Example:

```
Services

PAN Card Correction        ₹150
Aadhaar Update             ₹100
Bank Account Linking       ₹100
Online Exam Form           ₹200
Result Download            ₹30
```

The operator can:

- Add service
- Edit service
- Deactivate service
- Set default price
- Rename service

---

# 14\. Service Template Behavior

When creating a task:

```
Service
[ PAN Card Correction ▼ ]

Default amount
₹150
```

Selecting the service should automatically populate the default billing amount.

The operator must still be able to override it for that specific task.

Changing the service's default price later must **not modify historical tasks**.

Example:

Today:

```
PAN Correction default = ₹150
```

Tomorrow:

```
PAN Correction default = ₹200
```

Existing tasks remain whatever amount they originally had.

---

# 15\. Task Status Model

Use exactly this primary workflow:

```
PENDING
   ↓
PROCESSING
   ↓
READY
   ↓
DELIVERED
```

## Meaning

### Pending

Task has been created but work has not started.

### Processing

Shop has started working on it.

### Ready

Work is completed and ready to be delivered/handed over to the customer.

### Delivered

Customer has received/collected the completed service.

This is the final/closed state.

---

# 16\. Do Not Confuse "Completed" and "Delivered"

The business terminology should be:

**Ready → Delivered**

The application may internally treat `DELIVERED` as a completed/closed task.

The Tasks page can label the final filter:

> Delivered

rather than creating unnecessary separate statuses:

```
Completed
Delivered
Finished
Closed
```

There should be one clear final state.

---

# 17\. Cancelled Tasks

Although not part of the normal workflow, the system should support:

```
CANCELLED
```

as an exceptional state.

It should not be part of the normal forward progression.

When cancelling a task:

- Require/allow cancellation reason
- Record activity
- Preserve history
- Don't delete the task

---

# 18\. Status Transition Rules

Normal progression:

```
Pending → Processing
Processing → Ready
Ready → Delivered
```

Allow reasonable backward correction if the operator made a mistake, but **every status change must create an activity record**.

Example:

```
Status changed
Processing → Pending
```

Do not silently overwrite history.

---

# 19\. Dashboard

The dashboard is the operator's daily workspace.

It should prioritize **what needs attention**, not charts.

Recommended structure:

```
Today's Overview

Pending       12
Processing     7
Ready          4
Overdue        2
```

Then:

```
Today's Scheduled Tasks
```

Then:

```
Tasks Needing Attention
```

Then optionally:

```
Today's Collection
₹2,450
```

---

# 20\. Dashboard Status Counts

The dashboard should show:

- Pending
- Processing
- Ready
- Overdue
- Today's scheduled tasks
- Optionally today's payment collection

Do not show Delivered prominently as an active workload because Delivered means the task is finished.

Historical delivered tasks belong in Tasks/history.

---

# 21\. Overdue Tasks

A task is overdue when:

```
target_completion_date < today
AND
status != DELIVERED
AND
status != CANCELLED
```

It should be visibly marked as:

> Overdue

Do **not** automatically change its status.

Example:

```
PAN Correction
Processing
Target: 28 Sep
Today: 30 Sep

OVERDUE
```

---

# 22\. Scheduled Tasks

Scheduled date/time and target completion date are different concepts.

### Schedule

> When the shop intends to work on it.

### Target completion

> When the shop expects the work to be finished.

Example:

```
Scheduled:
Monday, 10:00 AM

Target completion:
Tuesday
```

Both must be stored independently.

---

# 23\. Task Scheduling

A task can be scheduled for a future date/time.

Example:

> Bank task cannot be done Sunday because the bank is closed.

Operator creates task:

```
Scheduled:
Monday, 10:00 AM
```

On Monday the task appears in:

- Dashboard
- Calendar
- Today's scheduled tasks

---

# 24\. Notifications

Primary requirement:

**In-app notifications/reminders.**

Examples:

```
Today's Tasks
3 tasks scheduled today
```

or:

```
Reminder
Bank Account Linking
Scheduled for today at 10:00 AM
```

Also show:

```
2 overdue tasks
```

Desktop OS notifications may be added later but are not required for MVP.

---

# 25\. Payment Model

The application must support:

- Unpaid
- Partially Paid
- Paid

The important point is that **partial payment is allowed**.

Example:

```
Billing Amount: ₹500
Amount Paid: ₹200
Due: ₹300
Status: Partially Paid
```

---

# 26\. Payment Status Should Be Derived

Do not allow the user to independently enter:

```
Billing amount
Amount paid
Billing status
```

and potentially create contradictory data.

Instead calculate:

```
amount_paid = 0
→ UNPAID

0 < amount_paid < billing_amount
→ PARTIALLY_PAID

amount_paid >= billing_amount
→ PAID
```

The UI can display the resulting status.

---

# 27\. Payment Rules

Never allow:

```
Billing = ₹500
Paid = -₹100
```

Reject negative payment.

For normal operation:

```
Paid <= Billing
```

If the business later needs overpayment/refunds, add that as a deliberate feature rather than silently supporting it.

---

# 28\. Payment Storage

For the first version, a task can have a payment record representing the amount paid.

However, structure the database so that multiple payments can be supported later.

Preferred model:

```
tasks
payments
```

Example:

```
Task:
Billing ₹500

Payments:
₹100 datetime of record
₹100 datetime of record

Total Paid:
₹200
```

This gives future flexibility.

If the current UI wants a simple "Add Payment" action, that is fine.

---

# 29\. Task Financial Summary

Every task should clearly show:

```
Total
₹500

Paid
₹200

Due
₹300

Partially Paid
```

For a fully paid task:

```
Total ₹500
Paid ₹500
Due ₹0
Paid
```

---

# 30\. Task Detail

Suggested layout:

```
PAN Card Correction

Customer
Amit Sharma
9876543210

Status
PROCESSING

Schedule
Monday · 10:00 AM

Target Completion
Tuesday

Payment
₹500 Total
₹200 Paid
₹300 Due
Partially Paid

Notes
Customer needs correction in father's name.

Activity
--------------------------------
10:30 AM
Task created

11:00 AM
Status changed
Pending → Processing

12:15 PM
Payment added
₹200
```

Actions:

```
Edit
Change Status
Add Payment
Reschedule
Mark Ready
Mark Delivered
```

---

# 31\. Activity / Audit System

This is a core feature.

Important actions should automatically generate activity records.

Examples:

```
Customer created
Customer updated

Task created
Task edited

Task scheduled
Task rescheduled

Status changed
Pending → Processing

Payment added
₹200

Task marked Ready
Task marked Delivered
```

---

# 32\. Activity Records Must Be Automatic

The operator should not manually write:

> "Changed pending to processing"

The application generates it automatically.

Activities should contain:

- Timestamp
- Entity type
- Entity ID
- Activity type
- Human-readable description
- Relevant metadata if useful

---

# 33\. Calendar

The Calendar page must have two different concepts:

### Scheduled work

What is planned for that date.

### Activity history

What actually happened that day.

Example:

```
30 September

Scheduled
-----------------
10:00 AM
PAN Correction

2:00 PM
Bank Linking

Activity
-----------------
09:15 AM
Customer Amit added

10:20 AM
PAN task moved to Processing

12:30 PM
₹100 payment recorded
```

Do not merge these into one confusing event type.

---

# 34\. Calendar Views

MVP:

- Month
- Day

Week view can be added if the existing UI supports it cleanly.

Selecting a date should reveal:

- Tasks scheduled that date
- Activities performed that date

---

# 35\. Tasks Page

The Tasks page is the main historical/work list.

Filters:

```
All
Pending
Processing
Ready
Delivered
Cancelled
```

Search:

```
Search customer, mobile, service...
```

Additional filters:

- Scheduled date
- Target completion
- Payment status
- Overdue
- Service

---

# 36\. Delivered Tasks

Delivered tasks should **not clutter the dashboard**.

They should remain searchable in:

> Tasks → Delivered

This preserves history.

The operator must still be able to find:

> What did I do for this customer last month?

---

# 37\. Customer History

Customer detail should show:

```
Customer
Amit Sharma

Tasks

PAN Correction
Delivered

Exam Form
Processing

Bank Linking
Ready
```

Sort newest first.

Clicking a task opens Task Detail.

---

# 38\. Search Behavior

Global/search functionality should support:

- Customer name
- Mobile number
- Service name
- Task title
- Notes where appropriate

Search should be forgiving.

For example:

```
amit
```

finds Amit Sharma.

```
9876
```

finds matching mobile numbers.

```
pan
```

finds PAN-related tasks.

---

# 39\. Settings

Settings should contain:

## Services

- Add service
- Edit service
- Default price
- Activate/deactivate

## Data

- Backup
- Restore
- Export
- Import if implemented
- Database information

## Preferences

- Theme
- Date/time display preferences if needed
- Reminder settings

---

# 40\. Backup & Restore

This is **mandatory** for a local-only application.

The application must provide:

```
Backup Now
```

and:

```
Restore Backup
```

Preferably also:

```
Automatic Backup
```

if feasible.

The user should never need to manually understand SQLite files.

---

# 41\. Backup Safety

Before restoring:

- Warn the user
- Explain that current data will be replaced/changed
- Require confirmation
- Validate the backup
- Do not restore a corrupted/incompatible file

Prefer creating an automatic backup of the current database before a restore operation.

---

# 42\. Data Export

Provide export functionality where practical:

- Customers
- Tasks
- Payments

CSV is sufficient for MVP.

This provides data portability.

---

# 43\. No File Attachments

Do **not** implement task attachments.

There should be no:

```
Upload document
Upload photo
Attach PDF
```

feature in this version.

Notes are text only.

---

# 44\. Database Principles

Use relational data.

Do not store the whole application state as one giant JSON object.

Minimum conceptual tables:

```
customers
services
tasks
payments
activities
settings
```

Potential additional table:

```
task_status_history
```

if activity history and status-specific querying require it.

---

# 45\. Database Relationships

Conceptually:

```
customers
   │
   └──────────────< tasks

services
   │
   └──────────────< tasks

tasks
   │
   ├──────────────< payments
   │
   └──────────────< activities
```

---

# 46\. Customer Database Rules

A customer must have:

```
id
name
mobile nullable
note nullable
created_at
updated_at
```

Do NOT:

```
UNIQUE(mobile)
```

Mobile should be indexed for search but not unique.

Recommended:

```
INDEX customers.mobile
INDEX customers.name
```

---

# 47\. Task Database Rules

Task should contain references rather than duplicated customer information.

Do not store:

```
task.customer_name
task.customer_mobile
```

as the authoritative customer information.

Use:

```
task.customer_id
```

and retrieve customer information through the relationship.

This prevents inconsistent data.

---

# 48\. Historical Pricing Rule

A task must store its actual billing amount.

Do not dynamically calculate historical task prices from the current service template.

Example:

```
Service default today = ₹150
Task created = ₹150

Later service default = ₹200

Old task remains = ₹150
```

---

# 49\. IDs

Use stable internal IDs.

Do not use:

```
mobile number
name
service name
```

as database identifiers.

Every customer/task/service/payment/activity should have a proper primary key.

UUIDs or auto-increment IDs are both acceptable depending on the existing architecture.

---

# 50\. Timestamps

Every important entity should have:

```
created_at
updated_at
```

Tasks should additionally have relevant lifecycle timestamps:

```
completed/delivered_at
```

Potentially:

```
scheduled_at
target_completion_date
```

Do not store dates as arbitrary display strings such as:

```
"Monday morning"
```

Store structured date/time values.

---

# 51\. Soft Delete / Archiving

Avoid destructive deletion of business history.

For customers/services, prefer:

```
is_active
```

or archive behavior.

For tasks, preserve historical records.

Deleting a task should not be the normal way of correcting mistakes.

---

# 52\. UI Design Principles

The interface should be:

- Simple
- Fast
- Clean
- Desktop-friendly
- Keyboard-friendly
- Low typing
- Clear hierarchy
- Consistent

Do not make every screen a dashboard full of cards.

Use cards for meaningful summaries.

Use tables/lists for operational records.

---

# 53\. Navigation

Recommended main navigation:

```
Dashboard
Customers
Tasks
Calendar
Payments
Settings
```

Services can live inside Settings.

Do not create separate top-level navigation items for every tiny operation.

---

# 54\. Primary Actions

Every page should have one obvious primary action.

Examples:

Dashboard:

```
+ New Task
```

Customers:

```
+ Add Customer
```

Tasks:

```
+ New Task
```

Services:

```
+ Add Service
```

Calendar:

No mandatory create button, but allow creating a task from a selected date.

---

# 55\. Task Creation Flow

Optimize this heavily.

Recommended:

### Step 1

Select customer.

Search by:

```
Name / Mobile
```

If not found:

```
+ Create Customer
```

### Step 2

Select service.

```
PAN Card Correction
```

### Step 3

Show default billing.

```
₹150
```

Allow editing.

### Step 4

Set:

- Status
- Schedule
- Target date
- Note

### Step 5

Optional payment:

```
₹50
```

### Step 6

Save.

Automatically create:

```
Task created
```

activity.

---

# 56\. New Customer Flow With Existing Mobile

If user enters:

```
Name: Amit Sharma
Mobile: 9876543210
```

and the number already exists:

Show:

```
This mobile number is already associated with:

Rajesh Sharma
Priya Sharma

Do you want to:

[Create Amit as a new person]
```

Creating Amit must be allowed.

---

# 57\. Prevent Duplicate People — But Don't Block Them

There is a difference between:

> Duplicate detection

and:

> Duplicate prevention.

The application should **warn** about a potentially duplicate person, but it should not prevent creating them.

Example:

```
A person with this name and mobile already exists.
Are you sure you want to create another customer?
```

This is much safer than enforcing uniqueness.

---

# 58\. Empty States

Every list should have a useful empty state.

Example:

```
No pending tasks
```

Customer page:

```
No customers yet

Add your first customer to get started.
```

Don't leave blank white space.

---

# 59\. Error Handling

Errors should be human-readable.

Bad:

```
SQLITE_CONSTRAINT_FOREIGNKEY
```

Good:

```
This customer could not be deleted because they have existing tasks.
```

Technical details can go into logs.

---

# 60\. Confirmation Rules

Don't ask confirmation for every tiny operation.

Ask before destructive actions:

- Delete/archive
- Restore backup
- Permanent data changes

Status changes like:

```
Pending → Processing
```

should be quick.

---

# 61\. Performance

The app should feel instant for a small shop.

Search should not require loading the entire database into memory.

Use database queries and indexes.

Especially index:

```
customers.name
customers.mobile
tasks.customer_id
tasks.status
tasks.scheduled_at
tasks.target_completion_date
tasks.service_id
payments.task_id
activities.created_at
```

---

# 62\. Offline Requirement

Normal functionality must not depend on:

- Internet
- API calls
- Cloud database
- Remote authentication

The shop should be able to open the app and manage existing data while offline.

---

# 63\. Data Security

Because this application may contain personal customer information:

- Keep database local.
- Do not send customer information to external APIs unnecessarily.
- Do not log sensitive customer information into application logs.
- Do not expose database contents in error messages.
- Backups should be treated as sensitive data.

Do not store Aadhaar/PAN numbers unless a future requirement explicitly requires it.

The current app only needs customer identity/contact/task information.

---

# 64\. Activity Privacy

Activity logs should record useful operational actions, but don't dump sensitive fields into logs.

Good:

```
Payment added: ₹200
```

Avoid logging sensitive identity documents or personal identifiers.

---

# 65\. Architecture Rule

The agent must not build business logic directly into individual UI components.

Avoid:

```
Button click
   ↓
SQL query
   ↓
business calculation
   ↓
UI mutation
```

Prefer:

```
UI
 ↓
Application/service layer
 ↓
Repository/data layer
 ↓
SQLite
```

The exact folder names can differ, but the separation must exist.

---

# 66\. Recommended Layers

Conceptually:

```
Presentation/UI
        ↓
Application / Use Cases
        ↓
Domain / Business Rules
        ↓
Data Access / Repository
        ↓
SQLite
```

Examples of business logic:

```
calculatePaymentStatus()
isTaskOverdue()
changeTaskStatus()
createTask()
addPayment()
scheduleTask()
```

These should not be duplicated across screens.

---

# 67\. Single Source of Truth

A rule should exist in one place.

For example, payment status calculation should not separately exist in:

- Dashboard
- Task page
- Payment page
- Customer page

Create one shared business rule.

Same for:

- Overdue calculation
- Task status transitions
- Service pricing
- Customer lookup
- Payment totals

---

# 68\. Existing Application Refactor Instructions

This is especially important for the coding agent.

**Do not assume the existing screens are correct simply because they were already generated.**

First audit:

1. Current routes/pages
2. Current components
3. Current database schema
4. Current models
5. Current state management
6. Current persistence
7. Current task status logic
8. Current customer logic
9. Current payment logic
10. Current calendar logic

Then map the existing implementation against this specification.

---

# 69\. Refactor, Don't Patch

If the existing application contains something like:

```
Customer mobile = unique
```

do not add a hack around it.

Change the underlying data model.

If status handling is inconsistent:

```
pending
Pending
in-progress
processing
complete
completed
ready-to-deliver
```

normalize it.

Do not keep adding conditional statements to compensate for a broken model.

---

# 70\. Existing Data Migration

If existing local data already exists, delete it during development you can delete it now but not later, for production we will handle the migration.

---

# 71\. Status Migration

Map existing states into:

```
PENDING
PROCESSING
READY
DELIVERED
CANCELLED
```

Example:

```
pending → PENDING
in progress → PROCESSING
processing → PROCESSING
ready → READY
completed → DELIVERED
delivered → DELIVERED
cancelled → CANCELLED
```

Do not silently lose historical tasks.

---

# 72\. Database Migration Safety

Never run destructive schema changes against the user's production database without backup.

Before migrations:

```
Create backup
↓
Run migration
↓
Validate
↓
Open application
```

If migration fails:

```
Restore previous database
```

---

# 73\. Testing Requirements

The agent should test business rules, not only visual rendering.

Minimum scenarios:

### Customer

- Create customer
- Create second customer with same mobile
- Search shared mobile
- Edit customer

### Tasks

- Create task
- Change status
- Schedule task
- Reschedule task
- Mark ready
- Mark delivered
- Cancel task

### Payments

- No payment
- Partial payment
- Full payment
- Invalid negative payment
- Payment greater than billing

### Dates

- Scheduled today
- Scheduled future
- Overdue
- Delivered overdue task
- Cancelled overdue task

### Activity

- Task creation produces activity
- Status change produces activity
- Payment produces activity
- Customer creation produces activity

### Backup

- Backup
- Restore
- Verify restored data

---

# 74\. Important Test Case: Shared Mobile

This must explicitly pass:

```
Customer 1:
Father
Mobile: 9999999999

Customer 2:
Son
Mobile: 9999999999

Customer 3:
Daughter
Mobile: 9999999999
```

All three must exist independently.

Their tasks must remain independently associated:

```
Father → PAN task

Son → Exam Form

Daughter → Bank task
```

Searching `9999999999` must return all three.

---

# 75\. Important Test Case: Service Price Change

Create:

```
PAN Correction
Default ₹150
```

Create task:

```
Task A
₹150
```

Change service:

```
Default ₹200
```

Create:

```
Task B
₹200
```

Expected:

```
Task A = ₹150
Task B = ₹200
```

---

# 76\. Important Test Case: Partial Payment

Task:

```
Billing ₹500
```

Payment:

```
₹200
```

Expected:

```
Paid ₹200
Due ₹300
Status Partially Paid
```

Then add:

```
₹300
```

Expected:

```
Paid ₹500
Due ₹0
Status Paid
```

---

# 77\. Important Test Case: Overdue

Task:

```
Target = yesterday
Status = Processing
```

Expected:

```
Overdue
```

but:

```
Status remains Processing
```

The system must not automatically change the workflow status.

---

# 78\. Important Test Case: Delivered

Task:

```
Status = Delivered
Target = yesterday
```

Expected:

```
Not counted as active overdue work
```

It remains available in:

```
Tasks → Delivered
```

---

# 79\. Dashboard Rules

Dashboard counts must be derived from actual task data.

For example:

```
Pending count =
tasks where status = PENDING

Processing count =
tasks where status = PROCESSING

Ready count =
tasks where status = READY
```

Do not maintain separate manually updated counters.

---

# 80\. Calendar Rules

Scheduled task:

```
scheduled_at
```

Activity:

```
activity.created_at
```

These must not be confused.

If a task was scheduled for Monday but status changed on Tuesday:

Monday calendar:

```
Scheduled task
```

Tuesday calendar:

```
Status changed
```

---

# 81\. Payments Page

Recommended layout:

```
Payments

Today
₹2,450

Outstanding
₹8,300

Transactions
--------------------------------
Customer | Task | Paid | Date
```

Allow filtering by date.

The payment page is a convenience/reporting view, not the source of truth.

The task/payment database remains the source.

---

# 82\. No Accounting Overreach

Do not build:

- GST accounting
- Ledger
- Tax invoices
- Expenses
- Profit/loss
- Inventory

unless specifically requested later.

The current requirement is simple service billing/payment tracking.

---

# 83\. UI Consistency Rules

Use one design system throughout:

- Same buttons
- Same input styling
- Same spacing
- Same status colors
- Same modal behavior
- Same table/list patterns
- Same typography
- Same empty states
- Same notification/toast behavior

Do not let each previously generated screen look like it came from a different application.

---

# 84\. Status Colors

Suggested semantics:

```
Pending     → neutral/orange
Processing  → blue
Ready       → green/teal
Delivered   → muted/gray
Cancelled   → red
Overdue     → red warning
```

The exact colors can follow the existing design system.

Do not rely on color alone; always display the status text.

---

# 85\. Responsive Desktop Layout

Optimize primarily for normal Windows desktop/laptop resolutions.

The UI should handle reasonable resizing.

Don't design exclusively for a fixed 1920×1080 layout.

---

# 86\. Keyboard Usability

Because this is a shop-counter application, keyboard usage matters.

Useful shortcuts can include:

```
Ctrl/Cmd + K → Search
Ctrl/Cmd + N → New Task
Esc → Close modal
Enter → Submit focused form
```

Exact shortcuts can follow the framework/platform.

Do not make keyboard shortcuts mandatory for every action.

---

# 87\. No Unnecessary Login

This is a single local shop application.

Do not add authentication unless specifically required later.

Opening the application should take the operator directly to the dashboard.

---

# 88\. No Cloud Sync

Do not add cloud synchronization.

Do not require:

```
Firebase
Supabase
AWS
Remote PostgreSQL
```

for normal operation.

Local SQLite is the source of truth.

---

# 89\. Internet Access

The application should not make unnecessary external network requests.

If a future feature requires external services, isolate that functionality.

Core customer/task/payment functionality must remain local.

---

# 90\. Logging

Maintain technical application logs where useful for debugging.

But:

- Don't log sensitive customer data.
- Don't log full database records.
- Don't log passwords because there should be no password system in MVP.
- Don't expose stack traces to normal users.

---

# 91\. Seed Data / First Run

On first installation, optionally provide sample service templates such as:

```
PAN Card Service
Aadhaar Service
Bank Linking
Online Form
Result Download
```

But make clear that these are examples and can be edited/deleted.

Do not hard-code them as immutable business logic.

---

# 92\. First-Run Experience

If there is no data:

```
Welcome

Set up your shop

Shop Name
Phone

[Continue]
```

Then optionally:

```
Add your first services
```

But avoid forcing a long setup wizard.

The operator should be able to skip and start working.

---

# 93\. Accessibility / Usability

Use:

- Clear labels
- Adequate click targets
- Visible focus states
- Keyboard navigation
- Readable font sizes
- No critical information conveyed only through color

---

# 94\. What the Agent Must NOT Do

Do not:

- Make mobile number unique.
- Store all data in localStorage if a proper database is available.
- Put business rules directly into UI components.
- Duplicate customer data into tasks unnecessarily.
- Delete historical tasks automatically.
- Automatically change status because a target date passed.
- Treat "Completed" and "Delivered" as separate normal statuses.
- Make payment status manually editable.
- Make service template prices overwrite old tasks.
- Add file attachments.
- Add cloud dependency.
- Add unnecessary authentication.
- Create a giant dashboard with irrelevant charts.
- Create separate pages for every tiny feature.
- Keep inconsistent status names.
- Continue patching broken architecture with one-off conditions.

---

# 95\. Definition of Done

The redesign/refactor is complete only when the following are true.

### Customers

- [ ] Customers can be created.
- [ ] Customers can be edited.
- [ ] Customers can be searched.
- [ ] Multiple customers can share one mobile number.
- [ ] Customer history works.

### Services

- [ ] Services can be created.
- [ ] Services can be edited.
- [ ] Services can be deactivated.
- [ ] Default prices work.
- [ ] Historical task prices don't change.

### Tasks

- [ ] Tasks can be created.
- [ ] Customer selection works.
- [ ] Service selection works.
- [ ] Status workflow works.
- [ ] Scheduling works.
- [ ] Target dates work.
- [ ] Notes work.
- [ ] Search/filter works.
- [ ] Delivered tasks remain in history.

### Payments

- [ ] Unpaid works.
- [ ] Partial payment works.
- [ ] Full payment works.
- [ ] Due amount is correct.
- [ ] Payment status is derived.
- [ ] Payment activity is recorded.

### Dashboard

- [ ] Pending count works.
- [ ] Processing count works.
- [ ] Ready count works.
- [ ] Overdue count works.
- [ ] Today's schedule works.
- [ ] Active work is clearly separated from completed history.

### Calendar

- [ ] Scheduled tasks appear on correct date.
- [ ] Activities appear on correct date.
- [ ] Scheduled work and activity history are distinct.

### Local data

- [ ] SQLite/local database works.
- [ ] App works without internet.
- [ ] Backup works.
- [ ] Restore works.
- [ ] Data export works where implemented.

### Architecture

- [ ] Business logic is centralized.
- [ ] Database access is separated from UI.
- [ ] No mobile uniqueness constraint.
- [ ] No contradictory duplicate status systems.
- [ ] No duplicated business rules across screens.
- [ ] Existing data is preserved/migrated safely.

---

# 96\. Implementation Order for the AI Agent

Do **not** continue building random screens.

Use this order.

### Phase 1 — Audit

Inspect the entire existing project.

Document:

- Current stack
- Current pages
- Current components
- Current DB
- Current schema
- Current state management
- Current routing
- Current persistence
- Existing problems

Do not modify anything yet.

---

### Phase 2 — Domain/data redesign

Establish the correct:

```
Customer
Service
Task
Payment
Activity
Settings
```

models.

Fix database constraints.

Especially:

> Mobile number must not be unique.

---

### Phase 3 — Business logic

Centralize:

- Task status transitions
- Payment calculation
- Overdue calculation
- Customer search
- Service pricing
- Activity generation
- Scheduling

---

### Phase 4 — Core UI

Refactor into:

```
Dashboard
Customers
Tasks
Calendar
Payments
Settings
```

---

### Phase 5 — Existing data migration

If existing data exists:

- Back it up.
- Migrate.
- Validate.
- Do not destroy data.

---

### Phase 6 — Testing

Test the workflows listed in this document.

Especially:

> Multiple people sharing one mobile number.

---

### Phase 7 — UX polish

Only after the architecture and workflows work:

- spacing
- colors
- animations
- empty states
- keyboard shortcuts
- visual polish
- loading states
- confirmation dialogs
