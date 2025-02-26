import { useState, useEffect } from 'react';
import './History.css';
import '../utils/dateUtils';

interface CompletedPomodoro {
  id: string;
  timestamp: number;
  duration: number;
  comment?: string;
  committed: boolean;
}

export function History() {
  const [pomodoros, setPomodoros] = useState<CompletedPomodoro[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem('dailyGoal');
    return saved ? parseInt(saved) : 8; // Default to 8 pomodoros
  });

  useEffect(() => {
    const loadPomodoros = () => {
      const saved = localStorage.getItem('completedPomodoros');
      if (saved) {
        setPomodoros(JSON.parse(saved));
      }
    };

    loadPomodoros();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'completedPomodoros') {
        loadPomodoros();
      } else if (e.key === 'dailyGoal' && e.newValue) {
        setDailyGoal(parseInt(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getDaysInWeek = () => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getPomodorosForDate = (date: Date) => {
    return pomodoros.filter(p => {
      const pomodoroDate = new Date(p.timestamp);
      return pomodoroDate.toDateString() === date.toDateString();
    });
  };

  const getDaySummary = (pomodoros: CompletedPomodoro[]) => {
    const totalMinutes = pomodoros.reduce((sum, p) => {
      return sum + p.duration / 60;
    }, 0);
    
    const committedCount = pomodoros.filter(p => p.committed).length;
    return { 
      totalMinutes: Math.floor(totalMinutes),
      committedCount 
    };
  };

  const handlePomodoroDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this pomodoro?')) {
      setPomodoros(prev => {
        const updatedPomodoros = prev.filter(p => p.id !== id);
        localStorage.setItem('completedPomodoros', JSON.stringify(updatedPomodoros));
        return updatedPomodoros;
      });
    }
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <button onClick={() => {
          const prev = new Date(currentWeek);
          prev.setDate(prev.getDate() - 7);
          setCurrentWeek(prev);
        }}>←</button>
        <h2>Week {currentWeek.getWeek()}</h2>
        <button onClick={() => {
          const next = new Date(currentWeek);
          next.setDate(next.getDate() + 7);
          setCurrentWeek(next);
        }}>→</button>
      </div>
      
      <div className="week-view">
        {getDaysInWeek().map(date => (
          <div key={date.toISOString()} className="day-column">
            <div className="day-header">
              {formatDate(date)}
            </div>
            <div className="day-pomodoros">
              {getPomodorosForDate(date).map(pomodoro => (
                <div 
                  key={pomodoro.id} 
                  className={`history-pomodoro ${pomodoro.committed ? 'committed' : ''}`}
                  title={pomodoro.comment || 'No comment'}
                >
                  <div className="pomodoro-content">
                    <div className="pomodoro-time">
                      {new Date(pomodoro.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div className="pomodoro-duration">
                      {Math.floor(pomodoro.duration / 60)}m
                    </div>
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
            </div>
            <div className="day-summary">
              {(() => {
                const dayPomodoros = getPomodorosForDate(date);
                const { totalMinutes, committedCount } = getDaySummary(dayPomodoros);
                return (
                  <>
                    <div className="summary-total">
                      Total: {totalMinutes}m
                    </div>
                    <div className="summary-committed">
                      Committed: {committedCount}/{dayPomodoros.length}
                    </div>
                    <div className="daily-goal-status">
                      Goal: {committedCount >= dailyGoal ? '✅' : `${committedCount}/${dailyGoal}`}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 