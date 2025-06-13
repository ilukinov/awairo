import { BaseWidget, WidgetPermission, WidgetSetting, PermissionType } from '../base/Widget';

interface CompletedPomodoro {
  id: string;
  timestamp: number;
  duration: number;
  comment?: string;
  committed: boolean;
}

export class PomodoroWidget extends BaseWidget {
  id = 'pomodoro-timer';
  name = 'Pomodoro Timer';
  description = 'A productivity timer using the Pomodoro Technique';
  version = '1.0.0';
  author = 'An Apple A Day';
  category = 'interactive' as const;
  
  minSize = { width: 300, height: 200 };
  defaultSize = { width: 400, height: 300 };
  maxSize = { width: 600, height: 500 };
  
  permissions: WidgetPermission[] = [
    {
      type: PermissionType.Notification,
      scope: 'timer-alerts',
      description: 'Show notifications when timer completes'
    }
  ];

  settings: WidgetSetting[] = [
    {
      id: 'pomodoroLength',
      type: 'number',
      label: 'Pomodoro Length (minutes)',
      description: 'Duration of work sessions',
      default: 25,
      min: 1,
      max: 60
    },
    {
      id: 'shortBreak',
      type: 'number',
      label: 'Short Break (minutes)',
      description: 'Duration of short breaks',
      default: 5,
      min: 1,
      max: 30
    },
    {
      id: 'longBreak',
      type: 'number',
      label: 'Long Break (minutes)',
      description: 'Duration of long breaks (after 4 pomodoros)',
      default: 15,
      min: 5,
      max: 60
    },
    {
      id: 'dailyGoal',
      type: 'number',
      label: 'Daily Goal',
      description: 'Target number of pomodoros per day',
      default: 8,
      min: 1,
      max: 20
    },
    {
      id: 'pomodoroIcon',
      type: 'text',
      label: 'Pomodoro Icon',
      description: 'Emoji to represent completed pomodoros',
      default: '🍎'
    }
  ];

  // Internal state
  private timerLength: number = 25 * 60; // 25 minutes in seconds
  private secondsLeft: number = this.timerLength;
  private isRunning: boolean = false;
  private completedPomodoros: CompletedPomodoro[] = [];
  private dailyGoal: number = 8;
  private pomodoroIcon: string = '🍎';
  private intervalId: number | null = null;

  async initialize(config?: Record<string, any>): Promise<void> {
    console.log('PomodoroWidget: Initializing...');
    
    if (config) {
      this.updateConfig(config);
    }

    // Load saved data from localStorage
    this.loadFromStorage();
    
    console.log('PomodoroWidget: Initialized successfully');
  }

  render(container: HTMLElement): void {
    console.log('PomodoroWidget: Rendering...');
    container.innerHTML = this.generateHTML();
    this.attachEventListeners(container);
    this.updateDisplay();
  }

  update(): void {
    if (this.container) {
      this.updateDisplay();
    }
  }

  destroy(): void {
    console.log('PomodoroWidget: Destroying...');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  onResize(width: number, height: number): void {
    // Adjust layout based on size if needed
    console.log(`PomodoroWidget: Resized to ${width}x${height}`);
  }

  onSettingsChange(settings: Record<string, any>): void {
    console.log('PomodoroWidget: Settings changed', settings);
    
    if (settings.pomodoroLength) {
      this.timerLength = settings.pomodoroLength * 60;
      if (!this.isRunning) {
        this.secondsLeft = this.timerLength;
      }
    }

    if (settings.dailyGoal) {
      this.dailyGoal = settings.dailyGoal;
    }

    if (settings.pomodoroIcon) {
      this.pomodoroIcon = settings.pomodoroIcon;
    }

    this.saveToStorage();
    this.update();
  }

  getState(): Record<string, any> {
    return {
      timerLength: this.timerLength,
      secondsLeft: this.secondsLeft,
      isRunning: this.isRunning,
      completedPomodoros: this.completedPomodoros,
      dailyGoal: this.dailyGoal,
      pomodoroIcon: this.pomodoroIcon
    };
  }

  setState(state: Record<string, any>): void {
    if (state.timerLength) this.timerLength = state.timerLength;
    if (state.secondsLeft) this.secondsLeft = state.secondsLeft;
    if (state.isRunning !== undefined) this.isRunning = state.isRunning;
    if (state.completedPomodoros) this.completedPomodoros = state.completedPomodoros;
    if (state.dailyGoal) this.dailyGoal = state.dailyGoal;
    if (state.pomodoroIcon) this.pomodoroIcon = state.pomodoroIcon;

    if (this.isRunning) {
      this.startTimer();
    }

    this.update();
  }

  private generateHTML(): string {
    const minutes = Math.floor(this.secondsLeft / 60);
    const seconds = this.secondsLeft % 60;
    const todayPomodoros = this.getTodayPomodoros();

    return `
      <div class="pomodoro-widget">
        <div class="timer-display">
          <div class="time">${minutes}:${seconds.toString().padStart(2, '0')}</div>
          <div class="timer-controls">
            <button class="start-btn" ${this.isRunning ? 'disabled' : ''}>Start</button>
            <button class="pause-btn" ${!this.isRunning ? 'disabled' : ''}>Pause</button>
            <button class="reset-btn">Reset</button>
          </div>
        </div>
        
        <div class="progress-section">
          <div class="daily-progress">
            <div class="progress-label">Daily Progress: ${todayPomodoros.length}/${this.dailyGoal}</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(100, (todayPomodoros.length / this.dailyGoal) * 100)}%"></div>
            </div>
          </div>
          
          <div class="pomodoro-dots">
            ${this.generatePomodoroDots()}
          </div>
        </div>
      </div>
    `;
  }

  private generatePomodoroDots(): string {
    const todayPomodoros = this.getTodayPomodoros();
    const uncommittedPomodoros = this.getUncommittedTodayPomodoros();
    const totalCompleted = todayPomodoros.length;
    const totalUncommitted = uncommittedPomodoros.length;
    
    let dots = '';
    
    // Committed pomodoros
    for (let i = 0; i < totalCompleted; i++) {
      dots += `<span class="pomodoro-dot committed">${this.pomodoroIcon}</span>`;
    }
    
    // Uncommitted pomodoros
    for (let i = 0; i < totalUncommitted; i++) {
      dots += `<span class="pomodoro-dot uncommitted">${this.pomodoroIcon}</span>`;
    }
    
    // Empty slots up to daily goal
    const remaining = Math.max(0, this.dailyGoal - totalCompleted - totalUncommitted);
    for (let i = 0; i < remaining; i++) {
      dots += `<span class="pomodoro-dot empty">${this.pomodoroIcon}</span>`;
    }
    
    return dots;
  }

  private attachEventListeners(container: HTMLElement): void {
    const startBtn = container.querySelector('.start-btn') as HTMLButtonElement;
    const pauseBtn = container.querySelector('.pause-btn') as HTMLButtonElement;
    const resetBtn = container.querySelector('.reset-btn') as HTMLButtonElement;

    startBtn?.addEventListener('click', () => this.startTimer());
    pauseBtn?.addEventListener('click', () => this.pauseTimer());
    resetBtn?.addEventListener('click', () => this.resetTimer());
  }

  private startTimer(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.intervalId = window.setInterval(() => {
      this.secondsLeft--;
      
      if (this.secondsLeft <= 0) {
        this.handleTimerComplete();
      }
      
      this.updateDisplay();
    }, 1000);

    this.updateDisplay();
  }

  private pauseTimer(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.updateDisplay();
  }

  private resetTimer(): void {
    this.pauseTimer();
    this.secondsLeft = this.timerLength;
    this.updateDisplay();
  }

  private handleTimerComplete(): void {
    this.pauseTimer();
    
    const newPomodoro: CompletedPomodoro = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      duration: this.timerLength,
      committed: false
    };
    
    this.completedPomodoros.push(newPomodoro);
    this.saveToStorage();
    
    // Reset timer for next session
    this.secondsLeft = this.timerLength;
    this.updateDisplay();
    
    // Show notification if permission granted
    this.showNotification('Pomodoro completed! Take a break.');
  }

  private updateDisplay(): void {
    if (!this.container) return;

    const timeDisplay = this.container.querySelector('.time');
    const startBtn = this.container.querySelector('.start-btn') as HTMLButtonElement;
    const pauseBtn = this.container.querySelector('.pause-btn') as HTMLButtonElement;
    const progressFill = this.container.querySelector('.progress-fill') as HTMLElement;
    const progressLabel = this.container.querySelector('.progress-label');
    const pomodoroDots = this.container.querySelector('.pomodoro-dots');

    if (timeDisplay) {
      const minutes = Math.floor(this.secondsLeft / 60);
      const seconds = this.secondsLeft % 60;
      timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    if (startBtn) startBtn.disabled = this.isRunning;
    if (pauseBtn) pauseBtn.disabled = !this.isRunning;

    const todayPomodoros = this.getTodayPomodoros();
    if (progressFill) {
      const percentage = Math.min(100, (todayPomodoros.length / this.dailyGoal) * 100);
      progressFill.style.width = `${percentage}%`;
    }

    if (progressLabel) {
      progressLabel.textContent = `Daily Progress: ${todayPomodoros.length}/${this.dailyGoal}`;
    }

    if (pomodoroDots) {
      pomodoroDots.innerHTML = this.generatePomodoroDots();
    }
  }

  private getTodayPomodoros(): CompletedPomodoro[] {
    const today = new Date().setHours(0, 0, 0, 0);
    return this.completedPomodoros.filter(p => {
      const pomodoroDate = new Date(p.timestamp).setHours(0, 0, 0, 0);
      return pomodoroDate === today && p.committed;
    });
  }

  private getUncommittedTodayPomodoros(): CompletedPomodoro[] {
    const today = new Date().setHours(0, 0, 0, 0);
    return this.completedPomodoros.filter(p => {
      const pomodoroDate = new Date(p.timestamp).setHours(0, 0, 0, 0);
      return pomodoroDate === today && !p.committed;
    });
  }

  private showNotification(message: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Timer', {
        body: message,
        icon: '/favicon.png'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Pomodoro Timer', {
            body: message,
            icon: '/favicon.png'
          });
        }
      });
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('pomodoroWidget-completedPomodoros');
      if (saved) {
        this.completedPomodoros = JSON.parse(saved);
      }

      const settings = localStorage.getItem('pomodoroWidget-settings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        this.onSettingsChange(parsedSettings);
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('pomodoroWidget-completedPomodoros', JSON.stringify(this.completedPomodoros));
      localStorage.setItem('pomodoroWidget-settings', JSON.stringify(this.getConfig()));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }
}

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
.pomodoro-widget {
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.timer-display {
  text-align: center;
  margin-bottom: 20px;
}

.time {
  font-size: 48px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  font-variant-numeric: tabular-nums;
}

.timer-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.timer-controls button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.start-btn {
  background: #34C759;
  color: white;
}

.start-btn:hover:not(:disabled) {
  background: #28A745;
}

.pause-btn {
  background: #FF9500;
  color: white;
}

.pause-btn:hover:not(:disabled) {
  background: #E6830D;
}

.reset-btn {
  background: #FF3B30;
  color: white;
}

.reset-btn:hover {
  background: #D70015;
}

.timer-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-section {
  flex: 1;
}

.daily-progress {
  margin-bottom: 16px;
}

.progress-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.progress-bar {
  height: 8px;
  background: #E5E5E7;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #34C759;
  transition: width 0.3s ease;
}

.pomodoro-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.pomodoro-dot {
  font-size: 24px;
  transition: opacity 0.2s;
}

.pomodoro-dot.committed {
  opacity: 1;
}

.pomodoro-dot.uncommitted {
  opacity: 0.7;
}

.pomodoro-dot.empty {
  opacity: 0.3;
}
`;

if (!document.head.querySelector('style[data-widget="pomodoro"]')) {
  style.setAttribute('data-widget', 'pomodoro');
  document.head.appendChild(style);
}