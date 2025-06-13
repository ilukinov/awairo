import { BaseWidget, WidgetDefinition } from '../../widgets/base/Widget';

/**
 * Central registry for all widget types
 * Manages widget definitions and creates instances
 */
export class WidgetRegistry {
  private widgets: Map<string, new () => BaseWidget> = new Map();
  private definitions: Map<string, WidgetDefinition> = new Map();

  /**
   * Register a widget class
   */
  registerWidget(WidgetClass: new () => BaseWidget): void {
    const instance = new WidgetClass();
    const definition: WidgetDefinition = {
      id: instance.id,
      name: instance.name,
      description: instance.description,
      version: instance.version,
      author: instance.author,
      category: instance.category,
      minSize: instance.minSize,
      maxSize: instance.maxSize,
      defaultSize: instance.defaultSize,
      permissions: instance.permissions,
      settings: instance.settings
    };

    this.widgets.set(instance.id, WidgetClass);
    this.definitions.set(instance.id, definition);
    
    console.log(`Widget registered: ${instance.name} (${instance.id})`);
  }

  /**
   * Unregister a widget
   */
  unregisterWidget(widgetId: string): void {
    this.widgets.delete(widgetId);
    this.definitions.delete(widgetId);
    console.log(`Widget unregistered: ${widgetId}`);
  }

  /**
   * Get widget definition by ID
   */
  getWidgetDefinition(widgetId: string): WidgetDefinition | null {
    return this.definitions.get(widgetId) || null;
  }

  /**
   * Get all registered widget definitions
   */
  getAllWidgetDefinitions(): WidgetDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Get widgets by category
   */
  getWidgetsByCategory(category: string): WidgetDefinition[] {
    return Array.from(this.definitions.values())
      .filter(def => def.category === category);
  }

  /**
   * Create a new widget instance
   */
  createWidgetInstance(widgetId: string, config?: Record<string, any>): BaseWidget | null {
    const WidgetClass = this.widgets.get(widgetId);
    if (!WidgetClass) {
      console.error(`Widget not found: ${widgetId}`);
      return null;
    }

    try {
      const widget = new WidgetClass();
      if (config) {
        widget.updateConfig(config);
      }
      return widget;
    } catch (error) {
      console.error(`Failed to create widget instance for ${widgetId}:`, error);
      return null;
    }
  }

  /**
   * Check if widget exists
   */
  hasWidget(widgetId: string): boolean {
    return this.widgets.has(widgetId);
  }

  /**
   * Get widget count
   */
  getWidgetCount(): number {
    return this.widgets.size;
  }

  /**
   * Clear all widgets (useful for testing)
   */
  clear(): void {
    this.widgets.clear();
    this.definitions.clear();
  }
}

// Global registry instance
export const widgetRegistry = new WidgetRegistry();