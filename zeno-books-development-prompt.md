# Zeno Books: Development Prompt

Paste everything below the line into Claude Code, Cursor, or any AI coding tool.

---

You are a senior enterprise software architect and full-stack engineer. Build **Zeno Books**, a multi-tenant SaaS application for small businesses covering Accounting, Inventory, Sales, Purchase and Manufacturing (assembly via Bill of Material). Work phase by phase and do not skip the architecture step.

## 1. Tech Stack

- **Frontend:** Angular (latest LTS), standalone components, Angular Material or PrimeNG, RxJS + Signals, lazy-loaded feature modules, reactive forms.
- **Backend (assumption, change if needed):** NestJS (TypeScript) REST API with OpenAPI/Swagger docs.
- **Database:** PostgreSQL with migrations (TypeORM or Prisma).
- **Auth:** JWT access token + rotating refresh token, argon2/bcrypt password hashing.
- **Cache/queue (optional):** Redis for sessions, rate limiting and OTP expiry; BullMQ for email/PDF/export jobs.
- **Deployment:** Docker + docker-compose for local; environment-based configuration.

## 2. Architecture Requirements

- **Multi-tenant:** shared database with `tenant_id` on every business table, enforced with PostgreSQL Row Level Security plus a tenant guard in the API. No query may run without tenant context.
- **Hierarchy:** Tenant > Company > Branch > Godown > Rack/Bin.
- **Security:** OWASP Top 10, DTO input validation, parameterized queries, rate limiting on auth/OTP endpoints, CORS, helmet, and an audit log (who/what/when/old-new value) for all transactions and master changes.
- **Concurrency (multi-user at the same time):**
  - Optimistic locking (version column) on documents.
  - Voucher number generation must be gap-safe and race-free (per tenant/company/branch/voucher type/financial year sequence with row lock).
  - Stock updates run inside DB transactions to prevent negative or double-posted stock.
- **Accounting integrity:** true double-entry. Every transaction posts balanced debit/credit lines into a ledger-entry table inside the same DB transaction as the document. Posted documents are never hard-deleted; use cancel/reverse.
- **Stock integrity:** a stock-ledger table (item, variant, godown, rack/bin, qty in/out, rate, source document). Stock balance is derived or maintained transactionally.
- **Clean layered architecture:** controller > service > repository, domain modules per feature, shared kernel for common code. Provide an ER diagram and module diagram first.
- Soft delete, `created_by`/`updated_by` and timestamps on all tables.
- Pagination, server-side filtering/sorting, and export (Excel/CSV/PDF) on all list pages.
- **UI/UX:** clean, enterprise-grade, responsive, keyboard-friendly data entry (Tab/Enter navigation in line items), inline validation, consistent list > create > view pattern, loading/empty/error states, light/dark theme ready.

## 3. Core System Features

1. **Email OTP signup:** register > email OTP verification > tenant/company creation. OTP has expiry, attempt limit and resend cooldown.
2. **Forgot password** via email OTP > reset password.
3. **Multi-branch and multi-godown:** every transaction is tagged to a branch and godown.
4. **Role-based access control:** users create custom roles and assign permissions per Master / Transaction / Report with actions: View, Create, Edit, Delete, Print, Export. Enforce on both API (guards) and UI (hide menus/buttons). A user can have access to selected branches.
5. **Admin / Settings panel:**
   - Company profile, financial year, voucher numbering configuration.
   - Feature/module toggles: GST, Purchase Order, GRN, Variants, Rack/Bin, Manufacturing, etc. When a feature is OFF, hide all its menus, fields and validations.
   - GST level configuration: Company / Item Group / Category / Item (only ONE level active per company).
   - Tax (GST) master creation.
   - Default ledger mapping: sales, purchase, inventory, CGST/SGST/IGST/Cess (output and input), discount, round-off, cash, etc.
   - Invoice/print templates.
   - Users, roles, update profile.
6. Show **all menus** in navigation, but fully implement only Phase 1 (procure-to-pay). Unbuilt modules show a "Coming soon" page.

## 4. Masters

- **Ledger Group:** predefined Tally-style groups (Capital, Current Assets, Current Liabilities, Sundry Debtors, Sundry Creditors, Bank Accounts, Cash-in-Hand, Duties & Taxes, Direct/Indirect Income & Expenses, Sales, Purchase, etc.). Predefined groups can be renamed but NOT deleted. Users can create custom groups with parent/child hierarchy. Each group has a nature (Asset/Liability/Income/Expense) and a flag identifying vendor (creditor) / customer (debtor) groups.
- **Ledger:** predefined ledgers (Cash, Discount, Round Off, Sales, Purchase, Inventory; Output/Input CGST, SGST, IGST, Cess only when GST is enabled). Renamable, not deletable. Users can create ledgers with opening balance, GSTIN, address, credit limit/days.
- **Item Group** (can hold GST if GST level = group), **Item Category** (linked to item group), **Item**.
- **Item master page tabs:** Basic, Sales/Purchase, Image, Description. Fields include HSN/SAC, unit, tax, purchase/sale rate, reorder level, variant flag.
- **Unit:** decimal places allowed per unit (e.g., Nos = 0, Kg = 3).
- **Variant master** (only if Variant feature is enabled).
- **Rack/Bin** under Godown (only if Rack/Bin feature is enabled).
- Seed all predefined data automatically on tenant creation.

## 5. Phase 1: Procure-to-Pay (Build Fully)

Each document has a List page (filter by status, search, export, pagination), a Create/Edit form, and a View/Print page.

### Purchase Order (feature-toggle controlled)
- **Header:** voucher no (per configuration), order date (default today, editable), vendor (ledgers from vendor/creditor groups only).
- **Lines:** S.No, item (search), qty, unit, rate, amount, action. Tax/discount calculation if GST is enabled.
- **Status:** Pending, Partially Cleared, Cleared, Cancelled.
- **Rule:** cannot edit, delete or cancel once linked to any GRN.

### Goods Receipt Note (feature-toggle controlled)
- **Header:** voucher no, GRN date, vendor.
- On vendor selection, show that vendor's pending POs in a searchable modal. Multiple POs can be pulled into one GRN; PO balance qty is tracked.
- **Lines:** S.No, item, qty, unit, rate, amount, action. Posts stock IN to the selected godown/rack.
- **Status:** Pending, Partially Cleared, Cleared.
- **Rule:** cannot edit, delete or cancel once linked to any purchase invoice.

### Purchase Invoice
- **Header:** voucher no, date, purchase type (Goods/Service), vendor, vendor bill no, vendor bill date.
- Vendor selection shows pending GRNs in a searchable modal; multiple GRNs can go into one invoice. Lines auto-load from the GRNs: S.No, item, ordered qty, received qty, variant, unit, rate, amount, action.
- If the item has variants (and the feature is enabled), the variant column opens a modal to select by scan, search or manual multi-select.
- Manual discount allowed; GST (CGST/SGST vs IGST decided by place of supply), round-off, and default ledger mapping used for posting.
- Direct purchase invoice without GRN must also work when GRN is disabled.
- **Accounting entry:** Dr Purchase/Inventory + Dr Input GST, Cr Vendor.
- **List page:** status (Pending, Partially Paid, Paid), search, export. Select invoice(s) and click "Make Payment" to go to Vendor Payment with all data auto-filled.
- **Rule:** cannot edit, delete or cancel once any payment is made against it.

### Purchase Return
Same structure as Purchase Invoice, referencing the original invoice; reverses stock and accounting.

### Vendor Payment
- Select vendor > pending bills listed; search; select multiple bills; allocate amount per bill (partial allowed); mode Cash/Bank; manual discount; advance payment support.
- **Accounting entry:** Dr Vendor, Cr Cash/Bank (and discount ledger).
- List page with status, search, export.

## 6. Later Phases (menus only, but design the schema so they fit)

- **Sales:** Quotation, Order, Invoice, Return, Customer Receipt
- **Accounting:** Payment, Receipt, Journal, Debit Note, Credit Note, Cheque Book, Contra (deposit/withdrawal)
- **Inventory:** Stock Adjustment, Stock Transfer, Price List
- **Manufacturing:** Bill of Material, Production Entry (consumes components, produces finished goods)
- **Reports:** Ledger, Trial Balance, P&L, Balance Sheet, Stock Summary, Outstanding, GST reports

## 7. Delivery Plan (follow in order; stop and summarize after each step)

1. Architecture document: folder structure, ER diagram (tables, keys, indexes), RLS strategy, permission model, voucher numbering design, posting rules.
2. Project scaffolding (Angular + NestJS + PostgreSQL + Docker), CI lint/test config.
3. Auth: signup with email OTP, login, forgot password, tenant provisioning and seed data.
4. RBAC and Settings panel (feature toggles, GST level, default ledger mapping).
5. Masters (ledger group, ledger, unit, item group, category, item, variant, rack/bin).
6. Purchase Order > GRN > Purchase Invoice > Purchase Return > Vendor Payment.
7. Print templates, exports, audit log, basic reports for the procure-to-pay cycle.
8. Tests: unit tests for posting and stock logic, e2e tests for the full procure-to-pay flow, concurrency tests for voucher numbering.

## 8. Working Rules

- Ask me before assuming anything that affects accounting or tax logic; list any other assumptions at the end of each step.
- Provide complete, runnable code, not pseudocode. Include DB migrations, DTO validation and error handling.
- Follow Indian GST conventions (HSN/SAC, CGST+SGST for intra-state, IGST for inter-state, Cess, place of supply; reverse charge as a later enhancement).
- Keep the code modular so features can be switched on/off per tenant without code changes.
