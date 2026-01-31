import { prisma } from "./src/lib/prisma";

async function testMeetingHandler() {
    console.log("Looking for an existing meeting connection...");

    // Find a connection to use
    const connection = await prisma.meetingConnection.findFirst();

    if (!connection) {
        console.error("No MeetingConnection found in database. Please authenticate first via /connect-meeting-account");
        // For testing purposes without DB, you might hardcode if you are sure:
        // const connectionId = "697811f59535814c9df65d4d";
        return;
    }

    console.log(`Found connection: ${connection.id} (${connection.email})`);

    const startTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
    const endTime = new Date(Date.now() + 7200000).toISOString(); // 2 hours from now

    try {
        const url = `http://localhost:3012/schedule-meeting/${connection.id}`;
        console.log(`Making request to: ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                summary: "Test Meeting from Script",
                description: "This is a test meeting created via test.ts script",
                startTime: startTime,
                endTime: endTime,
                // Add candidateId if you want to test email sending
                // candidateId: "...",
                // send: true
            })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Error making request:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testMeetingHandler();