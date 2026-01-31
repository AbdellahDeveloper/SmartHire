
import { prisma } from "./lib/prisma";

async function main() {
    try {
        const settings = await prisma.systemSettings.findFirst();
        if (settings) {
            console.log("Found existing system settings. Deleting...");
            await prisma.systemSettings.deleteMany();
            console.log("System settings deleted. You can now access /setup again.");
        } else {
            console.log("No system settings found.");
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
