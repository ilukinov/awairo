import Interruption from './Interruption';

type Apple = {
    startDate: Date;
    endDate: Date;
    completed: boolean;
    description: string;
    interruptions: Interruption[];
    duration: number;
  }

export default Apple;
  