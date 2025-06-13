/**
 * Widget Registration
 * Import and register all available widgets
 */

import { widgetRegistry } from '../core/registry/WidgetRegistry';
import { OriginalPomodoroWidget } from './interactive/OriginalPomodoroWidget';

/**
 * Initialize and register all widgets
 */
export function initializeWidgets(): void {
  console.log('Initializing widget system...');
  
  // Register interactive widgets
  widgetRegistry.registerWidget(OriginalPomodoroWidget);
  
  console.log(`Widget system initialized with ${widgetRegistry.getWidgetCount()} widgets`);
}

/**
 * Get all available widget categories
 */
export function getWidgetCategories(): string[] {
  const definitions = widgetRegistry.getAllWidgetDefinitions();
  const categories = new Set(definitions.map(def => def.category));
  return Array.from(categories).sort();
}

/**
 * Export commonly used classes and functions
 */
export { widgetRegistry } from '../core/registry/WidgetRegistry';
export { widgetLifecycleManager } from '../core/lifecycle/WidgetLifecycleManager';
export { dashboardLayout } from '../core/state/DashboardLayout';
export { Dashboard } from '../components/dashboard/Dashboard';

// Export widget types
export type { BaseWidget, WidgetDefinition, WidgetInstance } from './base/Widget';
export { OriginalPomodoroWidget };