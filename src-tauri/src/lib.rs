pub mod db;

use db::{ActivityEvent, BankingTransaction, Customer, Database, Payment, Service, Setting, Task};
use std::sync::Mutex;
use tauri::{Manager, State};
use tauri_plugin_notification::NotificationExt;

pub struct AppState {
    pub db: Mutex<Database>,
}

impl AppState {
    pub fn get_db(&self) -> std::sync::MutexGuard<'_, Database> {
        self.db.lock().unwrap_or_else(|e| e.into_inner())
    }
}

#[tauri::command]
fn get_customers(state: State<'_, AppState>) -> Result<Vec<Customer>, String> {
    state.get_db().fetch_customers().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_customer(customer: Customer, state: State<'_, AppState>) -> Result<Customer, String> {
    state.get_db().insert_customer(&customer).map_err(|e| e.to_string())?;
    Ok(customer)
}

#[tauri::command]
fn edit_customer(id: String, name: String, mobile: Option<String>, note: Option<String>, aadhaar_number: Option<String>, state: State<'_, AppState>) -> Result<(), String> {
    state.get_db().update_customer(&id, &name, mobile.as_deref(), note.as_deref(), aadhaar_number.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_customer(id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.get_db().delete_customer(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_tasks(state: State<'_, AppState>) -> Result<Vec<Task>, String> {
    state.get_db().fetch_tasks().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_task(id: String, state: State<'_, AppState>) -> Result<Option<Task>, String> {
    state.get_db().fetch_task_by_id(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_task(task: Task, state: State<'_, AppState>) -> Result<Task, String> {
    state.get_db().insert_task(&task).map_err(|e| e.to_string())?;
    Ok(task)
}

#[tauri::command]
fn edit_task(task: Task, state: State<'_, AppState>) -> Result<(), String> {
    state.get_db().update_task(&task).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_task(id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.get_db().delete_task(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_services(state: State<'_, AppState>) -> Result<Vec<Service>, String> {
    state.get_db().fetch_services().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_service(service: Service, state: State<'_, AppState>) -> Result<Service, String> {
    state.get_db().insert_service(&service).map_err(|e| e.to_string())?;
    Ok(service)
}

#[tauri::command]
fn edit_service(service: Service, state: State<'_, AppState>) -> Result<(), String> {
    state.get_db().update_service(&service).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_service(id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.get_db().delete_service(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_payments(state: State<'_, AppState>) -> Result<Vec<Payment>, String> {
    state.get_db().fetch_payments().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_payment(payment: Payment, state: State<'_, AppState>) -> Result<Payment, String> {
    state.get_db().insert_payment(&payment).map_err(|e| e.to_string())?;
    Ok(payment)
}

#[tauri::command]
fn get_activities(state: State<'_, AppState>) -> Result<Vec<ActivityEvent>, String> {
    state.get_db().fetch_activities().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_activity(activity: ActivityEvent, state: State<'_, AppState>) -> Result<ActivityEvent, String> {
    state.get_db().insert_activity(&activity).map_err(|e| e.to_string())?;
    Ok(activity)
}

#[tauri::command]
fn get_settings(state: State<'_, AppState>) -> Result<Vec<Setting>, String> {
    state.get_db().fetch_settings().map_err(|e| e.to_string())
}

#[tauri::command]
fn save_setting(key: String, value: String, state: State<'_, AppState>) -> Result<(), String> {
    state.get_db().save_setting(&key, &value).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_backup(state: State<'_, AppState>) -> Result<String, String> {
    state.get_db().create_backup().map_err(|e| e.to_string())
}

#[tauri::command]
fn restore_backup(backup_path: String, state: State<'_, AppState>) -> Result<(), String> {
    state.get_db().restore_backup(&backup_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_banking_transactions(state: State<'_, AppState>) -> Result<Vec<BankingTransaction>, String> {
    state.get_db().fetch_banking_transactions().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_banking_transactions_for_customer(customer_id: String, state: State<'_, AppState>) -> Result<Vec<BankingTransaction>, String> {
    state.get_db().fetch_banking_transactions_for_customer(&customer_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_banking_transaction(tx: BankingTransaction, state: State<'_, AppState>) -> Result<BankingTransaction, String> {
    state.get_db().insert_banking_transaction(&tx).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_banking_transaction(id: i64, state: State<'_, AppState>) -> Result<(), String> {
    state.get_db().delete_banking_transaction(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn send_desktop_notification(title: String, body: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let _ = app_handle
        .notification()
        .builder()
        .title(&title)
        .body(&body)
        .show();
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("./desklog_data"));
            let database = Database::new(app_dir)
                .map_err(|e| Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)) as Box<dyn std::error::Error>)?;
            app.manage(AppState {
                db: Mutex::new(database),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_customers,
            add_customer,
            edit_customer,
            delete_customer,
            get_tasks,
            get_task,
            add_task,
            edit_task,
            delete_task,
            get_services,
            add_service,
            edit_service,
            delete_service,
            get_payments,
            add_payment,
            get_activities,
            add_activity,
            get_settings,
            save_setting,
            create_backup,
            restore_backup,
            get_banking_transactions,
            get_banking_transactions_for_customer,
            add_banking_transaction,
            delete_banking_transaction,
            send_desktop_notification
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
