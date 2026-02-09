import { generateText, Output, stepCountIs } from "ai";
import {
  examplesForCards,
  FORMATTER_MODEL,
  MAX_ITERATIONS,
  MAX_RETRIES,
  SystemPrompt,
} from "./formatter.config";
import { getModel } from "../../models/ai-provider";

export async function Formatter(AgentResponse: string,userReq:string) {
  console.log("Formatting");
  const schema = await Bun.file(
    "./src/services/formatter/adaptiveCardSchema.json",
  ).text();
  const response = await generateText({
    model: await getModel(),
    output: Output.json(),
    maxRetries: MAX_RETRIES,
    onStepFinish: (s) => console.log("[step completed] in FORMATTER"),
    stopWhen: stepCountIs(MAX_ITERATIONS),
    providerOptions: {
      openai: {
        reasoningEffort: "minimal",
        // serviceTier: "priority",
      },
    },
    messages: [
      {
        role: "user",
        content: [
          {
            text: schema,
            type: "text",
          },
          {
            text: examplesForCards,
            type: "text",
          },
          {
            text: "Here is what the user requested Just take formate requests From it and get a better context :"+ userReq,
            type: "text",
          },

          {
            text: `What you Formate : ${AgentResponse}`,
            type: "text",
          },
        ],
      },
    ],
    system: SystemPrompt,
    // prompt: , // need to maek it generate obj so that we can render them in a json to treams compiler
  });

  return response.output;
}
