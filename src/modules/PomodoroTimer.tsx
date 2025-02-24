//PomodoroTimer.tsx
import React, { useState, useEffect } from "react";
import "./PomodoroTimer.css";
import Pomodoro from './types/Pomodoro';
import TogglClient from './TogglClient'; 
import Interruption from './types/Interruption';
import Dropdown from "./Dropdown";
import { PomodoroDialog } from "./PomodoroDialog";
import { WebviewWindow } from '@tauri-apps/api/window';

const POMODORO_DURATION = 0.1; // Pomodoro duration in minutes
const BREAK_DURATION = 5; // Break duration in minutes
const options = ['Working Work', 'Meeting', 'Option 3'];
const togglClient = new TogglClient('7f08be9642887f97ab575fcfcf60a94b', 188414601, 6956576);

interface CompletedPomodoro {
  id: string;
  timestamp: number;
  duration: number;
  comment?: string;
  taskId?: string;
  committed: boolean;
}

function PomodoroTimer() {
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_DURATION * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>(options[0]);
  const [interruptions, setInterruptions] = useState<Interruption[]>([]);
  const [currentPomodoro, setCurrentPomodoro] = useState<Pomodoro | null>(null);
  const [currentInterruption, setCurrentInterruption] = useState<Interruption | null>(null);
  const [completedPomodoros, setCompletedPomodoros] = useState<CompletedPomodoro[]>([]);
  const [selectedPomodoroId, setSelectedPomodoroId] = useState<string | null>(null);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      const timeoutId = setTimeout(() => {
        setSecondsLeft(secondsLeft - 1);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
    if (isRunning && secondsLeft === 0) {
      setIsRunning(false);
      handleTimerComplete();
    }
  }, [isRunning, secondsLeft]);

  const handleTimerComplete = () => {
    const newPomodoro: CompletedPomodoro = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      duration: POMODORO_DURATION * 60,
      committed: false
    };
    
    setCompletedPomodoros(prev => {
      const updatedPomodoros = [...prev, newPomodoro];
      localStorage.setItem('completedPomodoros', JSON.stringify(updatedPomodoros));
      return updatedPomodoros;
    });
  };

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

  function startTimer() {
    if (secondsLeft === POMODORO_DURATION * 60) {
      setCurrentPomodoro({ 
        startDate: new Date(), 
        endDate: new Date(), 
        duration: POMODORO_DURATION * 60, 
        completed: false, 
        description: selectedOption, 
        interruptions: []
      });
      setInterruptions([]);
    }
    setIsRunning(true);
  }

  function pauseTimer() {
    if(isRunning) {
      setCurrentInterruption({startDate: new Date(), endDate: null });
      setIsRunning(false);
    }
  }

  function resetTimer() {
    setIsRunning(false);
    setSecondsLeft(POMODORO_DURATION * 60);
    setCurrentInterruption(null);
    setCurrentPomodoro(null);
  }

  function onOptionSelected(option: string) {
    setSelectedOption(option);
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

  const openSettings = async () => {
    const settingsWindow = new WebviewWindow('settings', {
      url: 'src/settings.html',
      title: 'Settings',
      width: 400,
      height: 600,
      decorations: true,
      resizable: true,
      center: true,
    });

    settingsWindow.once('tauri://error', (e) => {
      console.error('Settings window creation failed:', e);
    });

    settingsWindow.once('tauri://close-requested', () => {
      // Handle any cleanup if needed
    });
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
        </div>
      </div>

      <div className="completed-pomodoros">
        {completedPomodoros.map(pomodoro => (
          <div 
            key={pomodoro.id} 
            className={`pomodoro-item ${pomodoro.committed ? 'committed' : ''}`}
            onClick={() => !pomodoro.committed && handlePomodoroClick(pomodoro.id)}
          >
            🍎
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

      <button 
        className="settings-button" 
        onClick={openSettings}
        title="Settings"
      >
        ⚙️
      </button>
    </div>
  );
}

export default PomodoroTimer;
