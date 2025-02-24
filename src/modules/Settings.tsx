import { useState, useEffect } from 'react';
import './Settings.css';

interface Task {
  id: string;
  name: string;
}

export function Settings() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState('');

  useEffect(() => {
    // Load tasks from localStorage
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

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

  return (
    <div className="settings-container">
      <h2>Settings</h2>
      
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