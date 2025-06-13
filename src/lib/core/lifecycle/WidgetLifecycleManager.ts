import { BaseWidget, WidgetInstance, WidgetPosition, WidgetSize } from '../../widgets/base/Widget';
import { widgetRegistry } from '../registry/WidgetRegistry';

/**
 * Manages widget instances and their lifecycle
 */
export class WidgetLifecycleManager {
  private instances: Map<string, BaseWidget> = new Map();
  private instanceData: Map<string, WidgetInstance> = new Map();

  /**
   * Create a new widget instance
   */
  async createWidget(
    widgetId: string, 
    position: WidgetPosition,
    size?: WidgetSize,
    config?: Record<string, any>
  ): Promise<string | null> {
    const definition = widgetRegistry.getWidgetDefinition(widgetId);
    if (!definition) {
      console.error(`Widget definition not found: ${widgetId}`);
      return null;
    }

    const widget = widgetRegistry.createWidgetInstance(widgetId, config);
    if (!widget) {
      console.error(`Failed to create widget instance: ${widgetId}`);
      return null;
    }

    const instanceId = this.generateInstanceId(widgetId);
    const finalSize = size || definition.defaultSize;

    // Validate size constraints
    if (finalSize.width < definition.minSize.width || finalSize.height < definition.minSize.height) {
      console.warn(`Widget size too small, using minimum size for ${widgetId}`);
      finalSize.width = Math.max(finalSize.width, definition.minSize.width);
      finalSize.height = Math.max(finalSize.height, definition.minSize.height);
    }

    if (definition.maxSize) {
      finalSize.width = Math.min(finalSize.width, definition.maxSize.width);
      finalSize.height = Math.min(finalSize.height, definition.maxSize.height);
    }

    const instance: WidgetInstance = {
      ...definition,
      instanceId,
      position,
      size: finalSize,
      config: config || {},
      isActive: true
    };

    try {
      await widget.initialize(config);
      this.instances.set(instanceId, widget);
      this.instanceData.set(instanceId, instance);
      
      console.log(`Widget instance created: ${instanceId} (${widgetId})`);
      return instanceId;
    } catch (error) {
      console.error(`Failed to initialize widget ${instanceId}:`, error);
      return null;
    }
  }

  /**
   * Destroy a widget instance
   */
  destroyWidget(instanceId: string): void {
    const widget = this.instances.get(instanceId);
    if (widget) {
      try {
        widget.destroy();
      } catch (error) {
        console.error(`Error destroying widget ${instanceId}:`, error);
      }
    }

    this.instances.delete(instanceId);
    this.instanceData.delete(instanceId);
    console.log(`Widget instance destroyed: ${instanceId}`);
  }

  /**
   * Get widget instance
   */
  getWidget(instanceId: string): BaseWidget | null {
    return this.instances.get(instanceId) || null;
  }

  /**
   * Get widget instance data
   */
  getWidgetInstanceData(instanceId: string): WidgetInstance | null {
    return this.instanceData.get(instanceId) || null;
  }

  /**
   * Get all widget instances
   */
  getAllInstances(): WidgetInstance[] {
    return Array.from(this.instanceData.values());
  }

  /**
   * Get active widget instances
   */
  getActiveInstances(): WidgetInstance[] {
    return Array.from(this.instanceData.values()).filter(instance => instance.isActive);
  }

  /**
   * Pause a widget (deactivate)
   */
  pauseWidget(instanceId: string): void {
    const instanceData = this.instanceData.get(instanceId);
    if (instanceData) {
      instanceData.isActive = false;
      console.log(`Widget paused: ${instanceId}`);
    }
  }

  /**
   * Resume a widget (activate)
   */
  resumeWidget(instanceId: string): void {
    const instanceData = this.instanceData.get(instanceId);
    if (instanceData) {
      instanceData.isActive = true;
      console.log(`Widget resumed: ${instanceId}`);
    }
  }

  /**
   * Update widget position
   */
  updateWidgetPosition(instanceId: string, position: WidgetPosition): void {
    const instanceData = this.instanceData.get(instanceId);
    if (instanceData) {
      instanceData.position = position;
    }
  }

  /**
   * Update widget size
   */
  updateWidgetSize(instanceId: string, size: WidgetSize): void {
    const instanceData = this.instanceData.get(instanceId);
    const widget = this.instances.get(instanceId);
    
    if (instanceData && widget) {
      // Validate size constraints
      const definition = widgetRegistry.getWidgetDefinition(instanceData.id);
      if (definition) {
        const validatedSize = { ...size };
        
        if (validatedSize.width < definition.minSize.width || validatedSize.height < definition.minSize.height) {
          validatedSize.width = Math.max(validatedSize.width, definition.minSize.width);
          validatedSize.height = Math.max(validatedSize.height, definition.minSize.height);
        }

        if (definition.maxSize) {
          validatedSize.width = Math.min(validatedSize.width, definition.maxSize.width);
          validatedSize.height = Math.min(validatedSize.height, definition.maxSize.height);
        }

        instanceData.size = validatedSize;
        widget.onResize?.(validatedSize.width, validatedSize.height);
      }
    }
  }

  /**
   * Get widget state for persistence
   */
  getWidgetState(instanceId: string): Record<string, any> | null {
    const widget = this.instances.get(instanceId);
    const instanceData = this.instanceData.get(instanceId);
    
    if (widget && instanceData) {
      return {
        instanceData,
        widgetState: widget.getState?.() || {}
      };
    }
    
    return null;
  }

  /**
   * Set widget state from persistence
   */
  setWidgetState(instanceId: string, state: Record<string, any>): void {
    const widget = this.instances.get(instanceId);
    if (widget && state.widgetState) {
      widget.setState?.(state.widgetState);
    }
    
    if (state.instanceData) {
      this.instanceData.set(instanceId, state.instanceData);
    }
  }

  /**
   * Get instance count
   */
  getInstanceCount(): number {
    return this.instances.size;
  }

  /**
   * Generate unique instance ID
   */
  private generateInstanceId(widgetId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${widgetId}-${timestamp}-${random}`;
  }

  /**
   * Clear all instances (useful for testing)
   */
  clear(): void {
    // Destroy all widgets first
    for (const [instanceId] of this.instances) {
      this.destroyWidget(instanceId);
    }
  }
}

// Global lifecycle manager instance
export const widgetLifecycleManager = new WidgetLifecycleManager();