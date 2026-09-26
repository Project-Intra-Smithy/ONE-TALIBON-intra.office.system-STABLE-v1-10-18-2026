import meetingData from './meetings.json';

export type MeetingStatus = 'Scheduled' | 'Completed' | 'Rescheduled';

export type MunicipalMeeting = {
    id: string;
    title: string;
    organizingOffice: string;
    date: string;
    time: string;
    venue: string;
    participants: string[];
    agenda: string[];
    relatedDocuments: string[];
    status: MeetingStatus;
};

export const municipalMeetings = meetingData as MunicipalMeeting[];
