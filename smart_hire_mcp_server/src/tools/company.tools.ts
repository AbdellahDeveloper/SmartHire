import { getAuthToken } from "../lib/auth-context.js";
import prisma from "../lib/prisma.js";
import { handleServiceError } from "../services/base.service.js";

export const companyToolDefinitions = [
    {
        name: "get_company_data",
        description: "Get the authenticated company's name and email",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
];

export const handleCompanyTools = async (name: string, args: any) => {
    try {
        switch (name) {
            case "get_company_data":
                const token = getAuthToken();
                if (!token) {
                    throw new Error("No authentication token found");
                }

                const company = await prisma.company.findUnique({
                    where: { mcpToken: token },
                    select: {
                        name: true,
                        email: true,
                    },
                });

                if (!company) {
                    throw new Error("Company not found");
                }

                return {
                    content: [{ type: "text", text: JSON.stringify(company, null, 2) }],
                };
            default:
                return null;
        }
    } catch (error) {
        return handleServiceError(error);
    }
};
