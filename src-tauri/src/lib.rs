pub mod db;

use db::{ActivityEvent, Customer, Database, Task};
use std::sync::Mutex;
use tauri::{State, Manager};
use tauri_plugin_notification::NotificationExt;

pub struct AppState {
    pub db: Mutex<Database>,
}

#[tauri::command]
fn get_customers(state: State<'_, AppState>) -> Result<Vec<Customer>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.fetch_customers().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_customers_paginated(limit: u32, offset: u32, state: State<'_, AppState>) -> Result<Vec<Customer>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.fetch_customers_paginated(limit, offset).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_customer(customer: Customer, state: State<'_, AppState>) -> Result<Customer, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.insert_customer(&customer).map_err(|e| e.to_string())?;
    Ok(customer)
}

#[tauri::command]
fn edit_customer(id: String, name: String, phone: String, notes: Option<String>, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_customer(&id, &name, &phone, notes.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_customer(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_customer(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_tasks(state: State<'_, AppState>) -> Result<Vec<Task>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.fetch_tasks().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_tasks_paginated(limit: u32, offset: u32, state: State<'_, AppState>) -> Result<Vec<Task>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.fetch_tasks_paginated(limit, offset).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_task(task: Task, state: State<'_, AppState>) -> Result<Task, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.insert_task(&task).map_err(|e| e.to_string())?;
    Ok(task)
}

#[tauri::command]
fn update_task_status(id: String, status: String, updated_date: String, sub_status: Option<String>, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_task_status(&id, &status, &updated_date, sub_status.as_deref()).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn edit_task(task: Task, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_task(&task).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_task(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_task(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_activities(state: State<'_, AppState>) -> Result<Vec<ActivityEvent>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.fetch_activities().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_activity(activity: ActivityEvent, state: State<'_, AppState>) -> Result<ActivityEvent, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.insert_activity(&activity).map_err(|e| e.to_string())?;
    Ok(activity)
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
            get_customers_paginated,
            add_customer,
            edit_customer,
            delete_customer,
            get_tasks,
            get_tasks_paginated,
            add_task,
            update_task_status,
            edit_task,
            delete_task,
            get_activities,
            add_activity,
            send_desktop_notification
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
