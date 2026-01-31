import { prisma } from "../utils/prisma";

export async function getCmdData(commandId: string) {
  const cmd = await prisma.commands.findFirst({
    where: {
      id: commandId,
    },
  });
  if (!cmd) throw Error("requested Command dose not exist!");

  return {
    action: cmd?.action,
    data: {
      candId: cmd.candId,
      jobId: cmd.jobId,
      approvalIds: cmd.ApprovalIds?.split(";"),
    },
    context: JSON.parse(cmd.context),
  };
}
