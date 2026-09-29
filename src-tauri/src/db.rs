use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Customer {
    pub id: String,
    pub name: String,
    pub phone: String,
    pub registeredDate: String,
    pub isVerified: Option<bool>,
    pub notes: Option<String>,
    pub avatarInitials: Option<String>,
    pub avatarColor: Option<String>,
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    pub customerId: String,
    pub customerName: String,
    pub customerPhone: String,
    pub title: String,
    pub status: String, // 'pending' | 'processing' | 'done'
    pub createdDate: String,
    pub updatedDate: Option<String>,
    pub targetDate: Option<String>,
    pub subStatus: Option<String>,
    pub notes: Option<String>,
    pub billingAmount: Option<i64>,
    pub amountPaid: Option<i64>,
    pub billingStatus: Option<String>,
    pub billingDate: Option<String>,
    pub scheduleDate: Option<String>,
}

#[allow(non_snake_case)]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ActivityEvent {
    pub id: String,
    pub time: String,
    pub timePeriod: String,
    #[serde(rename = "type")]
    pub activity_type: String,
    pub title: String,
    pub customerName: String,
    pub customerPhone: String,
    pub description: String,
    pub badgeText: String,
    pub status: String,
    pub taskId: Option<String>,
    pub date: Option<String>,
}

pub struct Database {
    db_path: PathBuf,
}

impl Database {
    pub fn new(app_dir: PathBuf) -> std::result::Result<Self, String> {
        if !app_dir.exists() {
            fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create app data directory: {}", e))?;
        }
        let db_path = app_dir.join("desklog.db");
        let db = Database { db_path };
        db.init_tables().map_err(|e| format!("Failed to initialize database tables: {}", e))?;
        Ok(db)
    }

    fn get_connection(&self) -> Result<Connection> {
        Connection::open(&self.db_path)
    }

    pub fn init_tables(&self) -> Result<()> {
        let conn = self.get_connection()?;

        conn.execute("PRAGMA foreign_keys = ON;", [])?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS customers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                registered_date TEXT NOT NULL,
                is_verified INTEGER,
                notes TEXT,
                avatar_initials TEXT,
                avatar_color TEXT
            );",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                title TEXT NOT NULL,
                status TEXT NOT NULL,
                created_date TEXT NOT NULL,
                updated_date TEXT,
                target_date TEXT,
                sub_status TEXT,
                notes TEXT,
                billing_amount INTEGER,
                amount_paid INTEGER,
                billing_status TEXT,
                billing_date TEXT,
                schedule_date TEXT
            );",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS activities (
                id TEXT PRIMARY KEY,
                time TEXT NOT NULL,
                time_period TEXT NOT NULL,
                activity_type TEXT NOT NULL,
                title TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                description TEXT NOT NULL,
                badge_text TEXT NOT NULL,
                status TEXT NOT NULL,
                task_id TEXT,
                date TEXT
            );",
            [],
        )?;

        // Always ensure General / Walk-in Customer exists in database
        self.ensure_general_customer(&conn)?;

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
            let gen_phone = "N/A";
            let gen_date = "System Default";
            let gen_notes = "Default profile for one-off walk-in customers and quick desk services.";
            let gen_initials = "GW";
            let gen_color = "bg-surface-container text-on-surface-variant";

            conn.execute(
                "INSERT INTO customers (id, name, phone, registered_date, is_verified, notes, avatar_initials, avatar_color)
                 VALUES (?1, ?2, ?3, ?4, 0, ?5, ?6, ?7);",
                params![general_id, gen_name, gen_phone, gen_date, gen_notes, gen_initials, gen_color],
            )?;
        }
        Ok(())
    }

    pub fn fetch_customers(&self) -> Result<Vec<Customer>> {
        let conn = self.get_connection()?;
        let general_id = "cust-general";
        let mut stmt = conn.prepare("SELECT id, name, phone, registered_date, is_verified, notes, avatar_initials, avatar_color FROM customers ORDER BY CASE WHEN id = ?1 THEN 1 ELSE 0 END, name ASC;")?;

        let customer_iter = stmt.query_map(params![general_id], |row| {
            let is_verified_int: Option<i32> = row.get(4)?;
            Ok(Customer {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                registeredDate: row.get(3)?,
                isVerified: is_verified_int.map(|v| v != 0),
                notes: row.get(5)?,
                avatarInitials: row.get(6)?,
                avatarColor: row.get(7)?,
            })
        })?;

        let mut customers = Vec::new();
        for c in customer_iter {
            customers.push(c?);
        }
        Ok(customers)
    }

    pub fn fetch_customers_paginated(&self, limit: u32, offset: u32) -> Result<Vec<Customer>> {
        let conn = self.get_connection()?;
        let general_id = "cust-general";
        let mut stmt = conn.prepare("SELECT id, name, phone, registered_date, is_verified, notes, avatar_initials, avatar_color FROM customers ORDER BY CASE WHEN id = ?1 THEN 1 ELSE 0 END, name ASC LIMIT ?2 OFFSET ?3;")?;

        let customer_iter = stmt.query_map(params![general_id, limit, offset], |row| {
            let is_verified_int: Option<i32> = row.get(4)?;
            Ok(Customer {
                id: row.get(0)?,
                name: row.get(1)?,
                phone: row.get(2)?,
                registeredDate: row.get(3)?,
                isVerified: is_verified_int.map(|v| v != 0),
                notes: row.get(5)?,
                avatarInitials: row.get(6)?,
                avatarColor: row.get(7)?,
            })
        })?;

        let mut customers = Vec::new();
        for c in customer_iter {
            customers.push(c?);
        }
        Ok(customers)
    }

    pub fn insert_customer(&self, customer: &Customer) -> Result<()> {
        let conn = self.get_connection()?;
        let is_verified_int = customer.isVerified.map(|v| if v { 1 } else { 0 });

        conn.execute(
            "INSERT INTO customers (id, name, phone, registered_date, is_verified, notes, avatar_initials, avatar_color)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8);",
            params![
                customer.id,
                customer.name,
                customer.phone,
                customer.registeredDate,
                is_verified_int,
                customer.notes,
                customer.avatarInitials,
                customer.avatarColor
            ],
        )?;
        Ok(())
    }

    pub fn update_customer(&self, id: &str, name: &str, phone: &str, notes: Option<&str>) -> Result<()> {
        let conn = self.get_connection()?;
        conn.execute(
            "UPDATE customers SET name = ?1, phone = ?2, notes = ?3 WHERE id = ?4;",
            params![name, phone, notes, id],
        )?;
        conn.execute(
            "UPDATE tasks SET customer_name = ?1, customer_phone = ?2 WHERE customer_id = ?3;",
            params![name, phone, id],
        )?;
        Ok(())
    }

    pub fn delete_customer(&self, id: &str) -> Result<()> {
        let conn = self.get_connection()?;
        conn.execute("DELETE FROM activities WHERE task_id IN (SELECT id FROM tasks WHERE customer_id = ?1);", params![id])?;
        conn.execute("DELETE FROM tasks WHERE customer_id = ?1;", params![id])?;
        conn.execute("DELETE FROM customers WHERE id = ?1;", params![id])?;
        Ok(())
    }

    pub fn fetch_tasks(&self) -> Result<Vec<Task>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare("SELECT id, customer_id, customer_name, customer_phone, title, status, created_date, updated_date, target_date, sub_status, notes, billing_amount, amount_paid, billing_status, billing_date, schedule_date FROM tasks ORDER BY rowid DESC;")?;

        let task_iter = stmt.query_map([], |row| {
            Ok(Task {
                id: row.get(0)?,
                customerId: row.get(1)?,
                customerName: row.get(2)?,
                customerPhone: row.get(3)?,
                title: row.get(4)?,
                status: row.get(5)?,
                createdDate: row.get(6)?,
                updatedDate: row.get(7)?,
                targetDate: row.get(8)?,
                subStatus: row.get(9)?,
                notes: row.get(10)?,
                billingAmount: row.get(11)?,
                amountPaid: row.get(12)?,
                billingStatus: row.get(13)?,
                billingDate: row.get(14)?,
                scheduleDate: row.get(15)?,
            })
        })?;

        let mut tasks = Vec::new();
        for t in task_iter {
            tasks.push(t?);
        }
        Ok(tasks)
    }

    pub fn fetch_tasks_paginated(&self, limit: u32, offset: u32) -> Result<Vec<Task>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare("SELECT id, customer_id, customer_name, customer_phone, title, status, created_date, updated_date, target_date, sub_status, notes, billing_amount, amount_paid, billing_status, billing_date, schedule_date FROM tasks ORDER BY rowid DESC LIMIT ?1 OFFSET ?2;")?;

        let task_iter = stmt.query_map(params![limit, offset], |row| {
            Ok(Task {
                id: row.get(0)?,
                customerId: row.get(1)?,
                customerName: row.get(2)?,
                customerPhone: row.get(3)?,
                title: row.get(4)?,
                status: row.get(5)?,
                createdDate: row.get(6)?,
                updatedDate: row.get(7)?,
                targetDate: row.get(8)?,
                subStatus: row.get(9)?,
                notes: row.get(10)?,
                billingAmount: row.get(11)?,
                amountPaid: row.get(12)?,
                billingStatus: row.get(13)?,
                billingDate: row.get(14)?,
                scheduleDate: row.get(15)?,
            })
        })?;

        let mut tasks = Vec::new();
        for t in task_iter {
            tasks.push(t?);
        }
        Ok(tasks)
    }

    pub fn insert_task(&self, task: &Task) -> Result<()> {
        let conn = self.get_connection()?;
        conn.execute(
            "INSERT INTO tasks (id, customer_id, customer_name, customer_phone, title, status, created_date, updated_date, target_date, sub_status, notes, billing_amount, amount_paid, billing_status, billing_date, schedule_date)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16);",
            params![
                task.id,
                task.customerId,
                task.customerName,
                task.customerPhone,
                task.title,
                task.status,
                task.createdDate,
                task.updatedDate,
                task.targetDate,
                task.subStatus,
                task.notes,
                task.billingAmount,
                task.amountPaid,
                task.billingStatus,
                task.billingDate,
                task.scheduleDate
            ],
        )?;
        Ok(())
    }

    pub fn update_task(&self, task: &Task) -> Result<()> {
        let conn = self.get_connection()?;
        conn.execute(
            "UPDATE tasks SET title = ?1, status = ?2, updated_date = ?3, target_date = ?4, sub_status = ?5, notes = ?6, billing_amount = ?7, amount_paid = ?8, billing_status = ?9, schedule_date = ?10 WHERE id = ?11;",
            params![
                task.title,
                task.status,
                task.updatedDate,
                task.targetDate,
                task.subStatus,
                task.notes,
                task.billingAmount,
                task.amountPaid,
                task.billingStatus,
                task.scheduleDate,
                task.id
            ],
        )?;
        Ok(())
    }

    pub fn update_task_status(&self, id: &str, status: &str, updated_date: &str, sub_status: Option<&str>) -> Result<()> {
        let conn = self.get_connection()?;
        conn.execute(
            "UPDATE tasks SET status = ?1, updated_date = ?2, sub_status = ?3 WHERE id = ?4;",
            params![status, updated_date, sub_status, id],
        )?;
        Ok(())
    }

    pub fn delete_task(&self, id: &str) -> Result<()> {
        let conn = self.get_connection()?;
        conn.execute("DELETE FROM activities WHERE task_id = ?1;", params![id])?;
        conn.execute("DELETE FROM tasks WHERE id = ?1;", params![id])?;
        Ok(())
    }

    pub fn fetch_activities(&self) -> Result<Vec<ActivityEvent>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare("SELECT id, time, time_period, activity_type, title, customer_name, customer_phone, description, badge_text, status, task_id, date FROM activities ORDER BY rowid DESC;")?;

        let act_iter = stmt.query_map([], |row| {
            Ok(ActivityEvent {
                id: row.get(0)?,
                time: row.get(1)?,
                timePeriod: row.get(2)?,
                activity_type: row.get(3)?,
                title: row.get(4)?,
                customerName: row.get(5)?,
                customerPhone: row.get(6)?,
                description: row.get(7)?,
                badgeText: row.get(8)?,
                status: row.get(9)?,
                taskId: row.get(10)?,
                date: row.get(11)?,
            })
        })?;

        let mut activities = Vec::new();
        for a in act_iter {
            activities.push(a?);
        }
        Ok(activities)
    }

    pub fn insert_activity(&self, act: &ActivityEvent) -> Result<()> {
        let conn = self.get_connection()?;
        conn.execute(
            "INSERT INTO activities (id, time, time_period, activity_type, title, customer_name, customer_phone, description, badge_text, status, task_id, date)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12);",
            params![
                act.id,
                act.time,
                act.timePeriod,
                act.activity_type,
                act.title,
                act.customerName,
                act.customerPhone,
                act.description,
                act.badgeText,
                act.status,
                act.taskId,
                act.date
            ],
        )?;
        Ok(())
    }
}
