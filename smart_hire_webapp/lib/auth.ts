import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

const prisma = new PrismaClient();

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mongodb",
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        changeEmail: {
            enabled: true,
        },
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "user",
            },
            companyId: {
                type: "string",
                required: false,
            }
        }
    },
    baseURL:process.env.BETTER_AUTH_URL
});
