import React, { useEffect, useRef, useState } from 'react';
import { widgetRegistry } from '../../core/registry/WidgetRegistry';
import { widgetLifecycleManager } from '../../core/lifecycle/WidgetLifecycleManager';
import { dashboardLayout } from '../../core/state/DashboardLayout';
import { WidgetDefinition, WidgetInstance, WidgetLayoutItem } from '../../widgets/base/Widget';
import './Dashboard.css';

interface DashboardProps {
  className?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [availableWidgets, setAvailableWidgets] = useState<WidgetDefinition[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false
  });
  const [dragData, setDragData] = useState<{
    isDragging: boolean;
    instanceId: string | null;
    offset: { x: number; y: number };
  }>({
    isDragging: false,
    instanceId: null,
    offset: { x: 0, y: 0 }
  });

  useEffect(() => {
    // Load available widgets
    setAvailableWidgets(widgetRegistry.getAllWidgetDefinitions());
    
    // Load existing widgets
    refreshWidgets();
  }, []);

  const refreshWidgets = () => {
    const instances = widgetLifecycleManager.getActiveInstances();
    setWidgets(instances);
  };

  const addWidget = async (widgetId: string) => {
    const dashboardRect = dashboardRef.current?.getBoundingClientRect();
    if (!dashboardRect) return;

    // Get widget definition
    const definition = widgetRegistry.getWidgetDefinition(widgetId);
    if (!definition) return;

    // Calculate size based on canvas width and preferred aspect ratio
    const canvasWidth = dashboardRect.width;
    let widgetWidth = canvasWidth * 0.8; // Use 80% of canvas width
    let widgetHeight: number;

    if (definition.preferredAspectRatio) {
      // Calculate height based on preferred aspect ratio
      const aspectRatio = definition.preferredAspectRatio.width / definition.preferredAspectRatio.height;
      widgetHeight = widgetWidth / aspectRatio;
      
      // Ensure the widget fits within canvas height
      const maxHeight = dashboardRect.height * 0.8;
      if (widgetHeight > maxHeight) {
        // If calculated height is too tall, scale down proportionally
        widgetHeight = maxHeight;
        widgetWidth = widgetHeight * aspectRatio;
      }
    } else {
      // No preferred aspect ratio, use default proportions
      const defaultAspectRatio = definition.defaultSize.width / definition.defaultSize.height;
      widgetHeight = widgetWidth / defaultAspectRatio;
    }

    // Ensure minimum and maximum size constraints
    widgetWidth = Math.max(definition.minSize.width, widgetWidth);
    widgetHeight = Math.max(definition.minSize.height, widgetHeight);

    if (definition.maxSize) {
      widgetWidth = Math.min(definition.maxSize.width, widgetWidth);
      widgetHeight = Math.min(definition.maxSize.height, widgetHeight);
    }

    const size = {
      width: Math.round(widgetWidth),
      height: Math.round(widgetHeight)
    };

    // Center the widget on canvas
    const position = {
      x: Math.max(0, (dashboardRect.width - size.width) / 2),
      y: Math.max(0, (dashboardRect.height - size.height) / 2)
    };

    const instanceId = await widgetLifecycleManager.createWidget(
      widgetId,
      position,
      size
    );

    if (instanceId) {
      const layoutItem: WidgetLayoutItem = {
        instanceId,
        widgetId,
        position,
        size,
        zIndex: 0
      };

      dashboardLayout.addWidget(layoutItem);
      refreshWidgets();
      
      // Render the widget
      renderWidget(instanceId);
    }

    setContextMenu({ x: 0, y: 0, visible: false });
  };

  const removeWidget = (instanceId: string) => {
    // Remove widget element from DOM
    const widgetElement = document.getElementById(`widget-${instanceId}`);
    if (widgetElement) {
      // Clean up resize observer
      const resizeObserver = (widgetElement as any).__resizeObserver;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      widgetElement.remove();
    }

    // Clean up from managers
    widgetLifecycleManager.destroyWidget(instanceId);
    dashboardLayout.removeWidget(instanceId);
    refreshWidgets();
  };

  const renderWidget = (instanceId: string) => {
    const widget = widgetLifecycleManager.getWidget(instanceId);
    const layoutItem = dashboardLayout.getWidgetLayout(instanceId);
    
    if (!widget || !layoutItem || !dashboardRef.current) return;

    // Create widget container
    const container = document.createElement('div');
    container.id = `widget-${instanceId}`;
    container.className = 'widget-container';
    container.style.position = 'absolute';
    container.style.left = `${layoutItem.position.x}px`;
    container.style.top = `${layoutItem.position.y}px`;
    container.style.width = `${layoutItem.size.width}px`;
    container.style.height = `${layoutItem.size.height}px`;
    container.style.zIndex = layoutItem.zIndex.toString();
    // Minimal invisible widget styling
    container.style.border = 'none';
    container.style.borderRadius = '12px'; // Subtle rounding like iOS widgets
    container.style.overflow = 'hidden'; // Back to hidden since we'll handle resize manually
    container.style.backgroundColor = 'transparent';
    container.style.boxShadow = 'none';
    container.style.minWidth = '200px';
    container.style.minHeight = '150px';
    container.style.position = 'relative';
    
    // Add minimal transparent overlay with close button (invisible by default, shown on hover)
    const header = document.createElement('div');
    header.className = 'widget-header';
    header.style.height = '32px'; // Just enough for close button
    header.style.backgroundColor = 'transparent'; // Fully transparent
    header.style.borderBottom = 'none';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'flex-end'; // Close button on right
    header.style.padding = '6px 8px';
    header.style.cursor = 'move'; // Can still drag from header area
    header.style.position = 'absolute';
    header.style.top = '0';
    header.style.left = '0';
    header.style.right = '0';
    header.style.zIndex = '10';
    header.style.opacity = '0'; // Hidden by default
    header.style.transition = 'opacity 0.2s ease';
    header.style.borderRadius = '12px 12px 0 0';

    // macOS-style red close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '';
    closeButton.style.border = 'none';
    closeButton.style.background = '#ff5f57'; // macOS red close button color
    closeButton.style.borderRadius = '50%';
    closeButton.style.width = '14px';
    closeButton.style.height = '14px';
    closeButton.style.minWidth = '14px'; // Prevent stretching
    closeButton.style.maxWidth = '14px'; // Prevent stretching
    closeButton.style.flexShrink = '0'; // Don't shrink
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '10px';
    closeButton.style.color = 'transparent'; // No × symbol, just solid circle
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.transition = 'all 0.2s ease';
    closeButton.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
    closeButton.style.padding = '0'; // Remove any default padding
    
    // Hover effects
    closeButton.onmouseenter = () => {
      closeButton.style.background = '#ff3b30'; // Darker red on hover
      closeButton.style.transform = 'scale(1.1)';
      closeButton.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    };
    closeButton.onmouseleave = () => {
      closeButton.style.background = '#ff5f57';
      closeButton.style.transform = 'scale(1)';
      closeButton.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
    };
    closeButton.onclick = () => removeWidget(instanceId);
    header.appendChild(closeButton);

    // Add drag functionality
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    header.onmousedown = (e) => {
      isDragging = true;
      const rect = container.getBoundingClientRect();
      dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      dashboardLayout.bringToFront(instanceId);
      container.style.zIndex = dashboardLayout.getWidgetLayout(instanceId)?.zIndex.toString() || '1000';
      
      e.preventDefault();
    };

    document.onmousemove = (e) => {
      if (!isDragging) return;
      
      const dashboardRect = dashboardRef.current?.getBoundingClientRect();
      if (!dashboardRect) return;

      const newX = e.clientX - dashboardRect.left - dragOffset.x;
      const newY = e.clientY - dashboardRect.top - dragOffset.y;

      container.style.left = `${Math.max(0, newX)}px`;
      container.style.top = `${Math.max(0, newY)}px`;
    };

    document.onmouseup = () => {
      if (isDragging) {
        isDragging = false;
        
        // Update layout with final position
        const rect = container.getBoundingClientRect();
        const dashboardRect = dashboardRef.current?.getBoundingClientRect();
        
        if (dashboardRect) {
          const finalPosition = {
            x: rect.left - dashboardRect.left,
            y: rect.top - dashboardRect.top
          };
          
          dashboardLayout.moveWidget(instanceId, finalPosition);
          widgetLifecycleManager.updateWidgetPosition(instanceId, finalPosition);
        }
      }
    };

    // Add widget content container (full height since header is floating)
    const content = document.createElement('div');
    content.className = 'widget-content';
    content.style.height = '100%';
    content.style.overflow = 'hidden';
    content.style.borderRadius = '12px'; // Match container radius

    container.appendChild(header);
    container.appendChild(content);
    
    // Add hover effects after elements are created
    container.style.transition = 'all 0.2s ease';
    // Add custom resize handle with proper cursor and drag functionality
    const resizeHandle = document.createElement('div');
    resizeHandle.style.position = 'absolute';
    resizeHandle.style.bottom = '0';
    resizeHandle.style.right = '0';
    resizeHandle.style.width = '20px';
    resizeHandle.style.height = '20px';
    resizeHandle.style.background = 'rgba(0,0,0,0.1)';
    resizeHandle.style.borderRadius = '12px 0 12px 0'; // Match container radius
    resizeHandle.style.opacity = '0';
    resizeHandle.style.transition = 'all 0.2s ease';
    resizeHandle.style.cursor = 'nw-resize'; // Windows-style resize cursor
    resizeHandle.style.zIndex = '15';
    resizeHandle.style.pointerEvents = 'auto'; // Enable clicks
    
    // Add grip dots pattern
    resizeHandle.innerHTML = `
      <div style="
        position: absolute;
        bottom: 3px;
        right: 3px;
        width: 2px;
        height: 2px;
        background: rgba(0,0,0,0.5);
        border-radius: 50%;
      "></div>
      <div style="
        position: absolute;
        bottom: 3px;
        right: 7px;
        width: 2px;
        height: 2px;
        background: rgba(0,0,0,0.5);
        border-radius: 50%;
      "></div>
      <div style="
        position: absolute;
        bottom: 7px;
        right: 3px;
        width: 2px;
        height: 2px;
        background: rgba(0,0,0,0.5);
        border-radius: 50%;
      "></div>
      <div style="
        position: absolute;
        bottom: 7px;
        right: 7px;
        width: 2px;
        height: 2px;
        background: rgba(0,0,0,0.5);
        border-radius: 50%;
      "></div>
    `;
    
    // Optimized custom resize functionality
    let isResizing = false;
    let resizeStartPos = { x: 0, y: 0 };
    let resizeStartSize = { width: 0, height: 0 };
    let animationFrameId: number | null = null;
    let pendingResize = false;
    let currentMousePos = { x: 0, y: 0 };
    
    // Pre-calculate aspect ratio if locked
    const aspectRatio = widget.preferredAspectRatio?.locked 
      ? widget.preferredAspectRatio.width / widget.preferredAspectRatio.height 
      : null;
    
    const performResize = () => {
      if (!pendingResize || !isResizing) return;
      
      const deltaX = currentMousePos.x - resizeStartPos.x;
      const deltaY = currentMousePos.y - resizeStartPos.y;
      
      let newWidth = resizeStartSize.width + deltaX;
      let newHeight = resizeStartSize.height + deltaY;
      
      // Respect min constraints
      newWidth = Math.max(10, newWidth);
      newHeight = Math.max(10, newHeight);
      
      // Handle aspect ratio if widget has locked ratio
      if (aspectRatio) {
        const currentRatio = newWidth / newHeight;
        
        if (Math.abs(currentRatio - aspectRatio) > 0.01) {
          // Prioritize the dimension that changed more
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = newHeight * aspectRatio;
          }
        }
      }
      
      // Apply new size immediately (this is the visual update)
      container.style.width = `${newWidth}px`;
      container.style.height = `${newHeight}px`;
      
      pendingResize = false;
    };
    
    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      isResizing = true;
      resizeStartPos = { x: e.clientX, y: e.clientY };
      resizeStartSize = {
        width: container.offsetWidth,
        height: container.offsetHeight
      };
      
      document.body.style.cursor = 'nw-resize';
      document.body.style.userSelect = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      
      // Store mouse position
      currentMousePos = { x: e.clientX, y: e.clientY };
      
      // Only queue an update if one isn't already pending
      if (!pendingResize) {
        pendingResize = true;
        animationFrameId = requestAnimationFrame(performResize);
      }
    });
    
    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        pendingResize = false;
        
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // Final update to layout managers (heavy operations done once at end)
        const finalWidth = container.offsetWidth;
        const finalHeight = container.offsetHeight;
        const finalSize = { width: finalWidth, height: finalHeight };
        
        dashboardLayout.resizeWidget(instanceId, finalSize);
        widgetLifecycleManager.updateWidgetSize(instanceId, finalSize);
        
        // Notify widget of final size
        if (widget && typeof widget.onResize === 'function') {
          widget.onResize(finalWidth, finalHeight);
        }
      }
    });
    
    container.appendChild(resizeHandle);

    container.addEventListener('mouseenter', () => {
      container.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
      container.style.transform = 'translateY(-2px)';
      header.style.opacity = '1'; // Show header on hover
      resizeHandle.style.opacity = '1'; // Show resize handle
    });
    container.addEventListener('mouseleave', () => {
      if (!isResizing) { // Don't hide while resizing
        container.style.boxShadow = 'none';
        container.style.transform = 'translateY(0)';
        header.style.opacity = '0'; // Hide header when not hovering
        resizeHandle.style.opacity = '0'; // Hide resize handle
      }
    });

    // Render widget into content area
    try {
      widget.render(content);
    } catch (error) {
      console.error(`Error rendering widget ${instanceId}:`, error);
      content.innerHTML = `<div style="padding: 10px; color: red;">Error rendering widget</div>`;
    }

    // Add resize observer to handle widget resizing
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        let newWidth = entry.contentRect.width;
        let newHeight = entry.contentRect.height;
        
        // Handle aspect ratio constraints
        if (widget.preferredAspectRatio?.locked) {
          const aspectRatio = widget.preferredAspectRatio.width / widget.preferredAspectRatio.height;
          const currentAspectRatio = newWidth / newHeight;
          
          // Adjust dimensions to maintain aspect ratio
          // We'll prioritize the dimension that changed more
          if (Math.abs(currentAspectRatio - aspectRatio) > 0.01) { // Allow small tolerance
            const targetHeight = newWidth / aspectRatio;
            const targetWidth = newHeight * aspectRatio;
            
            // Choose the adjustment that results in smaller widget (stays within bounds)
            if (targetHeight <= newHeight) {
              newHeight = targetHeight;
            } else {
              newWidth = targetWidth;
            }
            
            // Apply the corrected dimensions
            container.style.width = `${newWidth}px`;
            container.style.height = `${newHeight}px`;
          }
        }
        
        // Update layout with final size
        const newSize = { width: newWidth, height: newHeight };
        dashboardLayout.resizeWidget(instanceId, newSize);
        
        // Notify widget of resize
        widgetLifecycleManager.updateWidgetSize(instanceId, newSize);
        
        // Call widget's onResize method if it exists
        if (widget && typeof widget.onResize === 'function') {
          widget.onResize(newWidth, newHeight);
        }
      }
    });
    
    resizeObserver.observe(container);
    
    // Store observer for cleanup
    (container as any).__resizeObserver = resizeObserver;

    dashboardRef.current.appendChild(container);
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true
    });
  };

  // Hide context menu on click elsewhere
  const handleCanvasClick = () => {
    if (contextMenu.visible) {
      setContextMenu({ x: 0, y: 0, visible: false });
    }
  };

  // Hide context menu on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu({ x: 0, y: 0, visible: false });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Render all existing widgets when component updates
  useEffect(() => {
    if (!dashboardRef.current) return;

    // Clear existing widget containers
    const existingWidgets = dashboardRef.current.querySelectorAll('.widget-container');
    existingWidgets.forEach(el => el.remove());

    // Render all active widgets
    widgets.forEach(widget => {
      renderWidget(widget.instanceId);
    });
  }, [widgets]);

  return (
    <div className={`dashboard ${className}`}>
      <div 
        ref={dashboardRef}
        className="dashboard-canvas"
        onContextMenu={handleContextMenu}
        onClick={handleCanvasClick}
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          backgroundColor: '#fafafa', // Cleaner, more minimal background
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.02) 1px, transparent 1px)', // Much more subtle grid
          backgroundSize: '24px 24px', // Slightly larger grid for cleaner look
          overflow: 'hidden',
          cursor: 'default'
        }}
      />

      {contextMenu.visible && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 10000,
            minWidth: '150px',
            padding: '4px 0',
            fontSize: '14px'
          }}
        >
          <div style={{ padding: '6px 12px', fontWeight: 'bold', borderBottom: '1px solid #eee', color: '#666' }}>
            Add Widget
          </div>
          {availableWidgets.map(widget => (
            <div 
              key={widget.id}
              className="context-menu-item"
              onClick={() => addWidget(widget.id)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ fontWeight: '500' }}>{widget.name}</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                {widget.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};