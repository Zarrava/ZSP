export interface IEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  location?: string;
  organizer?: string;
  url?: string;
  meetingUrl?: string;
}
