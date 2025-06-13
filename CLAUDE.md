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

### Widget Dashboard Platform
This application has been transformed from a simple Pomodoro timer into a comprehensive widget dashboard platform built with Tauri (Rust backend) and React (TypeScript frontend). The app now uses a widget-based architecture where multiple productivity tools can be added to a canvas.

### Widget System Architecture
- **Widget Core System**: Registry, lifecycle management, and communication
- **Dashboard Layout Engine**: Positioning, sizing, and layout management  
- **Widget Types**: Display, interactive, system integration, and external service widgets
- **Permission System**: Capability-based security for widget operations
- **Multi-Window Support**: Settings and history still open in separate windows

### Core Widget System Components
- **Widget Registry** (`src/lib/core/registry/WidgetRegistry.ts`): Central registration for all widget types
- **Lifecycle Manager** (`src/lib/core/lifecycle/WidgetLifecycleManager.ts`): Manages widget instances and lifecycle
- **Dashboard Layout** (`src/lib/core/state/DashboardLayout.ts`): Handles positioning, sizing, and layout persistence
- **Dashboard Component** (`src/lib/components/dashboard/Dashboard.tsx`): Main canvas interface with drag-and-drop

### Available Widgets
- **Pomodoro Timer Widget** (`src/lib/widgets/interactive/PomodoroWidget.ts`): Converted from original timer with full functionality
- **Future Widgets**: Clock, weather, system stats, task lists, notes, system commands, RSS feeds, etc.

### Window Management System  
- **Main Window**: Dashboard canvas with widget management interface
- **Settings Window**: Separate window for global application settings
- **History Window**: Separate window showing historical data and statistics
- **Window State Persistence**: Rust backend automatically saves and restores window size/position

### Frontend Structure
- **Multi-Entry Vite Build**: Uses separate HTML entry points (index.html, src/settings.html, src/history.html)
- **Widget Architecture**: Modular system with base classes and interfaces
- **React Components**: 
  - `App.tsx` - Main router that loads Dashboard or legacy windows
  - `Dashboard.tsx` - Widget canvas with add/remove/drag functionality
  - `Settings.tsx` - Global configuration interface  
  - `History.tsx` - Historical data display

### Data Storage
- **Widget State Management**: Each widget manages its own state and persistence
- **LocalStorage**: Primary storage for widget data, settings, and configuration
- **Layout Persistence**: Dashboard layout saved and restored automatically
- **Cross-Window Communication**: Uses storage events to sync state between windows
- **Tauri Store Plugin**: Available for more structured data persistence if needed

### Backend Integration
- **Tauri Commands**: Rust backend handles window management and system integration
- **HTTP Permissions**: Configured for widget network access (Toggl API, weather APIs, etc.)
- **Global Shortcuts**: Available for system-wide hotkey functionality
- **File System Access**: Widgets can request file operations through capability system

### Widget Development
- **Base Widget Class**: Abstract class with lifecycle methods (initialize, render, update, destroy)
- **Widget Definition**: Metadata including permissions, settings, size constraints
- **Widget Registration**: Automatic registration through widget system initialization
- **Permission System**: Fine-grained permissions for filesystem, network, system commands
- **Configuration**: JSON-based settings with validation and UI generation

### Key Features
- **Drag-and-Drop Interface**: Widgets can be moved around the canvas
- **Resizable Widgets**: Widgets can be resized within their constraints
- **Widget Gallery**: Add new widgets from a categorized gallery
- **Layout Management**: Save and restore widget layouts
- **Grid Snapping**: Automatic alignment to grid for clean layouts
- **Z-Index Management**: Bring widgets to front/back as needed

### Development Notes
- Widget system follows the roadmap architecture from `/roadmap` folder
- All widgets inherit from `BaseWidget` class with standardized lifecycle
- Dashboard uses CSS Grid for precise positioning and layout
- Widget permissions are enforced through Tauri's capability system
- TypeScript strict mode enabled with comprehensive type definitions