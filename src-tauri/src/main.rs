#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
use serialport::*;
use tauri::{Manager, WindowEvent};
use window_state::{WindowState, WindowStateManager};

mod window_state;

fn main() {
  match available_ports() {
    Ok(ports) => {
        for port in ports {
            println!("Found port: {}", port.port_name);
        }
    }
    Err(e) => {
        println!("Error listing ports: {}", e);
    }
  }

  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::default().build())
    .setup(|app| {
      let window = app.get_window("main").unwrap();
      
      // Initialize window state manager
      let window_state_manager = WindowStateManager::new(app.path_resolver().app_data_dir().unwrap());
      
      // Load saved window state
      if let Some(saved_state) = window_state_manager.load() {
        // Set window size from saved state
        window.set_size(tauri::Size::Physical(
          tauri::PhysicalSize {
            width: saved_state.width,
            height: saved_state.height,
          }
        )).unwrap();
        
        // Center the window after setting size
        window.center().unwrap();
      }
      
      // Save window state on close and when resized/moved
      let window_state_manager_clone = window_state_manager.clone();
      let window_clone = window.clone();
      
      window.on_window_event(move |event| {
        match event {
          // Save on close
          WindowEvent::CloseRequested { .. } => {
            save_window_state(&window_clone, &window_state_manager_clone);
          },
          // Save on resize or move (with throttling to avoid excessive writes)
          WindowEvent::Moved { .. } | WindowEvent::Resized { .. } => {
            save_window_state(&window_clone, &window_state_manager_clone);
          },
          _ => {}
        }
      });
      
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

// Helper function to save window state
fn save_window_state(window: &tauri::Window, state_manager: &WindowStateManager) {
  if let Ok(size) = window.inner_size() {
    let state = WindowState {
      width: size.width, 
      height: size.height,
    };
    state_manager.save(&state);
  }
}
