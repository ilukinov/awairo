import { useState, useEffect, useRef } from 'react';
import './Settings.css';

interface Task {
  id: string;
  name: string;
}

interface Settings {
  pomodoroIcon: string;
  tasks: Task[];
}

interface TimeSettings {
  hours: number;
  minutes: number;
  seconds: number;
}

export function Settings() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🍎');
  const emojiInputRef = useRef<HTMLInputElement>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? saved === 'true' : false;
  });
  const [time, setTime] = useState<TimeSettings>(() => {
    const savedTime = localStorage.getItem('timerLength');
    if (savedTime) {
      return JSON.parse(savedTime);
    }
    return { hours: 0, minutes: 25, seconds: 0 }; // Default time
  });
  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem('dailyGoal');
    return saved ? parseInt(saved) : 8;
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedTasks = localStorage.getItem('tasks');
    const savedIcon = localStorage.getItem('pomodoroIcon');
    
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
    if (savedIcon) {
      setSelectedIcon(savedIcon);
    }

    // Add dark mode class to body when dark mode is enabled
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    // Save dark mode preference
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const handleIconSelect = (newIcon: string) => {
    setSelectedIcon(newIcon);
    localStorage.setItem('pomodoroIcon', newIcon);
  };

  const handleAddTask = () => {
    if (newTaskName.trim()) {
      const newTask: Task = {
        id: crypto.randomUUID(),
        name: newTaskName.trim()
      };
      
      setTasks(prev => {
        const updatedTasks = [...prev, newTask];
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
        return updatedTasks;
      });
      setNewTaskName('');
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => {
      const updatedTasks = prev.filter(task => task.id !== id);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      return updatedTasks;
    });
  };

  const handleIconClick = () => {
    if (emojiInputRef.current) {
      emojiInputRef.current.click();
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const content = e.target.value;
    if (content) {
      const firstEmoji = Array.from(content)[0];
      handleIconSelect(firstEmoji);
      e.target.value = ''; // Reset input
    }
  };

  const handleTimeChange = (field: keyof TimeSettings, value: string) => {
    const numValue = parseInt(value) || 0;
    const newTime = { ...time, [field]: numValue };
    setTime(newTime);
    localStorage.setItem('timerLength', JSON.stringify(newTime));
  };

  const handleDailyGoalChange = (value: number) => {
    const newValue = Math.min(20, Math.max(1, value));
    setDailyGoal(newValue);
    localStorage.setItem('dailyGoal', newValue.toString());
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <div className={`settings-container ${darkMode ? 'dark-mode' : ''}`}>
      <h1 className="settings-title">Settings</h1>
      
      <div className="settings-section">
        <h2 className="section-header">Appearance</h2>
        <div className="setting-card">
          <div className="setting-label">Dark Mode</div>
          <div className="toggle-container">
            <div className="toggle-label">Light</div>
            <button 
              className={`toggle-button ${darkMode ? 'active' : ''}`}
              onClick={toggleDarkMode}
            >
              <div className="toggle-slider"></div>
            </button>
            <div className="toggle-label">Dark</div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="section-header">Timer</h2>
        <div className="setting-card">
          <div className="setting-label">Timer Length</div>
          <div className="time-picker">
            <div className="time-field">
              <input
                type="number"
                min="0"
                max="23"
                value={time.hours}
                onChange={(e) => handleTimeChange('hours', e.target.value)}
                className="time-input"
              />
              <label className="time-label">h</label>
            </div>
            <div className="time-field">
              <input
                type="number"
                min="0"
                max="59"
                value={time.minutes}
                onChange={(e) => handleTimeChange('minutes', e.target.value)}
                className="time-input"
              />
              <label className="time-label">m</label>
            </div>
            <div className="time-field">
              <input
                type="number"
                min="0"
                max="59"
                value={time.seconds}
                onChange={(e) => handleTimeChange('seconds', e.target.value)}
                className="time-input"
              />
              <label className="time-label">s</label>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="section-header">Pomodoro</h2>
        <div className="setting-card">
          <div className="setting-label">Daily Goal</div>
          <div className="daily-goal-control">
            <button 
              className="stepper-button" 
              onClick={() => handleDailyGoalChange(dailyGoal - 1)}
              disabled={dailyGoal <= 1}
            >
              –
            </button>
            <div className="daily-goal-display">
              <span className="daily-goal-value">{dailyGoal}</span>
              <span className="daily-goal-unit">pomodoros</span>
            </div>
            <button 
              className="stepper-button"
              onClick={() => handleDailyGoalChange(dailyGoal + 1)}
              disabled={dailyGoal >= 20}
            >
              +
            </button>
          </div>
        </div>

        <div className="setting-card">
          <div className="setting-label">Pomodoro Icon</div>
          <div className="icon-picker-container">
            <div
              className="icon-picker"
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => {
                const content = e.currentTarget.textContent || '';
                if (content) {
                  const lastChar = [...content].pop();
                  if (lastChar) {
                    handleIconSelect(lastChar);
                    // Keep only the selected emoji visible
                    e.currentTarget.textContent = lastChar;
                  }
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData('text');
                const emojiMatch = pastedText.match(/\p{Emoji}/u);
                if (emojiMatch) {
                  handleIconSelect(emojiMatch[0]);
                  e.currentTarget.textContent = emojiMatch[0];
                }
              }}
              onClick={(e) => {
                // Select all content when clicking
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(e.currentTarget);
                selection?.removeAllRanges();
                selection?.addRange(range);
              }}
            >
              {selectedIcon}
            </div>
          </div>
          <div className="icon-hint">Click and type or paste an emoji</div>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="section-header">Tasks</h2>
        <div className="setting-card">
          <div className="task-input">
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="Add a new task"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              className="task-text-input"
            />
            <button onClick={handleAddTask} className="add-button">Add</button>
          </div>
          
          <div className="tasks-list">
            {tasks.length === 0 ? (
              <div className="empty-state">No tasks added yet</div>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="task-item">
                  <span className="task-name">{task.name}</span>
                  <button onClick={() => handleDeleteTask(task.id)} className="delete-button">
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 