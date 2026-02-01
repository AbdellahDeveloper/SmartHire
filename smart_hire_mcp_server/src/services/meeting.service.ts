import { createServiceClient } from "./base.service.js";

const MEETING_SERVICE_URL = process.env.MEETING_SERVICE_URL || "http://meet-scheduler:3012";
const client = createServiceClient(MEETING_SERVICE_URL);

export interface ScheduleMeetingRequest {
    candidateId?: string;
    startTime: string;
    endTime: string;
    summary?: string;
    description?: string;
    send?: boolean;
}

export const meetingService = {
    scheduleMeeting: (data: ScheduleMeetingRequest) => client.post("/schedule-meeting", data),
};
