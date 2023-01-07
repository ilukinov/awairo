#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
use serialport::*;

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
    .run(tauri::generate_context!())
    .expect("error while running tauri application");


}
