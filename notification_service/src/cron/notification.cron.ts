import Baker from "cronbake";
import { sendNotification } from "../lib/email";
import { prisma } from "../lib/prisma";

export function startNotificationCron() {
    const baker = Baker.create({
        onError: (error, jobName) => {
            console.error(`[CRONBake] Job ${jobName} failed:`, error.message);
        }
    });

    // 1. Meeting Reminders (Every hour)
    baker.add({
        name: "meeting-reminders",
        cron: process.env.MEETING_REMINDER_CRON || "0 0 * * * *",
        callback: async () => {
            console.log("[CRON] Checking for upcoming meetings...");
            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

            const upcomingMeetings = await prisma.meeting.findMany({
                where: {
                    startTime: {
                        gt: now,
                        lte: oneHourFromNow
                    }
                }
            });

            for (const meeting of upcomingMeetings) {
                await sendNotification(
                    process.env.ADMIN_EMAIL!,
                    `Reminder: Upcoming Meeting - ${meeting.summary}`,
                    `
                    <h3>Meeting Reminder</h3>
                    <p><strong>Summary:</strong> ${meeting.summary}</p>
                    <p><strong>Time:</strong> ${meeting.startTime.toLocaleString()}</p>
                    <p><strong>Join Link:</strong> <a href="${meeting.meetLink}">${meeting.meetLink}</a></p>
                    `
                );
            }
        },
        overrunProtection: true
    });

    // 2. Stale Job Alerts (Every day)
    baker.add({
        name: "stale-job-alerts",
        cron: process.env.STALE_JOB_CRON || "0 0 9 * * *",
        callback: async () => {
            console.log("[CRON] Checking for stale jobs...");
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const staleJobs = await prisma.job.findMany({
                where: {
                    status: "open",
                    createdAt: {
                        lt: sevenDaysAgo
                    }
                }
            });

            if (staleJobs.length > 0) {
                await sendNotification(
                    process.env.ADMIN_EMAIL!,
                    `Stale Jobs Alert: ${staleJobs.length} jobs need attention`,
                    `
                    <h3>Stale Jobs Report</h3>
                    <p>The following jobs have been open for more than 7 days:</p>
                    <ul>
                        ${staleJobs.map(job => `<li>${job.title} (Created: ${job.createdAt.toLocaleDateString()})</li>`).join('')}
                    </ul>
                    <p>Please consider closing them or renewing the search.</p>
                    `
                );
            }
        },
        overrunProtection: true
    });

    baker.add({
        name: "high-score-matches",
        cron: process.env.HIGH_SCORE_MATCH_CRON || "0 0 0 * * *",
        callback: async () => {
            console.log("[CRON] Checking triggers for high-score matches...");

            const currentCandidateCount = await prisma.candidate.count();
            const lastCountSetting = await prisma.systemSettings.findUnique({
                where: { key: "last_candidate_count_high_score" }
            });

            const lastCount = lastCountSetting ? parseInt(lastCountSetting.value) : 0;
            const diff = currentCandidateCount - lastCount;

            if (diff < 200 && lastCountSetting) {
                console.log(`[CRON] Only ${diff} new candidates added since last run. Minimum 200 required. Skipping.`);
                return;
            }

            console.log(`[CRON] Threshold met (${diff} new candidates). Processing high-score matches...`);

            const latestJobs = await prisma.job.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' }
            });

            for (const job of latestJobs) {
                try {
                    const MATCHING_SERVICE_URL = process.env.MATCHING_SERVICE_URL || "http://localhost:3004/api";
                    const response = await fetch(`${MATCHING_SERVICE_URL}/matching/match`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ jobId: job.id })
                    });

                    if (!response.ok) {
                        console.error(`[CRON] Matching service failed for job ${job.id}: ${response.statusText}`);
                        continue;
                    }

                    const matchData: any = await response.json();
                    if (!matchData.success) continue;

                    const matchResults = matchData.matchResults || [];
                    const highScores = matchResults.filter((r: any) => r.score >= 85);

                    if (highScores.length === 0) continue;

                    const newHighScores = [];
                    for (const result of highScores) {
                        // Check if this candidate already had a match >= 85 for this job in ANY previous session
                        const existingMatch = await prisma.matchResult.findFirst({
                            where: {
                                candidateId: result.candidateId,
                                score: { gte: 85 },
                                matchSession: {
                                    jobId: job.id,
                                    id: { not: matchData.sessionId } // Exclude current session
                                }
                            }
                        });

                        if (!existingMatch) {
                            newHighScores.push(result);
                        }
                    }

                    if (newHighScores.length > 0) {
                        await sendNotification(
                            process.env.ADMIN_EMAIL!,
                            `New High Score Match for ${job.title}`,
                            `
                            <h3>Great news!</h3>
                            <p>We found ${newHighScores.length} <strong>new</strong> candidates with a score &ge; 85% for the position: <strong>${job.title}</strong>.</p>
                            <ul>
                                ${newHighScores.map(c => `<li>${c.candidateName} - Score: ${c.score}%</li>`).join('')}
                            </ul>
                            <p>Check the matching dashboard for details.</p>
                            `
                        );
                    }
                } catch (err) {
                    console.error(`[CRON] Matching failed for job ${job.id}:`, err);
                }
            }

            // Update the last candidate count
            await prisma.systemSettings.upsert({
                where: { key: "last_candidate_count_high_score" },
                update: { value: currentCandidateCount.toString() },
                create: { key: "last_candidate_count_high_score", value: currentCandidateCount.toString() }
            });
            console.log(`[CRON] High-score matches completed. Last count updated to ${currentCandidateCount}`);
        },
        overrunProtection: true
    });

    // 4. Post-Meeting Follow-up (Every hour)
    baker.add({
        name: "post-meeting-followup",
        cron: process.env.POST_MEETING_FOLLOWUP_CRON || "0 0 0 * * *",
        callback: async () => {
            console.log("[CRON] Checking for meetings that ended 1 day ago...");
            const now = new Date();
            const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);

            const pastMeetings = await prisma.meeting.findMany({
                where: {
                    endTime: {
                        lte: twentyFourHoursAgo,
                        gt: twentyFiveHoursAgo
                    },
                    followUpSent: false
                }
            });

            for (const meeting of pastMeetings) {
                const company = await prisma.company.findUnique({
                    where: { id: meeting.companyId }
                });

                if (!company) continue;

                const candidate = meeting.candidateId ? await prisma.candidate.findUnique({
                    where: { id: meeting.candidateId }
                }) : null;

                // Find the latest match result for this candidate and job
                let matchResult = null;
                if (candidate && candidate.jobId) {
                    matchResult = await prisma.matchResult.findFirst({
                        where: {
                            candidateId: candidate.id,
                            matchSession: {
                                jobId: candidate.jobId
                            }
                        },
                        orderBy: { createdAt: 'desc' }
                    });
                }

                const decisionUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/meeting-decision`;

                const smtpConfig = company.smtpServer ? {
                    host: company.smtpServer,
                    port: company.smtpPort || 587,
                    user: company.smtpEmail || "",
                    pass: company.smtpPassword || ""
                } : undefined;

                await sendNotification(
                    company.email,
                    `Decision Required: Meeting with ${candidate?.fullName || 'Candidate'} ended`,
                    `
                    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <h2 style="color: #1e293b; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Meeting Follow-up</h2>
                        <p style="color: #475569; font-size: 16px;">Hello,</p>
                        <p style="color: #475569; font-size: 16px;">Your meeting regarding <strong>${meeting.summary}</strong> with <strong>${candidate?.fullName || 'the candidate'}</strong> ended yesterday.</p>
                        
                        ${matchResult ? `
                        <div style="margin: 20px 0; padding: 15px; border-radius: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Match Analysis</p>
                            <p style="margin: 10px 0; font-size: 24px; color: ${matchResult.score >= 80 ? '#10b981' : matchResult.score >= 60 ? '#f59e0b' : '#ef4444'}; font-weight: 800;">
                                ${matchResult.score}% Compatibility Score
                            </p>
                            ${(matchResult.analysis as any).reasoning ? `
                            <p style="margin: 10px 0; color: #475569; font-size: 14px; line-height: 1.5; font-style: italic;">
                                "${(matchResult.analysis as any).reasoning}"
                            </p>
                            ` : ''}
                        </div>
                        ` : ''}

                        <p style="color: #475569; font-size: 16px; margin-top: 20px;">Based on your interaction, would you like to proceed with this candidate?</p>
                        
                        <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: start;">
                            <a href="${decisionUrl}?meetingId=${meeting.id}&action=accept&matchId=${matchResult?.id || ''}" 
                               style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
                               Send Contract (Accept)
                            </a>
                            <a href="${decisionUrl}?meetingId=${meeting.id}&action=reject&matchId=${matchResult?.id || ''}" 
                               style="background-color: #ffffff; color: #ef4444; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; border: 2px solid #ef4444;">
                               Send Rejection
                            </a>
                        </div>
                        
                        <div style="margin-top: 35px; padding-top: 20px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 13px;">
                            <p style="margin: 0;"><strong>Candidate Details:</strong></p>
                            <p style="margin: 5px 0;">Name: ${candidate?.fullName || 'N/A'}</p>
                            <p style="margin: 5px 0;">Email: ${candidate?.email || 'N/A'}</p>
                            <p style="margin: 5px 0;">Current Role: ${candidate?.currentJobTitle || 'N/A'}</p>
                        </div>
                    </div>
                    `
                );

                await prisma.meeting.update({
                    where: { id: meeting.id },
                    data: { followUpSent: true }
                });
            }
        },
        overrunProtection: true
    });

    baker.bakeAll();
    console.log("[CRON] Notification cron jobs started");
}
