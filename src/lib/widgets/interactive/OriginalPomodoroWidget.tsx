import React, { useState, useEffect } from "react";
import { BaseWidget, WidgetPermission, PermissionType, WidgetAspectRatio } from '../base/Widget';
import { PomodoroDialog } from '../../../modules/PomodoroDialog';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import '../../../modules/PomodoroTimer.css';

const POMODORO_DURATION = 0.1; // Pomodoro duration in minutes
const BREAK_DURATION = 5; // Break duration in minutes
const options = ['Working', 'Meeting', 'Other']; // Simplified options

interface CompletedPomodoro {
  id: string;
  timestamp: number;
  duration: number;
  comment?: string;
  committed: boolean;
}

/**
 * Original Pomodoro Timer converted to widget format
 * Preserves ALL original functionality including settings and history
 */
export class OriginalPomodoroWidget extends BaseWidget {
  id = 'original-pomodoro-timer';
  name = 'Pomodoro Timer';
  description = 'Full-featured Pomodoro timer with settings and history';
  version = '1.0.0';
  author = 'An Apple A Day';
  category = 'interactive' as const;
  
  minSize = { width: 400, height: 400 };
  defaultSize = { width: 450, height: 500 };
  maxSize = { width: 600, height: 700 };
  
  permissions: WidgetPermission[] = [
    {
      type: PermissionType.Notification,
      scope: 'timer-alerts',
      description: 'Show notifications when timer completes'
    }
  ];
  
  preferredAspectRatio = {
    width: 100,
    height: 55,
    locked: true // Maintain this ratio for optimal timer display
  };

  private reactRoot: any = null;

  async initialize(config?: Record<string, any>): Promise<void> {
    console.log('OriginalPomodoroWidget: Initializing with full functionality...');
  }

  /**
   * Apply container-based scaling by overriding all viewport units with container-relative values
   */
  private applyWidgetScaling(container: HTMLElement): void {
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate container-relative sizes (not viewport relative)
    // Original design was based on viewport, now we base it on container
    const baseContainerWidth = 450;
    const baseContainerHeight = 500;
    
    // Calculate pixel values for each vw/vh used in original CSS
    const vwToPx = (vw: number) => (vw / 100) * containerWidth;
    const vhToPx = (vh: number) => (vh / 100) * containerHeight;
    
    // Create a unique container ID for specificity
    const uniqueId = `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    container.setAttribute('data-widget-id', uniqueId);
    
    // Create highly specific CSS that overrides the original viewport-based styles
    const styleId = 'pomodoro-widget-container-scaling';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    // Use extremely specific selectors to override the original CSS
    styleElement.textContent = `
      /* Override viewport-based sizing with container-based sizing */
      [data-widget-id="${uniqueId}"] .pomodoro-container .display {
        font-size: ${vwToPx(30)}px !important;
      }
      
      [data-widget-id="${uniqueId}"] .pomodoro-container button {
        font-size: ${vwToPx(7)}px !important;
        height: ${vwToPx(21.5)}px !important;
        margin: ${vwToPx(0.5)}px !important;
      }
      
      [data-widget-id="${uniqueId}"] .pomodoro-container .pomodoro-icon {
        font-size: ${vwToPx(6.5)}px !important;
      }
      
      [data-widget-id="${uniqueId}"] .pomodoro-container .pomodoro-item:not(.committed):not(.empty) .pomodoro-icon {
        font-size: ${vwToPx(5)}px !important;
      }
      
      [data-widget-id="${uniqueId}"] .pomodoro-container .completed-pomodoros {
        margin: ${vwToPx(1)}px 0 !important;
      }
      
      [data-widget-id="${uniqueId}"] .pomodoro-container .tasks-row {
        height: ${vwToPx(21.5)}px !important;
        font-size: 1em !important;
      }
      
      [data-widget-id="${uniqueId}"] .pomodoro-container .apple {
        font-size: ${vwToPx(10)}px !important;
      }
      
      [data-widget-id="${uniqueId}"] .pomodoro-container .dropdown {
        font-size: ${vwToPx(7)}px !important;
      }
      
      /* Ensure container doesn't scale with viewport */
      [data-widget-id="${uniqueId}"] .pomodoro-container {
        width: 100% !important;
        height: 100% !important;
        font-size: initial !important;
      }
    `;
  }

  render(container: HTMLElement): void {
    console.log('OriginalPomodoroWidget: Rendering original timer...');
    
    // Import React and ReactDOM dynamically to avoid bundling issues
    import('react').then(React => {
      import('react-dom/client').then(ReactDOM => {
        // Create the React component with full original functionality
        const PomodoroTimerComponent = () => {
          const [timerLength, setTimerLength] = useState(() => {
            const saved = localStorage.getItem('timerLength');
            if (saved) {
              const { hours, minutes, seconds } = JSON.parse(saved);
              return (hours * 3600) + (minutes * 60) + seconds;
            }
            return 25 * 60; // Default 25 minutes
          });

          const [secondsLeft, setSecondsLeft] = useState(timerLength);
          const [isRunning, setIsRunning] = useState(false);
          const [completedPomodoros, setCompletedPomodoros] = useState<CompletedPomodoro[]>([]);
          const [selectedPomodoroId, setSelectedPomodoroId] = useState<string | null>(null);
          const [pomodoroIcon, setPomodoroIcon] = useState('🍎');
          const [dailyGoal, setDailyGoal] = useState(() => {
            const saved = localStorage.getItem('dailyGoal');
            return saved ? parseInt(saved) : 8; // Default to 8 pomodoros
          });
          const [showControls, setShowControls] = useState(false);

          useEffect(() => {
            if (isRunning && secondsLeft > 0) {
              const timeoutId = setTimeout(() => {
                setSecondsLeft(secondsLeft - 1);
              }, 1000);
              return () => clearTimeout(timeoutId);
            }
            if (secondsLeft === 0) {
              setIsRunning(false);
              if (isRunning) {
                handleTimerComplete();
              }
            }
          }, [isRunning, secondsLeft]);

          useEffect(() => {
            const saved = localStorage.getItem('completedPomodoros');
            if (saved) {
              try {
                const parsedPomodoros = JSON.parse(saved);
                setCompletedPomodoros(parsedPomodoros);
              } catch (e) {
                console.error('Error loading pomodoros from localStorage:', e);
                localStorage.removeItem('completedPomodoros');
              }
            }
          }, []);

          useEffect(() => {
            const savedIcon = localStorage.getItem('pomodoroIcon');
            if (savedIcon) {
              setPomodoroIcon(savedIcon);
            }
          }, []);

          useEffect(() => {
            const handleStorageChange = (e: StorageEvent) => {
              if (e.key === 'pomodoroIcon' && e.newValue) {
                setPomodoroIcon(e.newValue);
              }
            };

            window.addEventListener('storage', handleStorageChange);
            return () => window.removeEventListener('storage', handleStorageChange);
          }, []);

          useEffect(() => {
            const handleStorageChange = (e: StorageEvent) => {
              if (e.key === 'timerLength' && e.newValue) {
                const { hours, minutes, seconds } = JSON.parse(e.newValue);
                setTimerLength((hours * 3600) + (minutes * 60) + seconds);
                if (!isRunning) {
                  setSecondsLeft((hours * 3600) + (minutes * 60) + seconds);
                }
              }
            };

            window.addEventListener('storage', handleStorageChange);
            return () => window.removeEventListener('storage', handleStorageChange);
          }, [isRunning]);

          useEffect(() => {
            const handleStorageChange = (e: StorageEvent) => {
              if (e.key === 'dailyGoal' && e.newValue) {
                setDailyGoal(parseInt(e.newValue));
              }
            };

            window.addEventListener('storage', handleStorageChange);
            return () => window.removeEventListener('storage', handleStorageChange);
          }, []);

          function startTimer() {
            if (secondsLeft === 0) {
              setSecondsLeft(timerLength);
            }
            setIsRunning(true);
          }

          function pauseTimer() {
            if(isRunning) {
              setIsRunning(false);
            }
          }

          function resetTimer() {
            setIsRunning(false);
            setSecondsLeft(timerLength);
          }

          const minutes = Math.floor(secondsLeft / 60);
          const seconds = secondsLeft % 60;

          const handlePomodoroClick = (id: string) => {
            setSelectedPomodoroId(id);
          };

          const handlePomodoroSave = (id: string, updates: Partial<CompletedPomodoro>) => {
            setCompletedPomodoros(prev => {
              const updatedPomodoros = prev.map(p => 
                p.id === id ? { ...p, ...updates } : p
              );
              localStorage.setItem('completedPomodoros', JSON.stringify(updatedPomodoros));
              return updatedPomodoros;
            });
          };

          const handlePomodoroCommit = (id: string) => {
            setCompletedPomodoros(prev => {
              const updatedPomodoros = prev.map(p =>
                p.id === id ? { ...p, committed: true } : p
              );
              localStorage.setItem('completedPomodoros', JSON.stringify(updatedPomodoros));
              return updatedPomodoros;
            });
            setSelectedPomodoroId(null);
          };

          const handlePomodoroDelete = (id: string) => {
            if (window.confirm('Are you sure you want to delete this pomodoro?')) {
              setCompletedPomodoros(prev => {
                const updatedPomodoros = prev.filter(p => p.id !== id);
                localStorage.setItem('completedPomodoros', JSON.stringify(updatedPomodoros));
                return updatedPomodoros;
              });
            }
          };

          const openSettings = async () => {
            setShowControls(false);
            
            try {
              console.log('Creating settings window...');
              const settingsWindow = new WebviewWindow('settings', {
                url: '/src/settings.html',
                title: 'Settings',
                width: 400,
                height: 600,
                decorations: true,
                resizable: true,
                center: true,
                alwaysOnTop: true,
                focus: true,
              });

              console.log('Settings window created, setting always on top...');
              await settingsWindow.setAlwaysOnTop(true);
              console.log('Settings window configured successfully');
            } catch (error) {
              console.error('Settings window creation failed:', error);
            }
          };

          const openHistory = async () => {
            setShowControls(false);
            
            try {
              console.log('Creating history window...');
              const historyWindow = new WebviewWindow('history', {
                url: '/src/history.html',
                title: 'History',
                width: 1200,
                height: 800,
                decorations: true,
                resizable: true,
                center: true,
                alwaysOnTop: true,
                focus: true,
              });

              console.log('History window created, setting always on top...');
              await historyWindow.setAlwaysOnTop(true);
              console.log('History window configured successfully');
            } catch (error) {
              console.error('History window creation failed:', error);
            }
          };

          const handleTimerComplete = () => {
            const newPomodoro: CompletedPomodoro = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              duration: timerLength,
              committed: false
            };
            
            setCompletedPomodoros(prev => {
              const updatedPomodoros = [...prev, newPomodoro];
              localStorage.setItem('completedPomodoros', JSON.stringify(updatedPomodoros));
              return updatedPomodoros;
            });
          };

          const getTodayPomodoros = () => {
            const today = new Date().setHours(0, 0, 0, 0);
            return completedPomodoros.filter(p => {
              const pomodoroDate = new Date(p.timestamp).setHours(0, 0, 0, 0);
              return pomodoroDate === today && p.committed;
            });
          };

          const getAllTodayPomodoros = () => {
            const today = new Date().setHours(0, 0, 0, 0);
            return completedPomodoros.filter(p => {
              const pomodoroDate = new Date(p.timestamp).setHours(0, 0, 0, 0);
              return pomodoroDate === today;
            });
          };

          const getUncommittedTodayPomodoros = () => {
            const today = new Date().setHours(0, 0, 0, 0);
            return completedPomodoros.filter(p => {
              const pomodoroDate = new Date(p.timestamp).setHours(0, 0, 0, 0);
              return pomodoroDate === today && !p.committed;
            });
          };

          const isDailyGoalAchieved = () => {
            return getTodayPomodoros().length >= dailyGoal;
          };

          return React.createElement('div', { className: 'pomodoro-container' }, [
            React.createElement('div', {
              key: 'timer',
              className: 'timer',
              onMouseEnter: () => setShowControls(true),
              onMouseLeave: () => setShowControls(false)
            }, [
              React.createElement('div', { key: 'display', className: 'display' }, 
                `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`
              ),
              React.createElement('div', {
                key: 'controls',
                className: `controls ${showControls ? 'visible' : ''}`
              }, [
                React.createElement('div', { key: 'buttons-row-1', className: 'buttons-row' }, [
                  React.createElement('button', { key: 'start', onClick: startTimer }, 'Start'),
                  React.createElement('button', { key: 'pause', onClick: pauseTimer }, 'Pause'),
                  React.createElement('button', { key: 'reset', onClick: resetTimer }, 'Reset')
                ]),
                React.createElement('div', { key: 'buttons-row-2', className: 'buttons-row' }, [
                  React.createElement('button', { key: 'history', onClick: openHistory }, 'History'),
                  React.createElement('button', { key: 'settings', onClick: openSettings }, 'Settings')
                ])
              ])
            ]),
            React.createElement('div', { key: 'completed', className: 'completed-pomodoros' }, 
              (() => {
                // Calculate all pomodoros to display
                const committedPomodoros = getTodayPomodoros();
                const uncommittedPomodoros = getUncommittedTodayPomodoros();
                
                // Calculate how many empty pomodoros we need to show
                const emptyPomodorosCount = Math.max(0, dailyGoal - committedPomodoros.length - uncommittedPomodoros.length);
                
                // Create an array of all pomodoro items to display
                const allPomodoros = [
                  // First, add all committed pomodoros
                  ...committedPomodoros.map(pomodoro => ({
                    id: pomodoro.id,
                    type: 'committed',
                    data: pomodoro
                  })),
                  
                  // Then, add all uncommitted pomodoros
                  ...uncommittedPomodoros.map(pomodoro => ({
                    id: pomodoro.id,
                    type: 'uncommitted',
                    data: pomodoro
                  })),
                  
                  // Finally, add empty pomodoros up to the daily goal
                  ...Array.from({ length: emptyPomodorosCount }).map((_, i) => ({
                    id: `empty-${i}`,
                    type: 'empty'
                  }))
                ];
                
                // Split the pomodoros into rows of 10
                const rows = [];
                for (let i = 0; i < allPomodoros.length; i += 10) {
                  rows.push(allPomodoros.slice(i, i + 10));
                }
                
                // Render each row
                return rows.map((row, rowIndex) =>
                  React.createElement('div', { key: `row-${rowIndex}`, className: 'pomodoro-row' },
                    row.map(item => {
                      if (item.type === 'committed') {
                        return React.createElement('div', {
                          key: item.id,
                          className: `pomodoro-item committed ${isDailyGoalAchieved() ? 'goal-achieved' : ''}`
                        }, React.createElement('div', { className: 'pomodoro-icon' }, pomodoroIcon));
                      } else if (item.type === 'uncommitted') {
                        return React.createElement('div', {
                          key: item.id,
                          className: `pomodoro-item ${isDailyGoalAchieved() ? 'goal-achieved' : ''}`
                        }, React.createElement('div', {
                          className: 'pomodoro-icon',
                          onClick: () => handlePomodoroClick(item.id)
                        }, pomodoroIcon));
                      } else {
                        return React.createElement('div', {
                          key: item.id,
                          className: `pomodoro-item empty ${isDailyGoalAchieved() ? 'goal-achieved' : ''}`
                        }, React.createElement('div', { className: 'pomodoro-icon' }, pomodoroIcon));
                      }
                    })
                  )
                );
              })()
            ),
            selectedPomodoroId && React.createElement(PomodoroDialog, {
              key: 'dialog',
              pomodoro: completedPomodoros.find(p => p.id === selectedPomodoroId)!,
              onSave: handlePomodoroSave,
              onCommit: handlePomodoroCommit,
              onClose: () => setSelectedPomodoroId(null)
            })
          ]);
        };

        // Render the component
        this.reactRoot = ReactDOM.createRoot(container);
        this.reactRoot.render(React.createElement(PomodoroTimerComponent));
        
        // Apply scaling after render
        setTimeout(() => {
          this.applyWidgetScaling(container);
        }, 100);
      });
    });
  }

  update(): void {
    // React component handles its own updates
  }

  destroy(): void {
    console.log('OriginalPomodoroWidget: Destroying...');
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
  }

  onResize(width: number, height: number): void {
    console.log(`OriginalPomodoroWidget: Resized to ${width}x${height}`);
    
    // Find the widget container and reapply scaling
    const containers = document.querySelectorAll('.widget-content');
    containers.forEach(container => {
      if (container.querySelector('.pomodoro-container')) {
        this.applyWidgetScaling(container as HTMLElement);
      }
    });
  }

  getState(): Record<string, any> {
    return {
      // State is managed by localStorage in the original component
    };
  }

  setState(state: Record<string, any>): void {
    // State is managed by localStorage in the original component
  }
}