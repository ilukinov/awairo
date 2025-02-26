import { useState, useEffect } from 'react';
import './History.css';
import '../utils/dateUtils';
import React from 'react';

interface CompletedPomodoro {
  id: string;
  timestamp: number;
  duration: number;
  comment?: string;
  committed: boolean;
}

// Helper function to format time for timeline
const formatTimeForTimeline = (date: Date) => {
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit'
  });
};

// Calculate end time of a pomodoro
const calculateEndTime = (timestamp: number, durationInSeconds: number) => {
  const endTime = new Date(timestamp + durationInSeconds * 1000);
  return endTime;
};

export function History() {
  const [pomodoros, setPomodoros] = useState<CompletedPomodoro[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem('dailyGoal');
    return saved ? parseInt(saved) : 8; // Default to 8 pomodoros
  });
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline');
  const timelineScrollRef = React.useRef<HTMLDivElement>(null);

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

  const formatDateFull = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long'
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

  // Generate vertical timeline for a specific day
  const generateDayColumn = (date: Date) => {
    const dayPomodoros = getPomodorosForDate(date);
    const isCurrentDay = date.toDateString() === new Date().toDateString();
    
    // Sort pomodoros by timestamp
    const sortedPomodoros = [...dayPomodoros].sort((a, b) => a.timestamp - b.timestamp);
    
    // Define the time range for the timeline (full 24 hours)
    const startHour = 0; // 12 AM
    const endHour = 24; // 12 AM next day
    const totalHours = endHour - startHour;
    const totalMinutes = totalHours * 60;
    
    // Create pomodoro blocks on the timeline
    const pomodoroBlocks = sortedPomodoros.map(pomodoro => {
      const startTime = new Date(pomodoro.timestamp);
      const endTime = calculateEndTime(pomodoro.timestamp, pomodoro.duration);
      
      // Calculate position and height based on time
      const startHourDecimal = startTime.getHours() + startTime.getMinutes() / 60;
      const endHourDecimal = endTime.getHours() + endTime.getMinutes() / 60;
      
      // Skip if outside our timeline range (shouldn't happen with 24h range)
      if (endHourDecimal < startHour || startHourDecimal > endHour) {
        return null;
      }
      
      // Adjust to fit within our timeline
      const adjustedStartHour = Math.max(startHourDecimal, startHour);
      const adjustedEndHour = Math.min(endHourDecimal, endHour);
      
      // Calculate position as pixels instead of percentage for precise alignment
      // Each hour is 60px (30px for hour + 30px for half hour)
      const startMinutes = (adjustedStartHour - startHour) * 60;
      const endMinutes = (adjustedEndHour - startHour) * 60;
      const top = startMinutes;
      const height = endMinutes - startMinutes;
      
      return (
        <div 
          key={pomodoro.id}
          className={`vertical-timeline-pomodoro ${pomodoro.committed ? 'committed' : ''}`}
          style={{ 
            top: `${top}px`, 
            height: `${height}px` 
          }}
          title={`${formatTimeForTimeline(startTime)} - ${formatTimeForTimeline(endTime)}${pomodoro.comment ? `: ${pomodoro.comment}` : ''}`}
        >
          <div className="timeline-pomodoro-time">
            {formatTimeForTimeline(startTime)} - {formatTimeForTimeline(endTime)}
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
      );
    });
    
    return (
      <div key={date.toISOString()} className={`day-column-timeline ${isCurrentDay ? 'current-day' : ''}`}>
        <div className={`day-header ${isCurrentDay ? 'active' : ''}`}>
          {formatDate(date)}
        </div>
        <div className="day-pomodoro-container">
          {pomodoroBlocks}
        </div>
        <div className="day-minutes">
          {getDaySummary(dayPomodoros).totalMinutes} minutes
        </div>
      </div>
    );
  };

  // Generate horizontal timeline (original implementation)
  const generateHorizontalTimeline = (date: Date) => {
    const dayPomodoros = getPomodorosForDate(date);
    
    // Sort pomodoros by timestamp
    const sortedPomodoros = [...dayPomodoros].sort((a, b) => a.timestamp - b.timestamp);
    
    // Define the time range for the timeline (6am to 10pm)
    const startHour = 6; // 6 AM
    const endHour = 22; // 10 PM
    const totalHours = endHour - startHour;
    
    // Create hour markers
    const hourMarkers = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      const position = ((hour - startHour) / totalHours) * 100;
      hourMarkers.push(
        <div 
          key={`hour-${hour}`} 
          className="timeline-hour-marker"
          style={{ left: `${position}%` }}
        >
          <div className="timeline-hour-label">{hour % 12 || 12}{hour < 12 ? 'am' : 'pm'}</div>
          <div className="timeline-hour-line"></div>
        </div>
      );
    }
    
    // Create pomodoro blocks on the timeline
    const pomodoroBlocks = sortedPomodoros.map(pomodoro => {
      const startTime = new Date(pomodoro.timestamp);
      const endTime = calculateEndTime(pomodoro.timestamp, pomodoro.duration);
      
      // Calculate position and width based on time
      const startHourDecimal = startTime.getHours() + startTime.getMinutes() / 60;
      const endHourDecimal = endTime.getHours() + endTime.getMinutes() / 60;
      
      // Skip if outside our timeline range
      if (endHourDecimal < startHour || startHourDecimal > endHour) {
        return null;
      }
      
      // Adjust to fit within our timeline
      const adjustedStartHour = Math.max(startHourDecimal, startHour);
      const adjustedEndHour = Math.min(endHourDecimal, endHour);
      
      // Calculate position as percentage of timeline
      const left = ((adjustedStartHour - startHour) / totalHours) * 100;
      const width = ((adjustedEndHour - adjustedStartHour) / totalHours) * 100;
      
      return (
        <div 
          key={pomodoro.id}
          className={`timeline-pomodoro ${pomodoro.committed ? 'committed' : ''}`}
          style={{ left: `${left}%`, width: `${width}%` }}
          title={`${formatTimeForTimeline(startTime)} - ${formatTimeForTimeline(endTime)}${pomodoro.comment ? `: ${pomodoro.comment}` : ''}`}
        >
          <div className="timeline-pomodoro-time">
            {formatTimeForTimeline(startTime)} - {formatTimeForTimeline(endTime)}
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
      );
    });
    
    return (
      <div className="day-timeline">
        <div className="timeline-hours">
          {hourMarkers}
        </div>
        <div className="timeline-pomodoros">
          {pomodoroBlocks}
        </div>
      </div>
    );
  };

  // Render the week view (list mode)
  const renderWeekView = () => {
    return (
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
    );
  };

  // Render the multi-day timeline view
  const renderTimelineView = () => {
    const daysInWeek = getDaysInWeek();
    
    // Define the time range for the timeline (full 24 hours)
    const startHour = 0; // 12 AM
    const endHour = 24; // 12 AM next day
    
    // Get current time for the indicator
    const now = new Date();
    const currentHour = 16; // Force to 4:00 PM for testing
    const currentMinute = 0;
    
    // Debug current time
    console.log("CURRENT TIME DEBUG:", currentHour + ":" + currentMinute);
    console.log("CURRENT HOUR:", currentHour);
    console.log("CURRENT MINUTE:", currentMinute);
    
    // Calculate position in pixels - each hour is 60px
    const currentTimePosition = (currentHour * 60) + currentMinute;
    
    console.log("CURRENT TIME POSITION:", currentTimePosition, "px");
    
    // Create time markers (for all 24 hours)
    const timeMarkers = [];
    
    // Generate all 24 hours with half-hour markers
    for (let hour = 0; hour < 24; hour++) {
      // Add work hours class for 9am-5pm
      const isWorkHours = hour >= 9 && hour < 17;
      const isMidnight = hour === 0;
      const isNoon = hour === 12;
      
      // Full hour marker
      timeMarkers.push(
        <div 
          key={`hour-${hour}`} 
          className={`timeline-time-marker ${isWorkHours ? 'work-hours' : ''} ${isMidnight ? 'midnight' : ''} ${isNoon ? 'noon' : ''}`}
          style={{ height: '30px' }} // Explicitly set height to ensure consistent sizing
        >
          <div className="timeline-time-label">
            {hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}:00 {hour < 12 ? 'AM' : 'PM'}
          </div>
        </div>
      );
      
      // Half hour marker
      timeMarkers.push(
        <div 
          key={`hour-${hour}-30`} 
          className={`timeline-time-marker half-hour ${isWorkHours ? 'work-hours' : ''}`}
          style={{ height: '30px' }} // Explicitly set height to ensure consistent sizing
        >
          <div className="timeline-time-label">
            {hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}:30 {hour < 12 ? 'AM' : 'PM'}
          </div>
        </div>
      );
    }
    
    // Create day columns 
    const dayColumns = daysInWeek.map(date => {
      const isCurrentDay = date.toDateString() === new Date().toDateString();
      
      return (
        <div key={date.toISOString()} className={`day-column-timeline ${isCurrentDay ? 'current-day' : ''}`}>
          <div className="day-pomodoro-container">
            {generateDayPomodoroBlocks(date)}
          </div>
        </div>
      );
    });
    
    // Create fixed day headers
    const dayHeaders = daysInWeek.map(date => {
      const isCurrentDay = date.toDateString() === new Date().toDateString();
      
      return (
        <div 
          key={`header-${date.toISOString()}`} 
          className={`timeline-day-header ${isCurrentDay ? 'active' : ''}`}
        >
          {formatDate(date)}
        </div>
      );
    });
    
    // Create fixed day footers with minutes
    const dayFooters = daysInWeek.map(date => {
      return (
        <div 
          key={`footer-${date.toISOString()}`} 
          className="day-minutes"
        >
          {getDaySummary(getPomodorosForDate(date)).totalMinutes} minutes
        </div>
      );
    });
    
    // Create quick navigation buttons for common times
    const quickNavButtons = [
      { label: 'Morning (6 AM)', hour: 6 },
      { label: 'Noon (12 PM)', hour: 12 },
      { label: 'Evening (6 PM)', hour: 18 },
      { label: 'Night (9 PM)', hour: 21 }
    ];
    
    return (
      <>
        <div className="multi-day-timeline">
          {/* Fixed headers */}
          <div className="timeline-headers">
            <div className="timeline-time-header-spacer">Time</div>
            <div className="timeline-day-headers">
              {dayHeaders}
            </div>
          </div>
          
          {/* Scrollable content */}
          <div 
            className="timeline-scroll-container" 
            ref={timelineScrollRef}
            onLoad={() => {
              console.log('Timeline loaded, attempting to scroll');
              setTimeout(scrollToCurrentTime, 100);
            }}
            onScroll={() => {
              if (timelineScrollRef.current) {
                const scrollTop = timelineScrollRef.current.scrollTop;
                const hour = Math.floor(scrollTop / 60);
                const minute = Math.floor(scrollTop % 60);
                console.log(`Scroll position: ${scrollTop}px (approximately ${hour}:${minute < 10 ? '0' + minute : minute})`);
              }
            }}
          >
            <div className="timeline-time-markers">
              <div className="timeline-time-content">
                {timeMarkers}
                
                {/* Current time indicator */}
                <div 
                  className="current-time-indicator" 
                  style={{ 
                    top: `${currentTimePosition}px`, 
                    zIndex: 100 
                  }}
                >
                  <div className="current-time-label">
                    4:00 PM
                  </div>
                </div>
              </div>
            </div>
            <div className="timeline-days-container">
              {dayColumns}
            </div>
          </div>
          
          {/* Fixed footers */}
          <div className="timeline-footers">
            <div className="timeline-time-footer-spacer"></div>
            <div className="timeline-day-footers">
              {dayFooters}
            </div>
          </div>
        </div>
        
        {/* Jump to current time button */}
        <button 
          className="jump-to-current-time"
          onClick={scrollToCurrentTime}
        >
          Jump to current time
        </button>
        
        {/* Quick navigation buttons */}
        <div className="quick-nav-buttons">
          {quickNavButtons.map(button => (
            <button 
              key={button.hour}
              className="quick-nav-button"
              onClick={() => scrollToHour(button.hour)}
            >
              {button.label}
            </button>
          ))}
        </div>
      </>
    );
  };
  
  // Helper function to generate pomodoro blocks for a day
  const generateDayPomodoroBlocks = (date: Date) => {
    const dayPomodoros = getPomodorosForDate(date);
    
    // Sort pomodoros by timestamp
    const sortedPomodoros = [...dayPomodoros].sort((a, b) => a.timestamp - b.timestamp);
    
    // Define the time range for the timeline (full 24 hours)
    const startHour = 0; // 12 AM
    const endHour = 24; // 12 AM next day
    
    // Create pomodoro blocks on the timeline
    return sortedPomodoros.map(pomodoro => {
      const startTime = new Date(pomodoro.timestamp);
      const endTime = calculateEndTime(pomodoro.timestamp, pomodoro.duration);
      
      // Calculate position and height based on time
      const startHourDecimal = startTime.getHours() + startTime.getMinutes() / 60;
      const endHourDecimal = endTime.getHours() + endTime.getMinutes() / 60;
      
      // Skip if outside our timeline range (shouldn't happen with 24h range)
      if (endHourDecimal < startHour || startHourDecimal > endHour) {
        return null;
      }
      
      // Adjust to fit within our timeline
      const adjustedStartHour = Math.max(startHourDecimal, startHour);
      const adjustedEndHour = Math.min(endHourDecimal, endHour);
      
      // Calculate position as pixels instead of percentage for precise alignment
      // Each hour is 60px (30px for hour + 30px for half hour)
      const startMinutes = (adjustedStartHour - startHour) * 60;
      const endMinutes = (adjustedEndHour - startHour) * 60;
      const top = startMinutes;
      const height = endMinutes - startMinutes;
      
      return (
        <div 
          key={pomodoro.id}
          className={`vertical-timeline-pomodoro ${pomodoro.committed ? 'committed' : ''}`}
          style={{ 
            top: `${top}px`, 
            height: `${height}px` 
          }}
          title={`${formatTimeForTimeline(startTime)} - ${formatTimeForTimeline(endTime)}${pomodoro.comment ? `: ${pomodoro.comment}` : ''}`}
        >
          <div className="timeline-pomodoro-time">
            {formatTimeForTimeline(startTime)} - {formatTimeForTimeline(endTime)}
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
      );
    });
  };

  // Scroll to current time on initial render
  useEffect(() => {
    if (viewMode === 'timeline') {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        scrollToCurrentTime();
        console.log('Initial scroll to current time');
        
        // Force a refresh of the scroll container to ensure scrollbar appears
        if (timelineScrollRef.current) {
          // Trigger a resize event to force browser to recalculate scrollbars
          window.dispatchEvent(new Event('resize'));
          
          // Add a tiny bit of scroll to force the scrollbar to appear
          timelineScrollRef.current.scrollTop = 1;
          
          console.log('Timeline container height:', timelineScrollRef.current.clientHeight);
          console.log('Timeline content height:', timelineScrollRef.current.scrollHeight);
        }
      }, 800); // Increased timeout to ensure component is fully rendered
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  // Auto-scroll to current time when switching weeks
  useEffect(() => {
    if (viewMode === 'timeline') {
      const timer = setTimeout(() => {
        scrollToCurrentTime();
        console.log('Week changed, scrolling to current time');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentWeek]);

  // Force scroll container to update when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (viewMode === 'timeline' && timelineScrollRef.current) {
        // Force a reflow of the scroll container
        const currentScroll = timelineScrollRef.current.scrollTop;
        timelineScrollRef.current.scrollTop = currentScroll + 1;
        timelineScrollRef.current.scrollTop = currentScroll;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Function to scroll to current time
  const scrollToCurrentTime = () => {
    if (timelineScrollRef.current) {
      // Use 4 PM for testing
      const currentHour = 16;
      const currentMinute = 0;
      
      // Calculate position in pixels (each hour is 60px)
      const scrollPosition = (currentHour * 60) + currentMinute;
      
      console.log(`Current time: ${currentHour}:${currentMinute} - Scrolling to position: ${scrollPosition}px`);
      
      // Scroll to position, with some offset to center it in the viewport
      const viewportHeight = timelineScrollRef.current.clientHeight;
      const offset = Math.max(viewportHeight / 2, 200); // Use half the viewport height or 200px, whichever is larger
      
      // Smoothly scroll to position
      timelineScrollRef.current.scrollTo({
        top: Math.max(0, scrollPosition - offset),
        behavior: 'smooth'
      });
      
      // Flash the current time indicator for visibility
      const currentTimeIndicator = document.querySelector('.current-time-indicator');
      if (currentTimeIndicator) {
        currentTimeIndicator.classList.add('flash-highlight');
        setTimeout(() => {
          currentTimeIndicator.classList.remove('flash-highlight');
        }, 2000);
      }
    }
  };

  // Function to scroll to a specific hour
  const scrollToHour = (hour: number) => {
    if (timelineScrollRef.current) {
      // Calculate position in pixels (each hour is 60px)
      const scrollPosition = hour * 60;
      
      // Scroll to position, with some offset to center it in the viewport
      const viewportHeight = timelineScrollRef.current.clientHeight;
      const offset = Math.max(viewportHeight / 2, 200); // Use half the viewport height or 200px, whichever is larger
      
      // Smoothly scroll to position
      timelineScrollRef.current.scrollTo({
        top: Math.max(0, scrollPosition - offset),
        behavior: 'smooth'
      });
      
      console.log('Scrolling to hour:', hour, 'Position:', scrollPosition);
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
      
      <div className="view-toggle">
        <button 
          className={viewMode === 'list' ? 'active' : ''}
          onClick={() => setViewMode('list')}
        >
          List View
        </button>
        <button 
          className={viewMode === 'timeline' ? 'active' : ''}
          onClick={() => setViewMode('timeline')}
        >
          Timeline View
        </button>
      </div>
      
      {viewMode === 'list' ? renderWeekView() : renderTimelineView()}
    </div>
  );
} 