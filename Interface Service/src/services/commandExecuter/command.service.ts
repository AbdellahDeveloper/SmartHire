import { getCmdData } from "../../models/command";
import {
  approveAction,
  markJobAsClosed,
  rejectAction,
} from "./commandsApiCalls";

export async function runCommand(
  token: string,
  conversationId: string,
  commandId: string,
  data: any,
) {
  //  big switch statement to the the correct api call
  //      - it gets the correct command context from DB
  //      - runs the validator (will ignore it for now and use teams ui validation)
  //      - then run the API call
  //      - just return the results to be passed to the formatter with a Flag to not suggest (may vary given the Toll called)

  const command = await getCmdData(commandId);
  switch (command.action) {
    case "APPROVE_ACTION":
      return approveAction(
        token,
        conversationId,
        command.data.approvalIds as string[],
        command.context,
      );

    case "REJECT_ACTION":
      return rejectAction(
        token,
        conversationId,
        command.data.approvalIds as string[],
        command.context,
      );

    case "MARK_JOB_AS_CLOSED":
      markJobAsClosed();
      break;

    default:
      break;
  }
}
