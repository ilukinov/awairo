use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowState {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone)]
pub struct WindowStateManager {
    config_path: Arc<Mutex<PathBuf>>,
    last_save: Arc<Mutex<Option<Instant>>>,
}

impl WindowStateManager {
    pub fn new(app_data_dir: PathBuf) -> Self {
        // Create app data directory if it doesn't exist
        if !app_data_dir.exists() {
            fs::create_dir_all(&app_data_dir).expect("Failed to create app data directory");
        }
        
        let config_path = app_data_dir.join("window-state.json");
        
        // Log the path for debugging
        println!("Window state file path: {:?}", config_path);
        
        WindowStateManager {
            config_path: Arc::new(Mutex::new(config_path)),
            last_save: Arc::new(Mutex::new(None)),
        }
    }
    
    pub fn save(&self, state: &WindowState) {
        // Don't save if dimensions are too small
        if state.width < 100 || state.height < 100 {
            println!("Skipping window state save for dimensions too small: {}x{}", state.width, state.height);
            return;
        }
        
        // Throttle saves to prevent excessive file writes
        let mut last_save = self.last_save.lock().unwrap();
        let now = Instant::now();
        
        // Only save if more than 1 second has passed since the last save
        if let Some(last) = *last_save {
            if now.duration_since(last) < Duration::from_secs(1) {
                return;
            }
        }
        
        *last_save = Some(now);
        
        let config_path = self.config_path.lock().unwrap();
        let json = serde_json::to_string_pretty(state).expect("Failed to serialize window state");
        
        match fs::write(&*config_path, json) {
            Ok(_) => println!("Window state saved: {}x{}", state.width, state.height),
            Err(e) => eprintln!("Failed to write window state: {}", e)
        }
    }
    
    pub fn load(&self) -> Option<WindowState> {
        let config_path = self.config_path.lock().unwrap();
        if !config_path.exists() {
            println!("No window state file found at {:?}", *config_path);
            return None;
        }
        
        match fs::read_to_string(&*config_path) {
            Ok(json) => {
                match serde_json::from_str::<WindowState>(&json) {
                    Ok(state) => {
                        // Validate dimensions
                        if state.width < 100 || state.height < 100 {
                            println!("Invalid window dimensions in saved state: {}x{}", state.width, state.height);
                            return None;
                        }
                        
                        println!("Window state loaded: {}x{}", state.width, state.height);
                        Some(state)
                    },
                    Err(e) => {
                        eprintln!("Failed to parse window state: {}", e);
                        // Try to remove corrupted file
                        let _ = fs::remove_file(&*config_path);
                        None
                    }
                }
            },
            Err(e) => {
                eprintln!("Failed to read window state file: {}", e);
                None
            }
        }
    }
} 