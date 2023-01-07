import React, { useState, useEffect } from "react";
import "./PomodoroTimer.css";
import Pomodoro from './types/Pomodoro';
import TogglClient from './TogglClient'; 
import Interruption from './types/Interruption';
import Dropdown from "./Dropdown";

const POMODORO_DURATION = 25; // Pomodoro duration in minutes
const BREAK_DURATION = 5; // Break duration in minutes
const options = ['Working Work', 'Working Fun', 'Option 3'];
const togglClient = new TogglClient('', 1, 1);

function PomodoroTimer() {
  const [inputValue, setInputValue] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_DURATION * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<string[]>(options);
  const [selectedOption, setSelectedOption] = useState<string>(options[0]);
  const [pomodorosCompleted, setPomodorosCompleted] = useState<Pomodoro[]>([]);
  const [breaksTaken, setBreaksTaken] = useState(0);
  const [interruptions, setInterruptions] = useState<Interruption[]>([]);
  const [currentPomodoro, setCurrentPomodoro] = useState<Pomodoro | null>(null);
  const [currentInterruption, setCurrentInterruption] = useState<Interruption | null>(null);

  
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      const timeoutId = setTimeout(() => {
        setSecondsLeft(secondsLeft - 1);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
    if(isRunning && secondsLeft === 0 && currentPomodoro !== null) {
      setIsRunning(false);
      currentPomodoro.completed = true;
      currentPomodoro.endDate = new Date();
      currentPomodoro.interruptions = interruptions;
      setInterruptions([]);
      setPomodorosCompleted([...pomodorosCompleted, currentPomodoro]);
      togglClient.sendToToggl(currentPomodoro);
      console.log(pomodorosCompleted);
      console.log(interruptions);
    }

  }, [isRunning, secondsLeft, pomodorosCompleted]);


  function startTimer() {
    if (secondsLeft === POMODORO_DURATION * 60) {
      setCurrentPomodoro({ startDate: new Date(), endDate: new Date(), duration: POMODORO_DURATION * 60, completed: false, description: selectedOption, interruptions: []});
      setInterruptions([]);
    }
    if (secondsLeft === 0) {
      setSecondsLeft(POMODORO_DURATION * 60);
      setCurrentPomodoro({ startDate: new Date(), endDate: new Date(), duration: POMODORO_DURATION * 60, completed: false, description: selectedOption, interruptions: []});
    } else {
      if(currentInterruption) {
        currentInterruption.endDate = new Date();
        setInterruptions([...interruptions, currentInterruption]);
      }
    }
    setIsRunning(true);
  }

  const handleSaveClick = () => {
    localStorage.setItem('inputValue', inputValue);
  };
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  function onOptionSelected(option: string) {
    setSelectedOption(option);
  }

  function pauseTimer() {
    if(isRunning) {
      setCurrentInterruption({startDate: new Date(), endDate: null });
      setIsRunning(false);
    
    }
  }

  function resetTimer() {
    setIsRunning(false);
    setSecondsLeft(POMODORO_DURATION * 60);
    setCurrentInterruption(null);
    setCurrentPomodoro(null);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="timer">
    <div className="display">
    {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
    </div>
    <div className="controls">
      <div className="buttons-row">
          <button className="start" onClick={startTimer}>Start</button>
          <button className="pause" onClick={pauseTimer}>Pause</button>
          <button className="stop" onClick={resetTimer}>Reset</button>
      </div>
      <div className="tasks-row">
        <Dropdown options={dropdownOptions} onChange={onOptionSelected} />
        <input value={inputValue} onChange={handleInputChange} /><button onClick={handleSaveClick}>Save</button>
      </div>
    </div>
    <div className="stats">
    <div className="pomodoros">
    {pomodorosCompleted.map(() => (
        <div className="apple" key={Math.random().toString(36).substring(2)}>🍏</div>
      ))}
    </div>
    </div>

  </div>
  );
}

export default  PomodoroTimer;