// import * as React from 'react';

// interface PomodoroTimerState {
//   isRunning: boolean;
//   pomodorosCompleted: number;
//   breaksTaken: number;
//   timeLeft: number;
//   sessionType: 'pomodoro' | 'break';
// }

// class PomodoroTimer extends React.Component<{}, PomodoroTimerState> {
//   timer?: number;

//   constructor(props: {}) {
//     super(props);
//     this.state = {
//       isRunning: false,
//       pomodorosCompleted: 0,
//       breaksTaken: 0,
//       timeLeft: 1500, // 25 minutes in seconds
//       sessionType: 'pomodoro'
//     };
//   }

//   startTimer = () => {
//     this.setState({ isRunning: true });
//     this.timer = window.setInterval(() => {
//       this.setState(prevState => {
//         if (prevState.timeLeft > 0) {
//           return { timeLeft: prevState.timeLeft - 1 };
//         } else {
//           if (prevState.sessionType === 'pomodoro') {
//             return {
//               timeLeft: 300, // 5 minutes in seconds
//               sessionType: 'break',
//               pomodorosCompleted: prevState.pomodorosCompleted + 1
//             };
//           } else {
//             return {
//               timeLeft: 1500, // 25 minutes in seconds
//               sessionType: 'pomodoro',
//               breaksTaken: prevState.breaksTaken + 1
//             };
//           }
//         }
//       });
//     }, 1000); // update every second
//   }

//   pauseTimer = () => {
//     window.clearInterval(this.timer);
//     this.setState({ isRunning: false });
//   }

//   resetTimer = () => {
//     window.clearInterval(this.timer);
//     this.setState({
//       isRunning: false,
//       timeLeft: 1500, // 25 minutes in seconds
//       sessionType: 'pomodoro'
//     });
//   }

//   componentDidUpdate(prevProps: {}, prevState: PomodoroTimerState) {
//     if (prevState.pomodorosCompleted !== this.state.pomodorosCompleted) {
//       const date = new Date().toISOString().slice(0, 10);
//       const pomodorosCompleted = parseInt(localStorage.getItem(date) || '0', 10);
//       localStorage.setItem(date, "" + (pomodorosCompleted + 1));
//     }
//   }

//   render() {
//     const { isRunning, timeLeft, sessionType, pomodorosCompleted, breaksTaken } = this.state;

//     return (
//       <div>
//         <div>Pomodoros completed: {pomodorosCompleted}</div>
//         <div>Breaks taken: {breaksTaken}</div>
//         <div>Time left: {timeLeft}</div>
//         <div>Session type: {sessionType}</div>
//         {!isRunning && <button onClick={this.startTimer}>Start</button>}
//         {isRunning && <button onClick={this.pauseTimer}>Pause</button>}
//         <button onClick={this.resetTimer}>Reset</button>
//       </div>
//     );
//   }
// }

// export default PomodoroTimer;
