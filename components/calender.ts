export interface CalendarEvent {
    id: string
    title: string
    startTime: string
    endTime?: string
    color?: string
  }
  
  export interface DayEvents {
    date: string
    events: CalendarEvent[]
  }
  
  