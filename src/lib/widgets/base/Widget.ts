/**
 * Core Widget System Types and Interfaces
 * Based on the roadmap architecture design
 */

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export enum PermissionType {
  FileSystem = 'filesystem',
  Network = 'network',
  SystemCommand = 'system-command',
  Notification = 'notification',
  Clipboard = 'clipboard',
  Sensor = 'sensor'
}

export interface WidgetPermission {
  type: PermissionType;
  scope: string;
  description: string;
}

export interface WidgetSetting {
  id: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'color';
  label: string;
  description?: string;
  default: any;
  min?: number;
  max?: number;
  options?: { value: any; label: string }[];
}

export interface WidgetAspectRatio {
  width: number;
  height: number;
  locked: boolean; // If true, widget should maintain this ratio when resizing
}

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: 'display' | 'interactive' | 'system' | 'external';
  minSize: WidgetSize;
  maxSize?: WidgetSize;
  defaultSize: WidgetSize;
  permissions: WidgetPermission[];
  settings?: WidgetSetting[];
  preferredAspectRatio?: WidgetAspectRatio; // Optional preferred aspect ratio
}

export interface WidgetInstance extends WidgetDefinition {
  instanceId: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: Record<string, any>;
  isActive: boolean;
}

export interface WidgetLayoutItem {
  instanceId: string;
  widgetId: string;
  position: WidgetPosition;
  size: WidgetSize;
  config?: Record<string, any>;
  zIndex: number;
}

export abstract class BaseWidget implements WidgetDefinition {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract version: string;
  abstract author: string;
  abstract category: 'display' | 'interactive' | 'system' | 'external';
  abstract minSize: WidgetSize;
  abstract defaultSize: WidgetSize;
  abstract permissions: WidgetPermission[];

  maxSize?: WidgetSize;
  settings?: WidgetSetting[];
  preferredAspectRatio?: WidgetAspectRatio;

  protected container: HTMLElement | null = null;
  protected config: Record<string, any> = {};

  /**
   * Initialize the widget with configuration
   */
  abstract initialize(config?: Record<string, any>): Promise<void>;

  /**
   * Render the widget into the provided container
   */
  abstract render(container: HTMLElement): void;

  /**
   * Update the widget's display/state
   */
  abstract update(): void;

  /**
   * Clean up resources when widget is destroyed
   */
  abstract destroy(): void;

  /**
   * Handle widget resize
   */
  onResize?(width: number, height: number): void;

  /**
   * Handle settings change
   */
  onSettingsChange?(settings: Record<string, any>): void;

  /**
   * Handle permission change
   */
  onPermissionChange?(permissions: WidgetPermission[]): void;

  /**
   * Get serializable state for persistence
   */
  getState?(): Record<string, any>;

  /**
   * Restore widget from saved state
   */
  setState?(state: Record<string, any>): void;

  /**
   * Validate configuration
   */
  validateConfig(config: Record<string, any>): boolean {
    return true; // Override in subclasses
  }

  /**
   * Get current configuration
   */
  getConfig(): Record<string, any> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Record<string, any>): void {
    if (this.validateConfig(newConfig)) {
      this.config = { ...this.config, ...newConfig };
      this.onSettingsChange?.(this.config);
    }
  }
}