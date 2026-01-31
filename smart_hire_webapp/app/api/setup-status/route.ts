import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const settings = await prisma.systemSettings.findFirst({
            select: { isSetupComplete: true }
        });
        return NextResponse.json({ isComplete: !!settings?.isSetupComplete });
    } catch (error) {
        return NextResponse.json({ isComplete: false }, { status: 500 });
    }
}
