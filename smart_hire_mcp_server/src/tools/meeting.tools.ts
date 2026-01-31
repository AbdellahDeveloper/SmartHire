import { handleServiceError } from "../services/base.service.js";
import { meetingService, ScheduleMeetingRequest } from "../services/meeting.service.js";

export const meetingToolDefinitions = [
    {
        name: "schedule_meeting",
        description: "Schedule a Google Meet meeting with a candidate",
        inputSchema: {
            type: "object",
            properties: {
                candidateId: { type: "string", description: "The ID of the candidate" },
                startTime: { type: "string", description: "The start time of the meeting in ISO format (e.g., 2024-03-20T10:00:00Z)" },
                endTime: { type: "string", description: "The end time of the meeting in ISO format (e.g., 2024-03-20T11:00:00Z)" },
                summary: { type: "string", description: "The summary/title of the meeting" },
                description: { type: "string", description: "The description of the meeting" },
                send: { type: "boolean", description: "Whether to send an invitation email to the candidate" }
            },
            required: ["candidateId", "startTime", "endTime"],
        },
        _meta: {
            needsApproval: true
        }
    },
];

export const handleMeetingTools = async (name: string, args: any) => {
    try {
        let response;
        switch (name) {
            case "schedule_meeting":
                response = await meetingService.scheduleMeeting(args as ScheduleMeetingRequest);
                console.log("Running schedule_meeting tool");
                break;
            default:
                return null;
        }
        return {
            content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
    } catch (error) {
        return handleServiceError(error);
    }
};
