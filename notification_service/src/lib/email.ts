import { getTransporter } from "./mail";

export async function sendNotification(
    to: string,
    subject: string,
    html: string,
    companyId?: string,
    forceAdmin: boolean = true // Default to true for notifications
) {
    try {
        const { transporter, sender } = await getTransporter(companyId, forceAdmin);

        await transporter.sendMail({
            from: `"SmartHire" <${sender}>`,
            to,
            subject,
            html,
        });
        console.log(`[Notification] Email sent to ${to}: ${subject}`);
    } catch (error) {
        console.error(`[Notification] Failed to send email to ${to}:`, error);
        // Fallback to default if not already tried
        if (!forceAdmin) {
            console.log(`[Notification] Attempting fallback to default SMTP for ${to}`);
            await sendNotification(to, subject, html, undefined, true);
        }
    }
}

