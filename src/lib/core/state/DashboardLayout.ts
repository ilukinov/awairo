import { WidgetLayoutItem, WidgetPosition, WidgetSize } from '../../widgets/base/Widget';

/**
 * Manages widget positioning, sizing, and layout
 */
export class DashboardLayout {
  private layout: Map<string, WidgetLayoutItem> = new Map();
  private savedLayouts: Map<string, WidgetLayoutItem[]> = new Map();
  private gridSize: number = 10; // Snap to grid size in pixels
  private maxZIndex: number = 1000;

  /**
   * Add a widget to the layout
   */
  addWidget(widget: WidgetLayoutItem): void {
    // Ensure widget doesn't overlap with existing widgets
    const adjustedPosition = this.findNonOverlappingPosition(widget);
    
    const layoutItem: WidgetLayoutItem = {
      ...widget,
      position: adjustedPosition,
      zIndex: widget.zIndex || this.getNextZIndex()
    };

    this.layout.set(widget.instanceId, layoutItem);
    console.log(`Widget added to layout: ${widget.instanceId} at (${adjustedPosition.x}, ${adjustedPosition.y})`);
  }

  /**
   * Remove a widget from the layout
   */
  removeWidget(instanceId: string): void {
    if (this.layout.delete(instanceId)) {
      console.log(`Widget removed from layout: ${instanceId}`);
    }
  }

  /**
   * Move a widget to a new position
   */
  moveWidget(instanceId: string, position: WidgetPosition): void {
    const widget = this.layout.get(instanceId);
    if (widget) {
      const snappedPosition = this.snapToGrid(position);
      widget.position = snappedPosition;
      console.log(`Widget moved: ${instanceId} to (${snappedPosition.x}, ${snappedPosition.y})`);
    }
  }

  /**
   * Resize a widget
   */
  resizeWidget(instanceId: string, size: WidgetSize): void {
    const widget = this.layout.get(instanceId);
    if (widget) {
      const snappedSize = this.snapSizeToGrid(size);
      widget.size = snappedSize;
      console.log(`Widget resized: ${instanceId} to ${snappedSize.width}x${snappedSize.height}`);
    }
  }

  /**
   * Bring widget to front
   */
  bringToFront(instanceId: string): void {
    const widget = this.layout.get(instanceId);
    if (widget) {
      widget.zIndex = this.getNextZIndex();
    }
  }

  /**
   * Send widget to back
   */
  sendToBack(instanceId: string): void {
    const widget = this.layout.get(instanceId);
    if (widget) {
      widget.zIndex = 1;
      // Update other widgets' z-indices to maintain order
      this.normalizeZIndices();
    }
  }

  /**
   * Get current layout
   */
  getLayout(): WidgetLayoutItem[] {
    return Array.from(this.layout.values()).sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Set entire layout
   */
  setLayout(layout: WidgetLayoutItem[]): void {
    this.layout.clear();
    layout.forEach(item => {
      this.layout.set(item.instanceId, item);
    });
  }

  /**
   * Get widget layout item
   */
  getWidgetLayout(instanceId: string): WidgetLayoutItem | null {
    return this.layout.get(instanceId) || null;
  }

  /**
   * Save current layout with a name
   */
  saveLayout(name: string): void {
    const currentLayout = this.getLayout();
    this.savedLayouts.set(name, JSON.parse(JSON.stringify(currentLayout)));
    console.log(`Layout saved: ${name}`);
  }

  /**
   * Load a saved layout
   */
  loadLayout(name: string): void {
    const savedLayout = this.savedLayouts.get(name);
    if (savedLayout) {
      this.setLayout(savedLayout);
      console.log(`Layout loaded: ${name}`);
    } else {
      console.warn(`Layout not found: ${name}`);
    }
  }

  /**
   * Get list of saved layout names
   */
  getSavedLayoutNames(): string[] {
    return Array.from(this.savedLayouts.keys());
  }

  /**
   * Delete a saved layout
   */
  deleteSavedLayout(name: string): void {
    if (this.savedLayouts.delete(name)) {
      console.log(`Layout deleted: ${name}`);
    }
  }

  /**
   * Check if widgets overlap
   */
  checkOverlap(widget1: WidgetLayoutItem, widget2: WidgetLayoutItem): boolean {
    const w1 = widget1.position.x;
    const w1Right = w1 + widget1.size.width;
    const w1Top = widget1.position.y;
    const w1Bottom = w1Top + widget1.size.height;

    const w2 = widget2.position.x;
    const w2Right = w2 + widget2.size.width;
    const w2Top = widget2.position.y;
    const w2Bottom = w2Top + widget2.size.height;

    return !(w1Right <= w2 || w2Right <= w1 || w1Bottom <= w2Top || w2Bottom <= w1Top);
  }

  /**
   * Find a non-overlapping position for a widget
   */
  private findNonOverlappingPosition(widget: WidgetLayoutItem): WidgetPosition {
    let position = { ...widget.position };
    const existingWidgets = Array.from(this.layout.values())
      .filter(w => w.instanceId !== widget.instanceId);

    // Simple algorithm: try positions in a grid pattern
    const step = Math.max(this.gridSize, 50);
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const testWidget: WidgetLayoutItem = { ...widget, position };
      
      const hasOverlap = existingWidgets.some(existing => 
        this.checkOverlap(testWidget, existing)
      );

      if (!hasOverlap) {
        return this.snapToGrid(position);
      }

      // Try next position
      position.x += step;
      if (position.x > 800) { // Wrap to next row
        position.x = 0;
        position.y += step;
      }

      attempts++;
    }

    // If we can't find a non-overlapping position, return the original
    console.warn(`Could not find non-overlapping position for widget ${widget.instanceId}`);
    return this.snapToGrid(widget.position);
  }

  /**
   * Snap position to grid
   */
  private snapToGrid(position: WidgetPosition): WidgetPosition {
    return {
      x: Math.round(position.x / this.gridSize) * this.gridSize,
      y: Math.round(position.y / this.gridSize) * this.gridSize
    };
  }

  /**
   * Snap size to grid
   */
  private snapSizeToGrid(size: WidgetSize): WidgetSize {
    return {
      width: Math.max(this.gridSize, Math.round(size.width / this.gridSize) * this.gridSize),
      height: Math.max(this.gridSize, Math.round(size.height / this.gridSize) * this.gridSize)
    };
  }

  /**
   * Get next available z-index
   */
  private getNextZIndex(): number {
    const currentMax = Math.max(
      ...Array.from(this.layout.values()).map(w => w.zIndex),
      0
    );
    return Math.min(currentMax + 1, this.maxZIndex);
  }

  /**
   * Normalize z-indices to prevent overflow
   */
  private normalizeZIndices(): void {
    const widgets = Array.from(this.layout.values()).sort((a, b) => a.zIndex - b.zIndex);
    widgets.forEach((widget, index) => {
      widget.zIndex = index + 1;
    });
  }

  /**
   * Set grid size
   */
  setGridSize(size: number): void {
    this.gridSize = Math.max(1, size);
  }

  /**
   * Get grid size
   */
  getGridSize(): number {
    return this.gridSize;
  }

  /**
   * Clear layout
   */
  clear(): void {
    this.layout.clear();
  }

  /**
   * Get layout statistics
   */
  getStats(): { widgetCount: number; totalArea: number; bounds: { width: number; height: number } } {
    const widgets = Array.from(this.layout.values());
    
    if (widgets.length === 0) {
      return { widgetCount: 0, totalArea: 0, bounds: { width: 0, height: 0 } };
    }

    const totalArea = widgets.reduce((sum, widget) => 
      sum + (widget.size.width * widget.size.height), 0
    );

    const maxX = Math.max(...widgets.map(w => w.position.x + w.size.width));
    const maxY = Math.max(...widgets.map(w => w.position.y + w.size.height));

    return {
      widgetCount: widgets.length,
      totalArea,
      bounds: { width: maxX, height: maxY }
    };
  }
}

// Global dashboard layout instance
export const dashboardLayout = new DashboardLayout();