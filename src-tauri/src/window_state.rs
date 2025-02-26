use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowState {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone)]
pub struct WindowStateManager {
    config_path: Arc<Mutex<PathBuf>>,
}

impl WindowStateManager {
    pub fn new(app_data_dir: PathBuf) -> Self {
        // Create app data directory if it doesn't exist
        if !app_data_dir.exists() {
            fs::create_dir_all(&app_data_dir).expect("Failed to create app data directory");
        }
        
        let config_path = app_data_dir.join("window-state.json");
        
        WindowStateManager {
            config_path: Arc::new(Mutex::new(config_path)),
        }
    }
    
    pub fn save(&self, state: &WindowState) {
        let config_path = self.config_path.lock().unwrap();
        let json = serde_json::to_string_pretty(state).expect("Failed to serialize window state");
        fs::write(&*config_path, json).expect("Failed to write window state to file");
        println!("Window state saved: {}x{}", state.width, state.height);
    }
    
    pub fn load(&self) -> Option<WindowState> {
        let config_path = self.config_path.lock().unwrap();
        if !config_path.exists() {
            return None;
        }
        
        match fs::read_to_string(&*config_path) {
            Ok(json) => {
                match serde_json::from_str::<WindowState>(&json) {
                    Ok(state) => {
                        println!("Window state loaded: {}x{}", state.width, state.height);
                        Some(state)
                    },
                    Err(e) => {
                        eprintln!("Failed to parse window state: {}", e);
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