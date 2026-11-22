pub mod db;

use db::{ActivityEvent, BankingTransaction, BankAccountOpening, Customer, Database, Payment, Service, Setting, Task};
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
fn edit_payment(payment: Payment, state: State<'_, AppState>) -> Result<(), String> {
    state.get_db().update_payment(&payment).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_payment(id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.get_db().delete_payment(&id).map_err(|e| e.to_string())
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
fn edit_banking_transaction(tx: BankingTransaction, state: State<'_, AppState>) -> Result<BankingTransaction, String> {
    state.get_db().update_banking_transaction(&tx).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_banking_transaction(id: i64, state: State<'_, AppState>) -> Result<(), String> {
    state.get_db().delete_banking_transaction(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_bank_account_openings(state: State<'_, AppState>) -> Result<Vec<BankAccountOpening>, String> {
    state.get_db().fetch_bank_account_openings().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_bank_account_opening(item: BankAccountOpening, state: State<'_, AppState>) -> Result<BankAccountOpening, String> {
    state.get_db().insert_bank_account_opening(&item).map_err(|e| e.to_string())
}

#[tauri::command]
fn edit_bank_account_opening(item: BankAccountOpening, state: State<'_, AppState>) -> Result<(), String> {
    state.get_db().update_bank_account_opening(&item).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_bank_account_opening(id: i64, state: State<'_, AppState>) -> Result<(), String> {
    state.get_db().delete_bank_account_opening(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn import_bank_account_openings(items: Vec<BankAccountOpening>, state: State<'_, AppState>) -> Result<usize, String> {
    state.get_db().import_bank_account_openings(&items).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_account_document(
    account_id: i64,
    doc_type: String,
    file_name: String,
    base64_data: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    use base64::Engine;
    let raw_b64 = if let Some(idx) = base64_data.find(";base64,") {
        &base64_data[idx + 8..]
    } else {
        &base64_data
    };
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(raw_b64.trim())
        .map_err(|e| format!("Base64 decode error: {}", e))?;
    state
        .get_db()
        .save_account_document(account_id, &doc_type, &file_name, &bytes)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_document_as_data_url(file_path: String) -> Result<String, String> {
    use base64::Engine;
    let path = std::path::Path::new(&file_path);
    if !path.exists() {
        return Err("File not found on local disk".to_string());
    }
    let bytes = std::fs::read(path).map_err(|e| e.to_string())?;
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "pdf" => "application/pdf",
        _ => "application/octet-stream",
    };
    let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:{};base64,{}", mime, encoded))
}

#[tauri::command]
fn open_document_file(file_path: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app_handle
        .opener()
        .open_path(&file_path, None::<&str>)
        .map_err(|e| e.to_string())
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

#[tauri::command]
fn get_workstation_id(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("./desklog_data"));
    let _ = std::fs::create_dir_all(&app_dir);
    let ws_file = app_dir.join("workstation_id.txt");
    if ws_file.exists() {
        if let Ok(id) = std::fs::read_to_string(&ws_file) {
            let trimmed = id.trim().to_string();
            if !trimmed.is_empty() {
                return Ok(trimmed);
            }
        }
    }

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let new_id = format!("ws-{}", now);
    let _ = std::fs::write(&ws_file, &new_id);
    Ok(new_id)
}

#[tauri::command]
async fn send_heartbeat_native(workstation_id: String, app_version: String, os_info: String) -> Result<String, String> {
    const DEFAULT_NEON_ENDPOINT: &str = "https://ep-falling-heart-aztfzlgo.c-3.ap-southeast-1.aws.neon.tech/sql";
    const DEFAULT_NEON_CONN: &str = "postgresql://neondb_owner:npg_AO7bZ1BzMiyx@ep-falling-heart-aztfzlgo.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

    let telemetry_endpoint = std::env::var("DESKLOG_TELEMETRY_ENDPOINT")
        .unwrap_or_else(|_| DEFAULT_NEON_ENDPOINT.to_string());
    let neon_conn_string = std::env::var("DESKLOG_NEON_CONN")
        .unwrap_or_else(|_| DEFAULT_NEON_CONN.to_string());

    let safe_ws_id: String = workstation_id.chars().take(80).collect();
    let safe_os_info: String = os_info.chars().take(80).collect();
    let safe_app_version: String = app_version.chars().take(20).collect();

    let escaped_ws_id = safe_ws_id.replace('\'', "''");
    let escaped_os_info = safe_os_info.replace('\'', "''");
    let escaped_ver = safe_app_version.replace('\'', "''");

    let sql = format!(
        "SELECT record_heartbeat('desklog', '', '{}', '{}', '{}')",
        escaped_ws_id, escaped_ver, escaped_os_info
    );

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .build()
        .map_err(|e| format!("Client builder error: {}", e))?;

    let res = client
        .post(&telemetry_endpoint)
        .header("Content-Type", "application/json")
        .header("Neon-Connection-String", neon_conn_string)
        .json(&serde_json::json!({ "query": sql }))
        .send()
        .await
        .map_err(|e| format!("HTTP request error: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Server returned HTTP {}", res.status()));
    }

    let text = res.text().await.map_err(|e| format!("Failed to read response body: {}", e))?;
    Ok(text)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
                let _ = w.unminimize();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("./desklog_data"));
            let database = Database::new(app_dir.clone())
                .map_err(|e| Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)) as Box<dyn std::error::Error>)?;
            app.manage(AppState {
                db: Mutex::new(database),
            });

            // Ensure workstation ID is initialized once on disk
            let ws_file = app_dir.join("workstation_id.txt");
            if !ws_file.exists() {
                let now = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_millis();
                let _ = std::fs::write(&ws_file, format!("ws-{}", now));
            }

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
            edit_payment,
            delete_payment,
            get_activities,
            add_activity,
            get_settings,
            save_setting,
            create_backup,
            restore_backup,
            get_banking_transactions,
            get_banking_transactions_for_customer,
            add_banking_transaction,
            edit_banking_transaction,
            delete_banking_transaction,
            get_bank_account_openings,
            add_bank_account_opening,
            edit_bank_account_opening,
            delete_bank_account_opening,
            import_bank_account_openings,
            save_account_document,
            get_document_as_data_url,
            open_document_file,
            send_desktop_notification,
            get_workstation_id,
            send_heartbeat_native
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
