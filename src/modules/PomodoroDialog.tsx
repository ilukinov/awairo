import { useState, useEffect } from 'react';
import TogglClient from './TogglClient';
import { CompletedPomodoro } from './types/CompletedPomodoro';

interface Task {
  id: string;
  name: string;
}

interface PomodoroDialogProps {
  pomodoro: CompletedPomodoro;
  onSave: (id: string, updates: Partial<CompletedPomodoro>) => void;
  onCommit: (id: string) => void;
  onClose: () => void;
}

export function PomodoroDialog({ pomodoro, onSave, onCommit, onClose }: PomodoroDialogProps) {
  const [comment, setComment] = useState(pomodoro.comment || '');
  const [taskId, setTaskId] = useState(pomodoro.taskId || '');
  const [tasks, setTasks] = useState<Task[]>([]); // Added proper type for tasks
  
  const togglClient = new TogglClient('7f08be9642887f97ab575fcfcf60a94b', 188414601, 6956576);

  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  const handleSave = () => {
    onSave(pomodoro.id, { comment, taskId });
  };

  const handleCommit = async () => {
    await togglClient.sendToToggl({
      startDate: new Date(pomodoro.timestamp),
      endDate: new Date(pomodoro.timestamp + pomodoro.duration * 1000),
      duration: pomodoro.duration,
      description: comment,
      completed: true,
      interruptions: []
    });
    onCommit(pomodoro.id);
  };

  return (
    <div className="pomodoro-dialog">
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What did you work on?"
      />
      <select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
        <option value="">Select a task</option>
        {tasks.map(task => (
          <option key={task.id} value={task.id}>{task.name}</option>
        ))}
      </select>
      <div className="dialog-buttons">
        <button onClick={handleSave}>Save</button>
        <button onClick={handleCommit} disabled={!comment || !taskId}>
          Commit to Toggl
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
} 