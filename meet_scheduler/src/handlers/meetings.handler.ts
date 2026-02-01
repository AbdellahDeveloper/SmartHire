import crypto from "crypto";
import { google } from "googleapis";
import { getTransporter } from "../lib/mail";
import { prisma } from "../lib/prisma";

const oauth2Client = new google.auth.OAuth2(
    {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI
    }
);

const signState = (companyId: string) => {
    const hmac = crypto.createHmac("sha256", process.env.GOOGLE_CLIENT_SECRET || "secret");
    hmac.update(companyId);
    const signature = hmac.digest("hex");
    return `${companyId}:${signature}`;
};

const verifyState = (state: string) => {
    const [companyId, signature] = state.split(":");
    if (!companyId || !signature) throw new Error("Invalid state format");

    const hmac = crypto.createHmac("sha256", process.env.GOOGLE_CLIENT_SECRET || "secret");
    hmac.update(companyId);
    const expectedSignature = hmac.digest("hex");

    if (signature !== expectedSignature) {
        throw new Error("Invalid state signature. Identity verification failed.");
    }
    return companyId;
};

export const authHandler = {
    getAuthUrl: async ({ companyId }: { companyId: string }) => {
        const state = signState(companyId);
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: ["https://www.googleapis.com/auth/calendar"],
            prompt: "consent",
            state: state
        });
        return { url: authUrl };
    },

    handleCallback: async ({ query }: { query: { code: string, state: string } }): Promise<string> => {
        const { code, state } = query;
        if (!code) throw new Error("No code provided");
        if (!state) throw new Error("No state provided");

        const companyId = verifyState(state);

        const { tokens } = await oauth2Client.getToken(code);

        oauth2Client.setCredentials(tokens);
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        const { data } = await calendar.calendarList.get({ calendarId: "primary" });
        const email = data.id || "unknown";

        const connection = await prisma.meetingConnection.upsert({
            where: { email: email },
            update: {
                tokens: tokens as any,
                companyId: companyId
            },
            create: {
                email: email,
                tokens: tokens as any,
                companyId: companyId
            }
        });

        return `
            <html>
                <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: white;">
                    <div style="text-align: center; padding: 2rem; border-radius: 1rem; background: #1e293b; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                        <h1 style="color: #38bdf8; margin-bottom: 1rem;">Connected Successfully!</h1>
                        <p style="color: #94a3b8; margin-bottom: 2rem;">Your Google Meet account has been linked to SmartHire.</p>
                        <button onclick="window.close()" style="background: #38bdf8; color: #0f172a; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: bold; cursor: pointer;">Close Window</button>
                    </div>
                    <script>
                        setTimeout(() => window.close(), 3000);
                    </script>
                </body>
            </html>
        `;
    }
};

export const meetingHandler = {
    scheduleMeeting: async ({ params, body, companyId, companyName }: { params?: { id?: string }, body: any, companyId?: string, companyName: string }) => {
        const id = params?.id;
        let connection;

        if (id) {
            connection = await prisma.meetingConnection.findUnique({
                where: { id }
            });
        } else if (companyId) {
            connection = await prisma.meetingConnection.findFirst({
                where: { companyId }
            });
        }

        if (!connection) throw new Error("Meeting connection not found. Please connect your Google Calendar first.");

        const client = new google.auth.OAuth2(
            {
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                redirectUri: process.env.GOOGLE_REDIRECT_URI
            }
        );
        client.setCredentials(connection.tokens as any);

        const calendar = google.calendar({ version: "v3", auth: client });

        const startDateTime = body.startTime || new Date(Date.now() + 3600000).toISOString();
        const endDateTime = body.endTime || new Date(new Date(startDateTime).getTime() + 3600000).toISOString();

        const eventData = {
            summary: body.summary || "SmartHire Meeting",
            description: body.description || "Created via SmartHire API",
            start: { dateTime: startDateTime },
            end: { dateTime: endDateTime },
            conferenceData: {
                createRequest: { requestId: crypto.randomUUID() },
            },
        };

        const event = await calendar.events.insert({
            calendarId: "primary",
            conferenceDataVersion: 1,
            requestBody: eventData,
        });

        const meetLink = event.data.conferenceData?.entryPoints?.find(
            (e) => e.entryPointType === "video"
        )?.uri;

        const savedMeeting = await prisma.meeting.create({
            data: {
                companyId: connection.companyId,
                connectionId: connection.id,
                summary: eventData.summary,
                description: eventData.description,
                startTime: new Date(startDateTime),
                endTime: new Date(endDateTime),
                meetLink: meetLink || null,
                htmlLink: event.data.htmlLink || null,
                candidateId: body.candidateId || null,
            }
        });

        let emailSent = false;
        if (body.send === 1 || body.send === true) {
            const candidate = await prisma.candidate.findUnique({
                where: { id: body.candidateId }
            });

            if (candidate && candidate.email) {
                const { transporter: dynamicTransporter, sender } = await getTransporter(connection.companyId);

                const mailOptions = {
                    from: `"SmartHire" <${sender}>`,
                    to: candidate.email,
                    subject: `Interview Invitation: ${eventData.summary}`,
                    html: `
                        <h2>Hello ${candidate.firstName || 'Candidate'},</h2>
                        <p>You have been invited to an interview with <strong>${companyName}</strong>.</p>
                        <p><strong>Topic:</strong> ${eventData.summary}</p>
                        <p><strong>Description:</strong> ${eventData.description}</p>
                        <p><strong>Time:</strong> ${new Date(startDateTime).toLocaleString()}</p>
                        <p><strong>Join Meeting (Video):</strong> <a href="${meetLink}">${meetLink}</a></p>
                        <p><strong>Add to Calendar:</strong> <a href="${event.data.htmlLink}">${event.data.htmlLink}</a></p>
                        <p>Best regards,<br>${companyName} Recruiting Team</p>
                    `
                };

                await dynamicTransporter.sendMail(mailOptions);
                emailSent = true;
            }
        }

        return {
            id: event.data.id,
            dbId: savedMeeting.id,
            htmlLink: event.data.htmlLink,
            meetLink,
            emailSent
        };
    }
};