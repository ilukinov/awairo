# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Development
- `npm run dev` - Start Vite development server (frontend only) on http://localhost:5173
- `npm run tauri dev` - Start Tauri development mode with both frontend and backend
- `npm run build` - Build TypeScript and create production Vite bundle
- `npm run tauri build` - Create production Tauri application bundle

### Other Commands
- `npm run preview` - Preview production build locally
- `npm run tauri` - Access Tauri CLI commands directly

## Tauri Version Information

### Current Version: Tauri v2.0.0
This application has been successfully upgraded to Tauri v2, which includes significant breaking changes from v1:

- **Plugin System**: Tauri v2 uses a modular plugin system instead of allowlists
- **API Changes**: WebviewWindow imports and window management APIs have changed
- **Configuration Format**: tauri.conf.json uses a new v2 schema
- **HTTP Requests**: Now handled via @tauri-apps/plugin-http instead of built-in APIs

### Key Dependencies
- **Frontend**: @tauri-apps/api v2.0.0, React 18.3.1, TypeScript 5.7.2, Vite 6.0.3
- **Backend**: tauri v2.0.0, serde_json 1.0, serialport 4.5
- **Plugins**: fs, http, global-shortcut, store (all v2.0.0)

### Important Tauri v2 Configuration
- **Capabilities**: HTTP permissions configured in `src-tauri/capabilities/default.json`
- **HTTP Scope**: Toggl API access allowed via `https://api.track.toggl.com/*`
- **Plugin Permissions**: Uses capability-based security instead of allowlists

## Application Architecture

### Multi-Window Tauri Desktop Application
This is a Pomodoro timer desktop application built with Tauri (Rust backend) and React (TypeScript frontend). The app uses a multi-window architecture where each "page" opens in a separate window.

### Window Management System
- **Main Window**: PomodoroTimer component with timer display and completed pomodoro tracking
- **Settings Window**: Separate window for configuring timer length, daily goals, and pomodoro icon
- **History Window**: Separate window showing historical pomodoro data and statistics
- **Window State Persistence**: Rust backend automatically saves and restores window size/position

### Frontend Structure
- **Multi-Entry Vite Build**: Uses separate HTML entry points (index.html, src/settings.html, src/history.html)
- **React Components**: 
  - `App.tsx` - Main router component that switches between pages based on URL params
  - `PomodoroTimer.tsx` - Core timer functionality with local storage persistence
  - `Settings.tsx` - Timer configuration interface  
  - `History.tsx` - Historical data display with filtering
  - `PomodoroDialog.tsx` - Modal for editing completed pomodoro details

### Data Storage
- **LocalStorage**: Primary storage for pomodoro data, settings, and timer configuration
- **Cross-Window Communication**: Uses storage events to sync state between windows
- **Tauri Store Plugin**: Available for more structured data persistence if needed

### Backend Integration
- **Tauri Commands**: Rust backend handles window management and system integration
- **Serial Port Access**: Application has serialport dependency (currently unused)
- **HTTP Permissions**: Configured for Toggl API integration (api.track.toggl.com)
- **Global Shortcuts**: Available for system-wide hotkey functionality

### Key Features
- Configurable timer lengths (stored as hours/minutes/seconds)
- Daily goal tracking with visual progress indicators
- Pomodoro completion workflow with commit/uncommit states
- Visual feedback when daily goals are achieved
- Historical data tracking and statistics

### Development Notes
- Timer uses 0.1 minute duration in development (line 7 in PomodoroTimer.tsx)
- Window creation uses WebviewWindow API for programmatic window management
- All windows can be set to always-on-top for productivity focus
- React strict mode and TypeScript with strict settings enabled