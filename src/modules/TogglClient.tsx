//TogglClient.tsx
import { fetch } from '@tauri-apps/plugin-http';
import Pomodoro from './types/Pomodoro';

class TogglClient {
  private apiToken: string;
  private projectId: number;
  private baseUrl: string;
  private workSpace: number;

  constructor(apiToken: string , projectId: number, workSpace: number) {
    this.apiToken = apiToken;
    this.projectId = projectId;
    this.baseUrl = 'https://api.track.toggl.com/api/v9/workspaces';
    this.workSpace = workSpace;
  }
  public async sendToToggl(pomodoro: Pomodoro) {
    const timeEntry = {
        description: pomodoro.description,
        pid: this.projectId,
        duration: pomodoro.duration,
        duronly: true,
        start: pomodoro.startDate.toISOString(),
        // stop: pomodoro.endDate.toISOString(),
        workspace_id: this.workSpace,
        created_with: 'apple a day',
        tags: ['apple']
      };

      console.log(`${this.baseUrl}/${this.workSpace}/time_entries`)
      console.log(timeEntry)
    const res = await fetch(`${this.baseUrl}/${this.workSpace}/time_entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(this.apiToken + ':api_token')}`
      },
      body: JSON.stringify(timeEntry)
    });
    const data = await res.json();
    console.log(data);
    console.log(res.status);
    console.log(data);
  }

  public async sendToTogglBulk(pomodoros: Pomodoro[]) {
    const timeEntries = pomodoros.filter((p) => {
        return p.endDate != null;
    }).map((p) => {
      const duration = (p.endDate.getTime() - p.startDate.getTime()) / 1000;
      const startDate = p.startDate.toISOString();
      const description = p.completed ? 'Completed Pomodoro' : 'Incomplete Pomodoro';

      return {
        description,
        project_id: this.projectId,
        duration: duration,
        duronly: true,
        start: startDate,
        wid: this.workSpace,
        workspace_id: this.workSpace,
        created_with: 'apple a day'
      };
    });

    try {
  
    const res = await fetch(`${this.baseUrl}/time_entries/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(this.apiToken + ':api_token')}`
        },
        body: JSON.stringify({ time_entries: timeEntries })
      });

      const data = await res.json();
      console.log(res.status);
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  }

  
}

export default TogglClient;