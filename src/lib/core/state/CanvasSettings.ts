export interface CanvasSettings {
  backgroundColor: string;
  backgroundImage?: string;
  gridEnabled: boolean;
  gridSize: number;
  gridOpacity: number;
  alwaysOnTop: boolean;
  lockWidgets: boolean;
  showWidgetOutlines: boolean;
}

export const defaultCanvasSettings: CanvasSettings = {
  backgroundColor: '#fafafa',
  backgroundImage: undefined,
  gridEnabled: true,
  gridSize: 24,
  gridOpacity: 0.02,
  alwaysOnTop: false,
  lockWidgets: false,
  showWidgetOutlines: false
};

class CanvasSettingsManager {
  private settings: CanvasSettings = { ...defaultCanvasSettings };
  private listeners: ((settings: CanvasSettings) => void)[] = [];
  private storageKey = 'canvas-settings';

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        this.settings = { ...defaultCanvasSettings, ...parsedSettings };
      }
    } catch (error) {
      console.warn('Failed to load canvas settings:', error);
      this.settings = { ...defaultCanvasSettings };
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save canvas settings:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.settings));
  }

  getSettings(): CanvasSettings {
    return { ...this.settings };
  }

  async updateSettings(updates: Partial<CanvasSettings>): Promise<void> {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    
    // Handle always on top setting with Tauri
    if (updates.alwaysOnTop !== undefined) {
      try {
        // Import invoke dynamically to avoid issues if running outside Tauri
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('set_always_on_top', { alwaysOnTop: updates.alwaysOnTop });
      } catch (error) {
        console.warn('Failed to set always on top:', error);
        // Continue anyway - the setting will be saved but won't affect the window
      }
    }
    
    this.notifyListeners();
  }

  async resetSettings(): Promise<void> {
    const oldSettings = this.settings;
    this.settings = { ...defaultCanvasSettings };
    this.saveSettings();
    
    // Handle always on top setting with Tauri if it changed
    if (oldSettings.alwaysOnTop !== this.settings.alwaysOnTop) {
      try {
        // Import invoke dynamically to avoid issues if running outside Tauri
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('set_always_on_top', { alwaysOnTop: this.settings.alwaysOnTop });
      } catch (error) {
        console.warn('Failed to set always on top:', error);
      }
    }
    
    this.notifyListeners();
  }

  subscribe(listener: (settings: CanvasSettings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

export const canvasSettings = new CanvasSettingsManager();