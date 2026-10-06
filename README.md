# Zeno Books ERP & Accounting Platform

A multi-tenant SaaS Enterprise Resource Planning (ERP) and Accounting platform covering **Procure-to-Pay, Sales, Accounting, Inventory, and Light Manufacturing (BOM Assembly)**.

---

## 🏛️ Project Architecture

The repository is structured into two main applications:

| Component | Path | Framework | Default Port | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | [`zeno-api/`](./zeno-api/) | NestJS 11 + TypeORM + PostgreSQL | `http://localhost:4000` | REST API, Swagger docs, JWT auth, double-entry ledger |
| **Frontend UI** | [`zeno-web/`](./zeno-web/) | Angular 21 + PrimeNG | `http://localhost:4200` | Enterprise dashboard, standalone components, reactive forms |
| **Database** | [`docker-compose.yml`](./docker-compose.yml) | PostgreSQL 17 + Redis 7 | Ports `5434` / `5432` | Tenant isolated database & caching |

---

## 🚀 How to Run the Project

### 1. Prerequisites
- **Node.js**: v20+ or v22+
- **PostgreSQL**: Either running via Docker Desktop or a local PostgreSQL service
- **npm**

---

### 2. Start the Database

#### Option A: Using Docker (Recommended)
Make sure Docker Desktop is running, then execute from the root directory:
```bash
docker compose up -d postgres redis
```

> **Note on Ports**: Check your [`zeno-api/.env`](./zeno-api/.env) to ensure the `DB_PORT` matches your PostgreSQL port (e.g. `5433`, `5432`, or `5434`).

#### Option B: Local PostgreSQL
If you have PostgreSQL installed locally on Windows:
1. Ensure the PostgreSQL service is running.
2. Create the database `zeno_books` if it doesn't already exist.
3. Update [`zeno-api/.env`](./zeno-api/.env) with your local database credentials:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=5432       # Or your configured PostgreSQL port (e.g., 5433)
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_NAME=zeno_books
   DB_SYNCHRONIZE=true
   ```

---

### 3. Start the Backend API (`zeno-api`)

Open a terminal and run:
```bash
# Option 1: From the root directory
npm run dev:api

# Option 2: Directly inside zeno-api
cd zeno-api
npm run start:dev
```

- **Backend URL**: [http://localhost:4000](http://localhost:4000)
- **Swagger API Documentation**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

### 4. Start the Frontend Web App (`zeno-web`)

Open a second terminal and run:
```bash
# Option 1: From the root directory
npm run dev:web

# Option 2: Directly inside zeno-web
cd zeno-web
npm start
```

- **Frontend URL**: [http://localhost:4200](http://localhost:4200)

---

## 🔑 Authentication & First-Time Setup

1. Open [http://localhost:4200](http://localhost:4200) in your browser.
2. Click **Register** or go to the signup flow:
   - Provide your details (Company Name, GSTIN, State, Email, Password).
   - In development mode, the OTP is returned in the API response (`devOtp`) for instant verification.
3. Upon OTP verification, the system **automatically provisions**:
   - Tenant & Company hierarchy
   - Default Branch & Godown
   - Standard Tally-style Ledger Groups
   - Default Units (NOS, KG, etc.)
4. Log in and navigate through the modules:
   - **Procure-to-Pay**: Purchase Orders, GRNs, Invoices, Payments
   - **Masters**: Items, Ledgers, Units, Godowns
   - **Settings**: Feature toggles, GST levels, Accounting preferences
