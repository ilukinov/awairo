 

This document outlines the different types of widgets that the platform will support, along with concrete examples for each category.

## Widget Categories

### 1. Information Display Widgets

These widgets display information without requiring significant user interaction.

#### Examples:

**Clock Widget**
- Displays current time in various formats
- Optional timezone selection
- Day/date display
- No special permissions required

**Weather Widget**
- Shows current weather and forecast
- Location-based information
- Temperature, conditions, and forecast
- Requires network permission for API access

**System Stats Widget**
- Displays CPU, memory, disk usage
- Network activity monitoring
- Battery status (for laptops)
- Requires system monitoring permissions

**Calendar Overview Widget**
- Shows upcoming events/appointments
- Week/month overview
- Color-coded categories
- Requires calendar access permission

### 2. Interactive Tool Widgets

These widgets allow user interaction and input to perform functions.

#### Examples:

**Pomodoro Timer Widget** (existing functionality)
- Configurable work/break intervals
- Session tracking
- Statistics and history view
- Notification permission for alerts

**Task List Widget**
- Add/edit/complete tasks
- Priority levels and due dates
- Filter and sort capabilities
- Local storage or sync option

**Calculator Widget**
- Basic and scientific calculations
- History of calculations
- Customizable functions
- No special permissions required

**Note Taking Widget**
- Quick notes and text snippets
- Formatting options
- Search functionality
- File system permission for saving notes

### 3. System Integration Widgets

These widgets interact with the local system to perform operations.

#### Examples:

**Folder Monitor Widget**
- Watches specified folders for changes
- Shows recent files
- Quick access to common locations
- Requires filesystem permissions

**Command Executor Widget**
- Creates buttons to run predefined commands
- Shows command output
- Scheduled execution
- Requires command execution permissions

**Quick Launch Widget**
- Configurable application shortcuts
- Recently used applications
- Categorized launcher groups
- Requires application launch permissions

**System Control Widget**
- Volume/brightness controls
- Network toggles (wifi, bluetooth)
- Power options (sleep, restart)
- Requires system control permissions

### 4. External Service Widgets

These widgets connect to online services or APIs.

#### Examples:

**RSS Feed Widget**
- Displays updates from RSS feeds
- Multiple feed support
- Read/unread tracking
- Requires network permissions

**Stock Ticker Widget**
- Real-time stock price monitoring
- Watchlist management
- Basic charts and trends
- Requires network permissions for API access

**Social Media Feed Widget**
- Latest posts from selected platforms
- Interaction capabilities (like, comment)
- Content filters
- Requires network and authentication permissions

**Email Preview Widget**
- Shows recent emails
- Quick reply functionality
- Unread counts and notifications
- Requires network and email account permissions

## Widget Implementation Examples

### Example 1: Weather Widget

```typescript
// Weather Widget Implementation
import { Widget } from '@core/widget';
import { NetworkService } from '@core/services';
import type { WidgetContext, WidgetConfig } from '@core/types';

interface WeatherWidgetConfig {
  location: string;
  units: 'metric' | 'imperial';
  refreshInterval: number; // minutes
}

export class WeatherWidget implements Widget {
  id = 'system.weather';
  name = 'Weather';
  description = 'Displays current weather and forecast';
  version = '1.0.0';
  author = 'An Apple A Day';
  
  minSize = { width: 200, height: 100 };
  maxSize = { width: 500, height: 400 };
  defaultSize = { width: 300, height: 200 };
  
  permissions = [
    {
      type: PermissionType.Network,
      scope: 'api.weatherservice.com',
      description: 'Access weather data from Weather Service'
    }
  ];
  
  settings = [
    {
      id: 'location',
      type: 'text',
      label: 'Location',
      default: 'auto'
    },
    {
      id: 'units',
      type: 'select',
      label: 'Units',
      options: [
        { value: 'metric', label: 'Celsius' },
        { value: 'imperial', label: 'Fahrenheit' }
      ],
      default: 'metric'
    },
    {
      id: 'refreshInterval',
      type: 'number',
      label: 'Refresh Interval (minutes)',
      min: 5,
      max: 60,
      default: 15
    }
  ];
  
  private config: WeatherWidgetConfig;
  private weatherData: any = null;
  private updateInterval: number | null = null;
  private container: HTMLElement | null = null;
  
  constructor(config?: Partial<WeatherWidgetConfig>) {
    this.config = {
      location: 'auto',
      units: 'metric',
      refreshInterval: 15,
      ...config
    };
  }
  
  async initialize(): Promise<void> {
    await this.fetchWeatherData();
    this.updateInterval = window.setInterval(() => {
      this.fetchWeatherData().then(() => this.update());
    }, this.config.refreshInterval * 60 * 1000);
  }
  
  render(container: HTMLElement): void {
    this.container = container;
    this.container.innerHTML = this.generateHTML();
  }
  
  update(): void {
    if (this.container) {
      this.container.innerHTML = this.generateHTML();
    }
  }
  
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
  
  onSettingsChange(settings: Partial<WeatherWidgetConfig>): void {
    this.config = { ...this.config, ...settings };
    this.fetchWeatherData().then(() => this.update());
    
    // Reset interval with new refresh rate
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = window.setInterval(() => {
        this.fetchWeatherData().then(() => this.update());
      }, this.config.refreshInterval * 60 * 1000);
    }
  }
  
  getState(): any {
    return {
      config: this.config,
      lastWeatherData: this.weatherData
    };
  }
  
  setState(state: any): void {
    if (state.config) {
      this.config = state.config;
    }
    if (state.lastWeatherData) {
      this.weatherData = state.lastWeatherData;
    }
  }
  
  private async fetchWeatherData(): Promise<void> {
    try {
      const networkService = new NetworkService();
      const response = await networkService.get(
        `https://api.weatherservice.com/current`,
        {
          params: {
            location: this.config.location,
            units: this.config.units
          }
        }
      );
      this.weatherData = response.data;
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  }
  
  private generateHTML(): string {
    if (!this.weatherData) {
      return `<div class="widget-loading">Loading weather data...</div>`;
    }
    
    const { current, forecast } = this.weatherData;
    const unit = this.config.units === 'metric' ? '°C' : '°F';
    
    return `
      <div class="weather-widget">
        <div class="current-weather">
          <div class="location">${current.location}</div>
          <div class="temperature">${current.temperature}${unit}</div>
          <div class="conditions">
            <img src="${current.iconUrl}" alt="${current.conditions}" />
            <span>${current.conditions}</span>
          </div>
          <div class="details">
            <div>Humidity: ${current.humidity}%</div>
            <div>Wind: ${current.windSpeed} ${this.config.units === 'metric' ? 'km/h' : 'mph'}</div>
          </div>
        </div>
        <div class="forecast">
          ${forecast.slice(0, 3).map(day => `
            <div class="forecast-day">
              <div class="day">${day.day}</div>
              <img src="${day.iconUrl}" alt="${day.conditions}" />
              <div class="temp-range">${day.high}${unit} / ${day.low}${unit}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}
```

### Example 2: Command Executor Widget

```typescript
// Command Executor Widget
import { Widget } from '@core/widget';
import { SystemCommandService } from '@core/services';
import type { WidgetContext, WidgetConfig } from '@core/types';

interface Command {
  id: string;
  name: string;
  command: string;
  showOutput: boolean;
}

interface CommandExecutorConfig {
  commands: Command[];
}

export class CommandExecutorWidget implements Widget {
  id = 'system.command-executor';
  name = 'Command Executor';
  description = 'Create buttons to run predefined commands';
  version = '1.0.0';
  author = 'An Apple A Day';
  
  minSize = { width: 200, height: 100 };
  maxSize = { width: 800, height: 600 };
  defaultSize = { width: 400, height: 300 };
  
  permissions = [
    {
      type: PermissionType.SystemCommand,
      scope: '*', // Will be restricted per command
      description: 'Execute system commands'
    }
  ];
  
  settings = [
    {
      id: 'commands',
      type: 'commandList',
      label: 'Commands',
      default: []
    }
  ];
  
  private config: CommandExecutorConfig;
  private container: HTMLElement | null = null;
  private commandService: SystemCommandService;
  private commandOutputs: Record<string, string> = {};
  
  constructor(config?: Partial<CommandExecutorConfig>) {
    this.config = {
      commands: [],
      ...config
    };
    this.commandService = new SystemCommandService();
  }
  
  async initialize(): Promise<void> {
    // Nothing to initialize
  }
  
  render(container: HTMLElement): void {
    this.container = container;
    this.container.innerHTML = this.generateHTML();
    this.attachEventListeners();
  }
  
  update(): void {
    if (this.container) {
      this.container.innerHTML = this.generateHTML();
      this.attachEventListeners();
    }
  }
  
  destroy(): void {
    // Clean up any running commands or listeners
  }
  
  onSettingsChange(settings: Partial<CommandExecutorConfig>): void {
    if (settings.commands) {
      this.config.commands = settings.commands;
      this.update();
    }
  }
  
  getState(): any {
    return {
      config: this.config,
      commandOutputs: this.commandOutputs
    };
  }
  
  setState(state: any): void {
    if (state.config) {
      this.config = state.config;
    }
    if (state.commandOutputs) {
      this.commandOutputs = state.commandOutputs;
    }
  }
  
  private generateHTML(): string {
    if (this.config.commands.length === 0) {
      return `
        <div class="command-executor empty">
          <p>No commands configured.</p>
          <button class="add-command-btn">Add Command</button>
        </div>
      `;
    }
    
    return `
      <div class="command-executor">
        <div class="command-buttons">
          ${this.config.commands.map(cmd => `
            <button class="command-btn" data-command-id="${cmd.id}">
              ${cmd.name}
            </button>
          `).join('')}
          <button class="add-command-btn">+</button>
        </div>
        
        <div class="command-outputs">
          ${this.config.commands
            .filter(cmd => cmd.showOutput && this.commandOutputs[cmd.id])
            .map(cmd => `
              <div class="command-output" data-command-id="${cmd.id}">
                <div class="output-header">
                  <span>${cmd.name} Output</span>
                  <button class="clear-output-btn" data-command-id="${cmd.id}">Clear</button>
                </div>
                <pre>${this.commandOutputs[cmd.id] || ''}</pre>
              </div>
            `).join('')}
        </div>
      </div>
    `;
  }
  
  private attachEventListeners(): void {
    if (!this.container) return;
    
    // Add command button
    const addBtn = this.container.querySelector('.add-command-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openCommandEditor());
    }
    
    // Execute command buttons
    const commandBtns = this.container.querySelectorAll('.command-btn');
    commandBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cmdId = (e.currentTarget as HTMLElement).getAttribute('data-command-id');
        if (cmdId) {
          this.executeCommand(cmdId);
        }
      });
    });
    
    // Clear output buttons
    const clearBtns = this.container.querySelectorAll('.clear-output-btn');
    clearBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cmdId = (e.currentTarget as HTMLElement).getAttribute('data-command-id');
        if (cmdId) {
          delete this.commandOutputs[cmdId];
          this.update();
        }
      });
    });
  }
  
  private async executeCommand(commandId: string): Promise<void> {
    const command = this.config.commands.find(c => c.id === commandId);
    if (!command) return;
    
    try {
      // Request specific permission for this command
      const permissionGranted = await this.commandService.requestPermission(command.command);
      if (!permissionGranted) {
        this.commandOutputs[commandId] = 'Permission denied';
        this.update();
        return;
      }
      
      const output = await this.commandService.execute(command.command);
      if (command.showOutput) {
        this.commandOutputs[commandId] = output;
        this.update();
      }
    } catch (error) {
      console.error(`Error executing command: ${command.name}`, error);
      this.commandOutputs[commandId] = `Error: ${error.message || 'Unknown error'}`;
      this.update();
    }
  }
  
  private openCommandEditor(): void {
    // Implementation for editing commands
    // This would open a modal dialog to add/edit commands
    // For now, we'll just add a sample command
    const newCommand: Command = {
      id: `cmd-${Date.now()}`,
      name: 'New Command',
      command: 'echo "Hello World"',
      showOutput: true
    };
    
    this.config.commands.push(newCommand);
    this.update();
  }
}
```

## Widget Integration Case Studies

### Case Study 1: Widget Communication

**Scenario**: A task list widget needs to create Pomodoro sessions for specific tasks.

**Implementation**:
1. Define a communication protocol between widgets
2. Create event channels for widget-to-widget messaging
3. Implement event listeners in the Pomodoro widget
4. Add "Start Pomodoro" action in the Task List widget

```typescript
// In TaskListWidget.ts
private startPomodoroForTask(taskId: string): void {
  const task = this.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  // Publish event to channel
  widgetCommunication.publish('pomodoro.start', {
    title: task.title,
    duration: 25, // Default duration
    taskId: task.id
  });
}

// In PomodoroWidget.ts
initialize(): Promise<void> {
  // Subscribe to events
  widgetCommunication.subscribe('pomodoro.start', (data) => {
    this.startTimer(data.duration, data.title);
    this.linkedTaskId = data.taskId;
  });
  
  return Promise.resolve();
}
```

### Case Study 2: Widget with System Integration

**Scenario**: A system monitor widget that needs access to system metrics.

**Implementation**:
1. Define required system permissions
2. Create Rust backend for accessing system information
3. Implement IPC between frontend and backend
4. Handle permission requests and user approval

```rust
// In Rust backend (src-tauri/src/system_monitor.rs)
use sysinfo::{System, SystemExt, ProcessorExt};

#[tauri::command]
fn get_system_metrics() -> Result<SystemMetrics, String> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    Ok(SystemMetrics {
        cpu_usage: sys.global_processor_info().cpu_usage(),
        memory_used: sys.used_memory(),
        memory_total: sys.total_memory(),
        uptime: sys.uptime()
    })
}

// In TypeScript frontend
class SystemMonitorWidget implements Widget {
  // ... other widget properties
  
  async initialize(): Promise<void> {
    // Request permission
    const permissionGranted = await permissionManager.requestPermission(
      this.id,
      {
        type: PermissionType.SystemInfo,
        scope: 'cpu,memory',
        description: 'Monitor system CPU and memory usage'
      }
    );
    
    if (permissionGranted) {
      await this.refreshSystemData();
      this.updateInterval = window.setInterval(
        () => this.refreshSystemData(), 
        5000
      );
    }
  }
  
  private async refreshSystemData(): Promise<void> {
    try {
      this.systemData = await invoke('get_system_metrics');
      this.update();
    } catch (error) {
      console.error('Failed to get system metrics:', error);
    }
  }
}
```