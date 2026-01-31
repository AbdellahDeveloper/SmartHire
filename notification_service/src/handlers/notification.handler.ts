import { sendNotification } from "../lib/email";

export const notificationHandler = {
    notifyBulkUploadComplete: async ({ body }: { body: { userId: string, count: number, status: string } }) => {
        const { count, status } = body;

        await sendNotification(
            process.env.ADMIN_EMAIL!,
            `Bulk Upload Processed: ${status}`,
            `
            <h3>Bulk Upload Summary</h3>
            <p><strong>Status:</strong> ${status}</p>
            <p><strong>Candidates Processed:</strong> ${count}</p>
            <p>The system has finished parsing and creating candidates from your bulk upload.</p>
            `,
            undefined,
            true
        );

        return { success: true, message: "Notification sent" };
    },

    handleMeetingDecision: async (meetingId: string, action: "accept" | "reject") => {
        const { prisma } = await import("../lib/prisma");
        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId }
        });

        if (!meeting) return { success: false, message: "Meeting not found" };

        const company = await prisma.company.findUnique({
            where: { id: meeting.companyId }
        });

        if (!company) return { success: false, message: "Company not found" };

        const candidate = meeting.candidateId ? await prisma.candidate.findUnique({
            where: { id: meeting.candidateId }
        }) : null;

        if (!candidate) return { success: false, message: "Candidate not found" };

        let subject = "";
        let html = "";

        if (action === "accept") {
            // Use Report Service to generate contract
            console.log(`[Notification] Calling report service to generate contract for ${candidate.fullName}...`);

            let contractUrl = "";
            try {
                const reportResponse = await fetch("http://localhost:3005/api/reports/contract", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${company.mcpToken}`
                    },
                    body: JSON.stringify({
                        candidateId: candidate.id,
                        jobId: candidate.jobId,
                        date: new Date().toLocaleDateString()
                    })
                });

                if (reportResponse.ok) {
                    const reportData: any = await reportResponse.json();
                    contractUrl = reportData.url;
                } else {
                    console.error("[Notification] Report service failed:", await reportResponse.text());
                }
            } catch (err) {
                console.error("[Notification] Error calling report service:", err);
            }

            subject = `Hiring Status: Contract Agreement for ${company.name}`;
            html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                    <h2 style="color: #2563eb; margin-bottom: 20px;">Congratulations ${candidate.fullName}!</h2>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">We are thrilled to move forward with your application for the position at <strong>${company.name}</strong>.</p>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">Please find your employment contract attached below for review and signature.</p>
                    
                    ${contractUrl ? `
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${contractUrl}" 
                           style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
                           View & Sign Contract
                        </a>
                    </div>
                    ` : `
                    <p style="color: #ef4444; font-weight: bold; margin: 20px 0;">Our team will reach out to you shortly with the contract documents manually as the automated system encountered an issue.</p>
                    `}
                    
                    <p style="color: #64748b; font-size: 14px; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                        Best regards,<br>
                        <strong>The ${company.name} Team</strong>
                    </p>
                </div>
            `;
        } else {
            subject = `Application Status - ${company.name}`;
            html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">Dear ${candidate.fullName},</p>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">Thank you for your interest in the position at <strong>${company.name}</strong> and for taking the time to meet with us.</p>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">After careful consideration, we have decided not to move forward with your application at this time.</p>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">We wish you the best of luck in your job search and future professional endeavors.</p>
                    
                    <p style="color: #64748b; font-size: 14px; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                        Sincerely,<br>
                        <strong>The ${company.name} Hiring Team</strong>
                    </p>
                </div>
            `;
        }

        await sendNotification(candidate.email, subject, html, meeting.companyId, true);

        return { success: true, message: `Email (${action}) sent to candidate ${candidate.email}` };
    }
};
