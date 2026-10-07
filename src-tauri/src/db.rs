use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use chrono;

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Customer {
    pub id: String,
    pub name: String,
    pub mobile: Option<String>,
    pub note: Option<String>,
    pub aadhaar_number: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub is_active: Option<bool>,
    pub is_verified: Option<bool>,
    pub avatar_initials: Option<String>,
    pub avatar_color: Option<String>,
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Service {
    pub id: String,
    pub name: String,
    pub default_price: Option<i64>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    pub customer_id: String,
    pub service_id: Option<String>,
    pub title: String,
    pub status: String,
    pub scheduled_date: Option<String>,
    pub scheduled_time: Option<String>,
    pub target_date: Option<String>,
    pub notes: Option<String>,
    pub billing_amount: Option<i64>,
    pub cancellation_reason: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub completed_at: Option<String>,
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Payment {
    pub id: String,
    pub task_id: String,
    pub amount: i64,
    pub created_at: String,
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ActivityEvent {
    pub id: String,
    pub activity_type: String,
    pub title: String,
    pub description: String,
    pub task_id: Option<String>,
    pub customer_id: Option<String>,
    pub created_at: String,
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Setting {
    pub key: String,
    pub value: String,
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BankingTransaction {
    pub id: Option<i64>,
    pub customer_id: String,
    pub transaction_type: String,
    pub payment_mode: String,
    pub amount: i64,
    pub transaction_ref_no: Option<String>,
    pub metadata: Option<String>,
    pub transaction_date: String,
    pub is_deleted: bool,
}

pub struct Database {
    pub conn: Mutex<Connection>,
    pub app_dir: PathBuf,
    pub db_path: PathBuf,
}

impl Database {
    pub fn get_conn(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.conn.lock().unwrap_or_else(|e| e.into_inner())
    }

    pub fn new(app_dir: PathBuf) -> std::result::Result<Self, String> {
        if !app_dir.exists() {
            fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create app data directory: {}", e))?;
        }
        let backup_dir = app_dir.join("backups");
        if !backup_dir.exists() {
            let _ = fs::create_dir_all(&backup_dir);
        }

        let db_path = app_dir.join("desklog.db");
        let conn = Connection::open(&db_path).map_err(|e| format!("Failed to open database: {}", e))?;
        
        // Enable SQLite WAL (Write-Ahead Logging) mode and performance pragmas
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA foreign_keys = ON;"
        ).map_err(|e| format!("Failed to set database PRAGMAs: {}", e))?;

        let db = Database { conn: Mutex::new(conn), app_dir, db_path };
        db.init_tables().map_err(|e| format!("Failed to initialize database tables: {}", e))?;
        Ok(db)
    }

    pub fn init_tables(&self) -> Result<()> {
        let conn = self.get_conn();

        // MIGRATION: Check if old customers table exists and needs migration
        let mut old_customers_exist = false;
        if let Ok(mut stmt) = conn.prepare("PRAGMA table_info(customers)") {
            if let Ok(rows) = stmt.query_map([], |row| {
                let name: String = row.get(1)?;
                Ok(name)
            }) {
                for col in rows.flatten() {
                    if col == "phone" {
                        old_customers_exist = true;
                        break;
                    }
                }
            }
        }
        
        if old_customers_exist {
            conn.execute_batch(
                "ALTER TABLE customers RENAME TO old_customers;
                 ALTER TABLE tasks RENAME TO old_tasks;
                 ALTER TABLE activities RENAME TO old_activities;"
            )?;
        }

        conn.execute(
            "CREATE TABLE IF NOT EXISTS customers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                mobile TEXT,
                note TEXT,
            aadhaar_number TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                is_verified INTEGER DEFAULT 0,
                avatar_initials TEXT,
                avatar_color TEXT
            );",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS services (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                default_price INTEGER,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL,
                service_id TEXT,
                title TEXT NOT NULL,
                status TEXT NOT NULL,
                scheduled_date TEXT,
                scheduled_time TEXT,
                target_date TEXT,
                notes TEXT,
                billing_amount INTEGER,
                cancellation_reason TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                completed_at TEXT,
                FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE SET NULL
            );",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS payments (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                amount INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS activities (
                id TEXT PRIMARY KEY,
                activity_type TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                task_id TEXT,
                customer_id TEXT,
                created_at TEXT NOT NULL
            );",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS banking_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id TEXT NOT NULL,
                transaction_type TEXT NOT NULL,
                payment_mode TEXT NOT NULL,
                amount REAL NOT NULL,
                transaction_ref_no TEXT,
                metadata TEXT,
                transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_deleted BOOLEAN DEFAULT 0,
                FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
            );",
            [],
        )?;

        // Ensure new columns exist on existing tables if upgraded
        let _ = conn.execute("ALTER TABLE customers ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;", []);
        let _ = conn.execute("ALTER TABLE tasks ADD COLUMN cancellation_reason TEXT;", []);

        // MANDATORY DATABASE INDEXES 
        conn.execute("CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_customer_id ON tasks(customer_id);", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_target_date ON tasks(target_date);", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_payments_task_id ON payments(task_id);", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_banking_transactions_customer_id ON banking_transactions(customer_id);", [])?;

        if old_customers_exist {
            conn.execute(
                "INSERT INTO customers (id, name, mobile, note, created_at, updated_at, is_active, is_verified, avatar_initials, avatar_color)
                 SELECT id, name, phone, notes, registered_date, registered_date, 1, is_verified, avatar_initials, avatar_color FROM old_customers",
                []
            )?;
            conn.execute(
                "INSERT INTO tasks (id, customer_id, title, status, scheduled_date, target_date, notes, billing_amount, created_at, updated_at)
                 SELECT id, customer_id, title, UPPER(status), schedule_date, target_date, notes, billing_amount, created_date, COALESCE(updated_date, created_date) FROM old_tasks",
                []
            )?;
            conn.execute(
                "INSERT INTO payments (id, task_id, amount, created_at)
                 SELECT id || '-pay', id, amount_paid, COALESCE(billing_date, created_date) FROM old_tasks WHERE amount_paid IS NOT NULL AND amount_paid > 0",
                []
            )?;
        }

        self.ensure_general_customer(&conn)?;
        self.ensure_default_services(&conn)?;

        Ok(())
    }

    fn ensure_general_customer(&self, conn: &Connection) -> Result<()> {
        let general_id = "cust-general";
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM customers WHERE id = ?1;",
            params![general_id],
            |row| row.get(0),
        )?;

        if count == 0 {
            let gen_name = "General / Walk-in Client";
            let gen_date = chrono::Local::now().to_rfc3339();
            let gen_notes = "Default profile for one-off walk-in customers and quick desk services.";
            let gen_initials = "GW";
            let gen_color = "bg-surface-container text-on-surface-variant";

            conn.execute(
                "INSERT INTO customers (id, name, mobile, note, created_at, updated_at, is_active, is_verified, avatar_initials, avatar_color)
                 VALUES (?1, ?2, NULL, ?3, ?4, ?4, 1, 0, ?5, ?6);",
                params![general_id, gen_name, gen_notes, gen_date, gen_initials, gen_color],
            )?;
        }
        Ok(())
    }

    fn ensure_default_services(&self, conn: &Connection) -> Result<()> {
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM services;", [], |row| row.get(0))?;
        if count == 0 {
            let now = chrono::Local::now().to_rfc3339();
            let default_services = vec![
                ("svc-pan", "PAN Card Application / Correction", 15000), // ₹150
                ("svc-aadhaar", "Aadhaar Update / Linkage", 10000),        // ₹100
                ("svc-bank", "Bank Account Linking / KYC", 10000),        // ₹100
                ("svc-exam", "Online Exam / Form Fillup", 20000),         // ₹200
                ("svc-result", "Result / Admit Card Download", 3000),     // ₹30
            ];

            for (id, name, price) in default_services {
                conn.execute(
                    "INSERT INTO services (id, name, default_price, is_active, created_at, updated_at)
                     VALUES (?1, ?2, ?3, 1, ?4, ?4);",
                    params![id, name, price, now],
                )?;
            }
        }
        Ok(())
    }

    pub fn fetch_customers(&self) -> Result<Vec<Customer>> {
        let conn = self.get_conn();
        let general_id = "cust-general";
        let mut stmt = conn.prepare_cached("SELECT id, name, mobile, note, created_at, updated_at, is_active, is_verified, avatar_initials, avatar_color, aadhaar_number FROM customers WHERE is_active = 1 ORDER BY CASE WHEN id = ?1 THEN 1 ELSE 0 END, name ASC;")?;

        let customer_iter = stmt.query_map(params![general_id], |row| {
            let is_active_int: Option<i32> = row.get(6)?;
            let is_verified_int: Option<i32> = row.get(7)?;
            Ok(Customer {
                id: row.get(0)?,
                name: row.get(1)?,
                mobile: row.get(2)?,
                note: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                is_active: is_active_int.map(|v| v != 0),
                is_verified: is_verified_int.map(|v| v != 0),
                avatar_initials: row.get(8)?,
                avatar_color: row.get(9)?,
                aadhaar_number: row.get(10)?,
            })
        })?;

        let mut customers = Vec::new();
        for c in customer_iter {
            customers.push(c?);
        }
        Ok(customers)
    }

    pub fn insert_customer(&self, customer: &Customer) -> Result<()> {
        if customer.name.trim().is_empty() {
            return Err(rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CONSTRAINT),
                Some("Customer name cannot be empty".to_string()),
            ));
        }
        let conn = self.get_conn();
        let is_active_int = if customer.is_active.unwrap_or(true) { 1 } else { 0 };
        let is_verified_int = customer.is_verified.map(|v| if v { 1 } else { 0 });
        conn.execute(
            "INSERT INTO customers (id, name, mobile, note, created_at, updated_at, is_active, is_verified, avatar_initials, avatar_color, aadhaar_number)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11);",
            params![
                customer.id,
                customer.name,
                customer.mobile,
                customer.note,
                customer.created_at,
                customer.updated_at,
                is_active_int,
                is_verified_int,
                customer.avatar_initials,
                customer.avatar_color,
                customer.aadhaar_number
            ],
        )?;
        Ok(())
    }

    pub fn update_customer(&self, id: &str, name: &str, mobile: Option<&str>, note: Option<&str>, aadhaar_number: Option<&str>) -> Result<()> {
        let conn = self.get_conn();
        let updated_at = chrono::Local::now().to_rfc3339();
        conn.execute(
            "UPDATE customers SET name = ?1, mobile = ?2, note = ?3, aadhaar_number = ?4, updated_at = ?5 WHERE id = ?6;",
            params![name, mobile, note, aadhaar_number, updated_at, id],
        )?;
        Ok(())
    }

    pub fn delete_customer(&self, id: &str) -> Result<()> {
        if id == "cust-general" {
            return Ok(()); // Guard: Never delete default Walk-in profile
        }
        let conn = self.get_conn();
        // Soft delete customer to preserve task history
        conn.execute("UPDATE customers SET is_active = 0 WHERE id = ?1;", params![id])?;
        Ok(())
    }

    pub fn fetch_tasks(&self) -> Result<Vec<Task>> {
        let conn = self.get_conn();
        let mut stmt = conn.prepare_cached("SELECT id, customer_id, service_id, title, status, scheduled_date, scheduled_time, target_date, notes, billing_amount, cancellation_reason, created_at, updated_at, completed_at FROM tasks ORDER BY rowid DESC;")?;
        let task_iter = stmt.query_map([], |row| {
            Ok(Task {
                id: row.get(0)?,
                customer_id: row.get(1)?,
                service_id: row.get(2)?,
                title: row.get(3)?,
                status: row.get(4)?,
                scheduled_date: row.get(5)?,
                scheduled_time: row.get(6)?,
                target_date: row.get(7)?,
                notes: row.get(8)?,
                billing_amount: row.get(9)?,
                cancellation_reason: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
                completed_at: row.get(13)?,
            })
        })?;
        let mut tasks = Vec::new();
        for t in task_iter {
            tasks.push(t?);
        }
        Ok(tasks)
    }

    pub fn fetch_task_by_id(&self, id: &str) -> Result<Option<Task>> {
        let conn = self.get_conn();
        let mut stmt = conn.prepare_cached("SELECT id, customer_id, service_id, title, status, scheduled_date, scheduled_time, target_date, notes, billing_amount, cancellation_reason, created_at, updated_at, completed_at FROM tasks WHERE id = ?1;")?;
        let mut task_iter = stmt.query_map(params![id], |row| {
            Ok(Task {
                id: row.get(0)?,
                customer_id: row.get(1)?,
                service_id: row.get(2)?,
                title: row.get(3)?,
                status: row.get(4)?,
                scheduled_date: row.get(5)?,
                scheduled_time: row.get(6)?,
                target_date: row.get(7)?,
                notes: row.get(8)?,
                billing_amount: row.get(9)?,
                cancellation_reason: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
                completed_at: row.get(13)?,
            })
        })?;
        if let Some(result) = task_iter.next() {
            Ok(Some(result?))
        } else {
            Ok(None)
        }
    }

    pub fn insert_task(&self, task: &Task) -> Result<()> {
        let conn = self.get_conn();
        conn.execute(
            "INSERT INTO tasks (id, customer_id, service_id, title, status, scheduled_date, scheduled_time, target_date, notes, billing_amount, cancellation_reason, created_at, updated_at, completed_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14);",
            params![
                task.id,
                task.customer_id,
                task.service_id,
                task.title,
                task.status,
                task.scheduled_date,
                task.scheduled_time,
                task.target_date,
                task.notes,
                task.billing_amount,
                task.cancellation_reason,
                task.created_at,
                task.updated_at,
                task.completed_at
            ],
        )?;
        Ok(())
    }

    pub fn update_task(&self, task: &Task) -> Result<()> {
        let conn = self.get_conn();
        let updated_at = chrono::Local::now().to_rfc3339();
        conn.execute(
            "UPDATE tasks SET service_id = ?1, title = ?2, status = ?3, scheduled_date = ?4, scheduled_time = ?5, target_date = ?6, notes = ?7, billing_amount = ?8, cancellation_reason = ?9, updated_at = ?10, completed_at = ?11 WHERE id = ?12;",
            params![
                task.service_id,
                task.title,
                task.status,
                task.scheduled_date,
                task.scheduled_time,
                task.target_date,
                task.notes,
                task.billing_amount,
                task.cancellation_reason,
                updated_at,
                task.completed_at,
                task.id
            ],
        )?;
        Ok(())
    }

    pub fn delete_task(&self, id: &str) -> Result<()> {
        let conn = self.get_conn();
        conn.execute("DELETE FROM tasks WHERE id = ?1;", params![id])?;
        Ok(())
    }

    pub fn fetch_services(&self) -> Result<Vec<Service>> {
        let conn = self.get_conn();
        let mut stmt = conn.prepare_cached("SELECT id, name, default_price, is_active, created_at, updated_at FROM services ORDER BY is_active DESC, name ASC;")?;
        let service_iter = stmt.query_map([], |row| {
            Ok(Service {
                id: row.get(0)?,
                name: row.get(1)?,
                default_price: row.get(2)?,
                is_active: row.get::<_, i32>(3)? != 0,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?;
        let mut services = Vec::new();
        for s in service_iter {
            services.push(s?);
        }
        Ok(services)
    }

    pub fn insert_service(&self, service: &Service) -> Result<()> {
        let conn = self.get_conn();
        conn.execute(
            "INSERT INTO services (id, name, default_price, is_active, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6);",
            params![service.id, service.name, service.default_price, if service.is_active {1} else {0}, service.created_at, service.updated_at],
        )?;
        Ok(())
    }

    pub fn update_service(&self, service: &Service) -> Result<()> {
        let conn = self.get_conn();
        let updated_at = chrono::Local::now().to_rfc3339();
        conn.execute(
            "UPDATE services SET name = ?1, default_price = ?2, is_active = ?3, updated_at = ?4 WHERE id = ?5;",
            params![service.name, service.default_price, if service.is_active {1} else {0}, updated_at, service.id],
        )?;
        Ok(())
    }

    pub fn delete_service(&self, id: &str) -> Result<()> {
        let conn = self.get_conn();
        conn.execute("UPDATE services SET is_active = 0 WHERE id = ?1;", params![id])?;
        Ok(())
    }

    pub fn fetch_payments(&self) -> Result<Vec<Payment>> {
        let conn = self.get_conn();
        let mut stmt = conn.prepare_cached("SELECT id, task_id, amount, created_at FROM payments ORDER BY rowid DESC;")?;
        let payment_iter = stmt.query_map([], |row| {
            Ok(Payment {
                id: row.get(0)?,
                task_id: row.get(1)?,
                amount: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?;
        let mut payments = Vec::new();
        for p in payment_iter {
            payments.push(p?);
        }
        Ok(payments)
    }

    pub fn insert_payment(&self, payment: &Payment) -> Result<()> {
        let conn = self.get_conn();
        conn.execute(
            "INSERT INTO payments (id, task_id, amount, created_at) VALUES (?1, ?2, ?3, ?4);",
            params![payment.id, payment.task_id, payment.amount, payment.created_at],
        )?;
        Ok(())
    }

    pub fn fetch_activities(&self) -> Result<Vec<ActivityEvent>> {
        let conn = self.get_conn();
        let mut stmt = conn.prepare_cached("SELECT id, activity_type, title, description, task_id, customer_id, created_at FROM activities ORDER BY rowid DESC;")?;
        let act_iter = stmt.query_map([], |row| {
            Ok(ActivityEvent {
                id: row.get(0)?,
                activity_type: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                task_id: row.get(4)?,
                customer_id: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;
        let mut activities = Vec::new();
        for a in act_iter {
            activities.push(a?);
        }
        Ok(activities)
    }

    pub fn insert_activity(&self, act: &ActivityEvent) -> Result<()> {
        let conn = self.get_conn();
        conn.execute(
            "INSERT INTO activities (id, activity_type, title, description, task_id, customer_id, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7);",
            params![act.id, act.activity_type, act.title, act.description, act.task_id, act.customer_id, act.created_at],
        )?;
        Ok(())
    }

    pub fn fetch_settings(&self) -> Result<Vec<Setting>> {
        let conn = self.get_conn();
        let mut stmt = conn.prepare_cached("SELECT key, value FROM settings;")?;
        let iter = stmt.query_map([], |row| {
            Ok(Setting {
                key: row.get(0)?,
                value: row.get(1)?,
            })
        })?;
        let mut settings = Vec::new();
        for s in iter {
            settings.push(s?);
        }
        Ok(settings)
    }

    pub fn save_setting(&self, key: &str, value: &str) -> Result<()> {
        let conn = self.get_conn();
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2;",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn fetch_banking_transactions(&self) -> Result<Vec<BankingTransaction>> {
        let conn = self.get_conn();
        let mut stmt = conn.prepare_cached("SELECT id, customer_id, transaction_type, payment_mode, amount, transaction_ref_no, metadata, transaction_date, is_deleted FROM banking_transactions WHERE is_deleted = 0 ORDER BY transaction_date DESC;")?;
        let iter = stmt.query_map([], |row| {
            let amount: i64 = match row.get::<_, i64>(4) {
                Ok(val) => val,
                Err(_) => {
                    let float_val: f64 = row.get(4)?;
                    (float_val * 100.0).round() as i64
                }
            };
            Ok(BankingTransaction {
                id: row.get(0)?,
                customer_id: row.get(1)?,
                transaction_type: row.get(2)?,
                payment_mode: row.get(3)?,
                amount,
                transaction_ref_no: row.get(5)?,
                metadata: row.get(6)?,
                transaction_date: row.get(7)?,
                is_deleted: row.get(8)?,
            })
        })?;
        let mut txs = Vec::new();
        for tx in iter {
            txs.push(tx?);
        }
        Ok(txs)
    }
    
    pub fn fetch_banking_transactions_for_customer(&self, customer_id: &str) -> Result<Vec<BankingTransaction>> {
        let conn = self.get_conn();
        let mut stmt = conn.prepare_cached("SELECT id, customer_id, transaction_type, payment_mode, amount, transaction_ref_no, metadata, transaction_date, is_deleted FROM banking_transactions WHERE customer_id = ?1 AND is_deleted = 0 ORDER BY transaction_date DESC;")?;
        let iter = stmt.query_map(params![customer_id], |row| {
            let amount: i64 = match row.get::<_, i64>(4) {
                Ok(val) => val,
                Err(_) => {
                    let float_val: f64 = row.get(4)?;
                    (float_val * 100.0).round() as i64
                }
            };
            Ok(BankingTransaction {
                id: row.get(0)?,
                customer_id: row.get(1)?,
                transaction_type: row.get(2)?,
                payment_mode: row.get(3)?,
                amount,
                transaction_ref_no: row.get(5)?,
                metadata: row.get(6)?,
                transaction_date: row.get(7)?,
                is_deleted: row.get(8)?,
            })
        })?;
        let mut txs = Vec::new();
        for tx in iter {
            txs.push(tx?);
        }
        Ok(txs)
    }

    pub fn insert_banking_transaction(&self, tx: &BankingTransaction) -> Result<BankingTransaction> {
        if tx.amount <= 0 {
            return Err(rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CONSTRAINT),
                Some("Transaction amount must be positive".to_string()),
            ));
        }
        if tx.customer_id.trim().is_empty() {
            return Err(rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CONSTRAINT),
                Some("Customer ID is required".to_string()),
            ));
        }
        let date = if tx.transaction_date.is_empty() {
            chrono::Local::now().to_rfc3339()
        } else {
            tx.transaction_date.clone()
        };
        let conn = self.get_conn();
        conn.execute(
            "INSERT INTO banking_transactions (customer_id, transaction_type, payment_mode, amount, transaction_ref_no, metadata, transaction_date, is_deleted)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0);",
            params![
                tx.customer_id,
                tx.transaction_type,
                tx.payment_mode,
                tx.amount,
                tx.transaction_ref_no,
                tx.metadata,
                date
            ],
        )?;
        let id = conn.last_insert_rowid();
        let mut inserted = tx.clone();
        inserted.id = Some(id);
        inserted.transaction_date = date;
        inserted.is_deleted = false;
        Ok(inserted)
    }

    pub fn delete_banking_transaction(&self, id: i64) -> Result<()> {
        let conn = self.get_conn();
        conn.execute("UPDATE banking_transactions SET is_deleted = 1 WHERE id = ?1;", params![id])?;
        Ok(())
    }

    pub fn create_backup(&self) -> Result<String> {
        let backup_dir = self.app_dir.join("backups");
        if !backup_dir.exists() {
            let _ = fs::create_dir_all(&backup_dir);
        }
        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
        let backup_filename = format!("desklog_backup_{}.db", timestamp);
        let backup_path = backup_dir.join(&backup_filename);

        let src_conn = self.get_conn();
        let mut dst_conn = Connection::open(&backup_path)?;
        let backup = rusqlite::backup::Backup::new(&*src_conn, &mut dst_conn)?;
        backup.step(-1)?;

        Ok(backup_path.to_string_lossy().to_string())
    }

    pub fn restore_backup(&self, backup_path_str: &str) -> Result<()> {
        let src_path = PathBuf::from(backup_path_str);
        if !src_path.exists() {
            return Err(rusqlite::Error::QueryReturnedNoRows);
        }

        // Validate that src_path is a valid SQLite database
        let src_conn = Connection::open(&src_path)?;
        let count: i64 = src_conn.query_row("SELECT COUNT(*) FROM customers;", [], |row| row.get(0))?;
        if count < 0 {
            return Err(rusqlite::Error::QueryReturnedNoRows);
        }

        // Create safety backup of current database first 
        let _ = self.create_backup();

        // Perform live online restore from src_conn directly into self.conn safely
        let mut dst_conn = self.get_conn();
        {
            let backup = rusqlite::backup::Backup::new(&src_conn, &mut *dst_conn)?;
            backup.step(-1)?;
        }

        // Re-apply performance & safety PRAGMAs to restored connection
        dst_conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA foreign_keys = ON;"
        )?;

        Ok(())
    }
}
