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
  const [time, setTime] = useState<TimeSettings>(() => {
    const savedTime = localStorage.getItem('timerLength');
    if (savedTime) {
      return JSON.parse(savedTime);
    }
    return { hours: 0, minutes: 25, seconds: 0 }; // Default time
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
  }, []);

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

  return (
    <div className="settings-container">
      <h2>Settings</h2>
      
      <div className="settings-section">
        <h3>Timer Length</h3>
        <div className="time-picker">
          <div className="time-field">
            <input
              type="number"
              min="0"
              max="23"
              value={time.hours}
              onChange={(e) => handleTimeChange('hours', e.target.value)}
            />
            <label>h</label>
          </div>
          <div className="time-field">
            <input
              type="number"
              min="0"
              max="59"
              value={time.minutes}
              onChange={(e) => handleTimeChange('minutes', e.target.value)}
            />
            <label>m</label>
          </div>
          <div className="time-field">
            <input
              type="number"
              min="0"
              max="59"
              value={time.seconds}
              onChange={(e) => handleTimeChange('seconds', e.target.value)}
            />
            <label>s</label>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Pomodoro Icon</h3>
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

      <div className="settings-section">
        <h3>Tasks</h3>
        <div className="task-input">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="New task name"
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <button onClick={handleAddTask}>Add</button>
        </div>
        
        <div className="tasks-list">
          {tasks.map(task => (
            <div key={task.id} className="task-item">
              <span>{task.name}</span>
              <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 