export interface CompletedPomodoro {
  id: string;
  timestamp: number;
  duration: number;
  comment?: string;
  taskId?: string;
  committed: boolean;
} 