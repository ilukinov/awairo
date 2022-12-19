import React, { useState, useEffect } from 'react';
import './App.css';

function PomodoroTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRunning, timeLeft]);

  const handleStartClick = () => {
    setIsRunning(true);
  };

  const handlePauseClick = () => {
    setIsRunning(false);
  };

  const handleResetClick = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  const checkSecond = (sec: any) => {
    if (sec < 10 && sec >= 0) {sec = "0" + sec}; // add zero in front of numbers < 10
    if (sec < 0) {sec = "59"};
    return sec;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = checkSecond(timeLeft % 60);

  return (
    <div className="face">
      <div id="lazy">
        {minutes}:{seconds}
      </div>
      <div className="buttons">
        <button onClick={handleStartClick}>Start</button>
        <button onClick={handlePauseClick}>Pause</button>
        <button onClick={handleResetClick}>Reset</button>
      </div>
    </div>
  );
}




export default PomodoroTimer
