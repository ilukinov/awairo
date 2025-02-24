import { useState } from 'react';

interface CompletedPomodoro {
  id: string;
  timestamp: number;
  duration: number;
  comment?: string;
  committed: boolean;
}

interface PomodoroDialogProps {
  pomodoro: CompletedPomodoro;
  onSave: (id: string, updates: Partial<CompletedPomodoro>) => void;
  onCommit: (id: string) => void;
  onClose: () => void;
}

export function PomodoroDialog({ pomodoro, onSave, onCommit, onClose }: PomodoroDialogProps) {
  const [comment, setComment] = useState(pomodoro.comment || '');

  const handleSave = () => {
    onSave(pomodoro.id, { comment });
    onClose();
  };

  const handleCommit = () => {
    onSave(pomodoro.id, { comment });
    onCommit(pomodoro.id);
  };

  return (
    <div className="pomodoro-dialog">
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment about this pomodoro session..."
      />
      <div className="dialog-buttons">
        <button onClick={handleSave}>Save</button>
        <button onClick={handleCommit}>Commit</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
} 