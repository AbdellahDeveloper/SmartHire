import { prisma } from "../utils/prisma";

export const GetTokenFromCid = async (cid:string)=> (
    await prisma.company.findFirst({
      where: {
        microsoftTeamsIds: {
          has: cid,
        },
      },
    })
  )?.mcpToken;