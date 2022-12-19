//Create a pomodoro timer implemented in TypeScript using React, it should have ui with 3 buttons "Start", "Pause" and "Reset". Program should keep track of how many pomodoros you have done and how many breaks you have taken. 
import React, { useState, useEffect } from "react";
import "./PomodoroTimer.css";


const POMODORO_DURATION = 25; // Pomodoro duration in minutes
const BREAK_DURATION = 5; // Break duration in minutes

function PomodoroTimer() {
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_DURATION * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const [breaksTaken, setBreaksTaken] = useState(0);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      const timeoutId = setTimeout(() => {
        setSecondsLeft(secondsLeft - 1);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
    if(isRunning && secondsLeft === 0) {
      setIsRunning(false);
      setPomodorosCompleted(pomodorosCompleted + 1);     
    }

  }, [isRunning, secondsLeft, pomodorosCompleted]);

  function startTimer() {
    if (secondsLeft === 0) {
      setSecondsLeft(POMODORO_DURATION * 60);
    }
    setIsRunning(true);
  }

  function pauseTimer() {
    setIsRunning(false);
  }

  function resetTimer() {
    setIsRunning(false);
    setSecondsLeft(POMODORO_DURATION * 60);
    setPomodorosCompleted(0);
    setBreaksTaken(0);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (

  <div className="timer">
  <div className="display">
  {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
  </div>
  <div className="controls">
  <button className="start" onClick={startTimer}>Start</button>
        <button className="pause" onClick={pauseTimer}>Pause</button>
        <button className="stop" onClick={resetTimer}>Reset</button>
  </div>
  <div className="stats">
  <div className="pomodoros">
  {[...Array(pomodorosCompleted)].map(() => (
        <div>🍏</div>
      ))}
  </div>
  </div>
</div>
  );
}

export default PomodoroTimer;