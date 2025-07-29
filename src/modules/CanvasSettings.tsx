import React, { useState, useEffect } from 'react';
import { canvasSettings, CanvasSettings as CanvasSettingsType } from '../lib/core/state/CanvasSettings';

export const CanvasSettings: React.FC = () => {
  const [currentCanvasSettings, setCurrentCanvasSettings] = useState<CanvasSettingsType>(canvasSettings.getSettings());

  useEffect(() => {
    // Subscribe to canvas settings changes
    const unsubscribe = canvasSettings.subscribe((settings) => {
      setCurrentCanvasSettings(settings);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: '#fafafa',
      minHeight: '100vh',
      color: '#333'
    }}>
      <h1 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '600' }}>Canvas Settings</h1>
      
      <div style={{ maxWidth: '400px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '500',
            fontSize: '14px' 
          }}>
            Background Color
          </label>
          <input
            type="color"
            value={currentCanvasSettings.backgroundColor}
            onChange={(e) => canvasSettings.updateSettings({ backgroundColor: e.target.value })}
            style={{
              width: '100%',
              height: '40px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            <input
              type="checkbox"
              checked={currentCanvasSettings.gridEnabled}
              onChange={(e) => canvasSettings.updateSettings({ gridEnabled: e.target.checked })}
              style={{ 
                width: '16px', 
                height: '16px',
                cursor: 'pointer'
              }}
            />
            <span>Show Grid</span>
          </label>
        </div>

        {currentCanvasSettings.gridEnabled && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                fontSize: '14px' 
              }}>
                Grid Size: {currentCanvasSettings.gridSize}px
              </label>
              <input
                type="range"
                min="12"
                max="48"
                step="4"
                value={currentCanvasSettings.gridSize}
                onChange={(e) => canvasSettings.updateSettings({ gridSize: parseInt(e.target.value) })}
                style={{ 
                  width: '100%',
                  cursor: 'pointer'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                fontSize: '14px' 
              }}>
                Grid Opacity: {Math.round(currentCanvasSettings.gridOpacity * 100)}%
              </label>
              <input
                type="range"
                min="0.01"
                max="0.1"
                step="0.01"
                value={currentCanvasSettings.gridOpacity}
                onChange={(e) => canvasSettings.updateSettings({ gridOpacity: parseFloat(e.target.value) })}
                style={{ 
                  width: '100%',
                  cursor: 'pointer'
                }}
              />
            </div>
          </>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            <input
              type="checkbox"
              checked={currentCanvasSettings.alwaysOnTop}
              onChange={(e) => canvasSettings.updateSettings({ alwaysOnTop: e.target.checked })}
              style={{ 
                width: '16px', 
                height: '16px',
                cursor: 'pointer'
              }}
            />
            <span>Always on Top</span>
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            <input
              type="checkbox"
              checked={currentCanvasSettings.lockWidgets}
              onChange={(e) => canvasSettings.updateSettings({ lockWidgets: e.target.checked })}
              style={{ 
                width: '16px', 
                height: '16px',
                cursor: 'pointer'
              }}
            />
            <span>Lock Widgets</span>
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            <input
              type="checkbox"
              checked={currentCanvasSettings.showWidgetOutlines}
              onChange={(e) => canvasSettings.updateSettings({ showWidgetOutlines: e.target.checked })}
              style={{ 
                width: '16px', 
                height: '16px',
                cursor: 'pointer'
              }}
            />
            <span>Show Widget Outlines</span>
          </label>
        </div>

        <div style={{ 
          borderTop: '1px solid #ddd', 
          paddingTop: '20px',
          marginTop: '32px'
        }}>
          <button
            onClick={async () => {
              await canvasSettings.resetSettings();
            }}
            style={{
              width: '100%',
              padding: '12px',
              background: '#ff3b30',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d70015';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ff3b30';
            }}
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};