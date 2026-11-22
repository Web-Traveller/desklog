// Prevents console window on Windows in all configurations (debug and release)
#![windows_subsystem = "windows"]

fn main() {
    std::panic::set_hook(Box::new(|info| {
        let backtrace = std::backtrace::Backtrace::capture();
        let msg = format!("PANIC: {}\nBacktrace:\n{:?}\n", info, backtrace);
        eprintln!("{}", msg);
        let _ = std::fs::write("panic.txt", &msg);
        if let Ok(appdata) = std::env::var("APPDATA") {
            let app_dir = std::path::PathBuf::from(appdata).join("com.desklog.manager");
            let _ = std::fs::create_dir_all(&app_dir);
            let _ = std::fs::write(app_dir.join("crash_log.txt"), &msg);
        }
    }));

    desklog_lib::run()
}
