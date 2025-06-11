 # Technical Architecture

## System Architecture

### Overview

The widget dashboard platform is built on a modular architecture with these key components:

1. **Widget Core System**
2. **Dashboard Layout Engine**
3. **Widget Registry and Lifecycle Manager**
4. **Permission System**
5. **Backend Service Layer**

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Interface                          │
├─────────────┬─────────────┬─────────────────┬──────────────────┤
│  Dashboard  │   Widget    │    Settings     │    Widget        │
│   Layout    │  Instance   │    Manager      │    Gallery       │
│   Engine    │   Views     │                 │                  │
├─────────────┴─────────────┴─────────────────┴──────────────────┤
│                         Widget Core System                      │
├──────────────┬───────────────┬─────────────┬──────────────────┤
│    Widget    │    Widget     │  Inter-     │    Widget        │
│   Registry   │  Lifecycle    │  Widget     │   Permission     │
│              │   Manager     │  Comms      │     System       │
├──────────────┴───────────────┴─────────────┴──────────────────┤
│                      Tauri Backend Services                     │
├──────────────┬───────────────┬─────────────┬──────────────────┤
│  Filesystem  │    System     │   Network   │    Database      │
│   Service    │   Commands    │   Service   │     Service      │
└──────────────┴───────────────┴─────────────┴──────────────────┘
```

## Component Details

### Widget Core System

#### Widget Base Interface

```typescript
interface WidgetDefinition {
  id: string;                  // Unique identifier for widget type
  name: string;                // Human-readable name
  description: string;         // Description of widget functionality
  version: string;             // Semantic version
  author: string;              // Widget author
  minSize: { width: number, height: number };  // Minimum dimensions
  maxSize?: { width: number, height: number }; // Maximum dimensions
  defaultSize: { width: number, height: number }; // Default dimensions
  permissions: WidgetPermission[];   // Required permissions
  settings?: WidgetSetting[];        // Configurable settings
}

interface Widget extends WidgetDefinition {
  initialize: () => Promise<void>;   // Setup widget
  render: (container: HTMLElement) => void;  // Render widget UI
  update: () => void;                // Update widget state/view
  destroy: () => void;               // Cleanup resources
  onResize?: (width: number, height: number) => void; // Handle resize
  onSettingsChange?: (settings: any) => void; // Handle settings change
  onPermissionChange?: (permissions: WidgetPermission[]) => void;
  getState?: () => any;              // Get serializable state
  setState?: (state: any) => void;   // Restore from state
}
```

#### Widget Registry

Central registry for all widget types:

```typescript
class WidgetRegistry {
  registerWidget(widgetDefinition: WidgetDefinition): void;
  unregisterWidget(widgetId: string): void;
  getWidgetDefinition(widgetId: string): WidgetDefinition | null;
  getAllWidgetDefinitions(): WidgetDefinition[];
  createWidgetInstance(widgetId: string, config?: any): Widget;
}
```

#### Widget Lifecycle Manager

Manages widget instances and their lifecycle:

```typescript
class WidgetLifecycleManager {
  createWidget(widgetId: string, containerId: string, config?: any): string;
  destroyWidget(instanceId: string): void;
  pauseWidget(instanceId: string): void;
  resumeWidget(instanceId: string): void;
  getWidgetState(instanceId: string): any;
  setWidgetState(instanceId: string, state: any): void;
}
```

### Dashboard Layout Engine

Manages widget positioning, sizing, and layout:

```typescript
interface WidgetLayoutItem {
  id: string;            // Instance ID
  widgetId: string;      // Widget type ID
  x: number;             // Position X
  y: number;             // Position Y
  width: number;         // Width
  height: number;        // Height
  config?: any;          // Widget-specific config
}

class DashboardLayout {
  addWidget(widget: WidgetLayoutItem): void;
  removeWidget(instanceId: string): void;
  moveWidget(instanceId: string, x: number, y: number): void;
  resizeWidget(instanceId: string, width: number, height: number): void;
  getLayout(): WidgetLayoutItem[];
  setLayout(layout: WidgetLayoutItem[]): void;
  saveLayout(name: string): void;
  loadLayout(name: string): void;
}
```

### Permission System

Controls what capabilities widgets have:

```typescript
enum PermissionType {
  FileSystem,
  Network,
  SystemCommand,
  Notification,
  Clipboard,
  Sensor
}

interface WidgetPermission {
  type: PermissionType;
  scope: string;      // E.g., specific paths, URLs, or commands
  description: string; // User-friendly description of what this allows
}

class PermissionManager {
  requestPermission(widgetId: string, permission: WidgetPermission): Promise<boolean>;
  revokePermission(widgetId: string, permissionType: PermissionType): void;
  hasPermission(widgetId: string, permissionType: PermissionType, scope?: string): boolean;
}
```

## Data Flow

1. **Widget Registration**: Widgets register with the WidgetRegistry at application startup.
2. **Dashboard Initialization**: Dashboard loads saved layout and instantiates widgets.
3. **Widget Lifecycle**: 
   - Widget instances are created through the LifecycleManager
   - Dashboard positions them according to the layout
   - Widgets request permissions as needed
   - Widget state is saved periodically

## Backend Services

Implemented in Rust via Tauri:

1. **File System Service**: Manages read/write access to files
2. **System Command Service**: Executes and manages system commands
3. **Network Service**: Handles HTTP requests and responses
4. **Database Service**: Manages persistent storage
5. **IPC Layer**: Handles communication between frontend and backend

## State Management

- **Application State**: Global state using Svelte stores
- **Widget State**: Individual widget state, persisted separately
- **Layout State**: Dashboard layout configuration
- **User Preferences**: Settings and customizations

## Security Considerations

- **Sandboxed Execution**: Widgets run in restricted contexts
- **Permission Prompts**: User confirmation for sensitive operations
- **API Limiting**: Rate limiting for external API calls
- **Data Validation**: Input validation on all external data