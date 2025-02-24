//PomodoroTimer.tsx
import React, { useState, useEffect } from "react";
import "./PomodoroTimer.css";
import { PomodoroDialog } from "./PomodoroDialog";
import { WebviewWindow } from '@tauri-apps/api/window';

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

function PomodoroTimer() {
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
  const [dailyGoal] = useState(() => {
    const saved = localStorage.getItem('dailyGoal');
    return saved ? parseInt(saved) : 8; // Default to 8 pomodoros
  });

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
    const settingsWindow = new WebviewWindow('settings', {
      url: 'src/settings.html',
      title: 'Settings',
      width: 400,
      height: 600,
      decorations: true,
      resizable: true,
      center: true,
      alwaysOnTop: true,
      focus: true,
    });

    settingsWindow.once('tauri://created', async () => {
      await settingsWindow.setAlwaysOnTop(true);
    });

    settingsWindow.once('tauri://error', (e) => {
      console.error('Settings window creation failed:', e);
    });
  };

  const openHistory = async () => {
    const historyWindow = new WebviewWindow('history', {
      url: 'src/history.html',
      title: 'History',
      width: 1200,
      height: 800,
      decorations: true,
      resizable: true,
      center: true,
      alwaysOnTop: true,
      focus: true,
    });

    historyWindow.once('tauri://created', async () => {
      await historyWindow.setAlwaysOnTop(true);
    });

    historyWindow.once('tauri://error', (e) => {
      console.error('History window creation failed:', e);
    });
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
      return pomodoroDate === today;
    });
  };

  const isDailyGoalAchieved = () => {
    return getTodayPomodoros().length >= dailyGoal;
  };

  return (
    <div className="pomodoro-container">
      <div className="timer">
        <div className="display">
          {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </div>
        <div className="controls">
          <div className="buttons-row">
            <button onClick={startTimer}>Start</button>
            <button onClick={pauseTimer}>Pause</button>
            <button onClick={resetTimer}>Reset</button>
          </div>
          <div className="bottom-buttons">
            <button 
              className="history-button" 
              onClick={openHistory}
              title="History"
            >
              📅
            </button>
            <button 
              className="settings-button" 
              onClick={openSettings}
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      <div className="completed-pomodoros">
        {getTodayPomodoros().map(pomodoro => (
          <div 
            key={pomodoro.id} 
            className={`pomodoro-item ${pomodoro.committed ? 'committed' : ''} ${isDailyGoalAchieved() ? 'goal-achieved' : ''}`}
          >
            <div 
              className="pomodoro-icon"
              onClick={() => !pomodoro.committed && handlePomodoroClick(pomodoro.id)}
            >
              {pomodoroIcon}
            </div>
            <button 
              className="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                handlePomodoroDelete(pomodoro.id);
              }}
              title="Delete"
            >
              ×
            </button>
          </div>
        ))}
        
        {Array.from({ length: Math.max(0, dailyGoal - getTodayPomodoros().length) }).map((_, i) => (
          <div key={`empty-${i}`} className="pomodoro-item empty">
            <div className="pomodoro-icon">
              {pomodoroIcon}
            </div>
          </div>
        ))}
      </div>

      {selectedPomodoroId && (
        <PomodoroDialog
          pomodoro={completedPomodoros.find(p => p.id === selectedPomodoroId)!}
          onSave={handlePomodoroSave}
          onCommit={handlePomodoroCommit}
          onClose={() => setSelectedPomodoroId(null)}
        />
      )}
    </div>
  );
}

export default PomodoroTimer;