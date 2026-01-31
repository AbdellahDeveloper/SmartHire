import {
  Activity,
  CardFactory,
  CloudAdapter,
  ConversationReference,
  MessageFactory,
  TurnContext,
} from "botbuilder";

import {
  ConfigurationServiceClientCredentialFactory,
  createBotFrameworkAuthenticationFromConfiguration,
} from "botbuilder";

let adapter: CloudAdapter;

const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId:
    process.env.CLIENT_ID || "",
  MicrosoftAppPassword:
    process.env.CLIENT_SECRET || "",
  MicrosoftAppType: "SingleTenant",
  MicrosoftAppTenantId:
    process.env.TENANT_ID || "",
});

const botFrameworkAuthentication =
  createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);

adapter = new CloudAdapter(botFrameworkAuthentication);

adapter.onTurnError = async (context, error) => {
  console.error(`[onTurnError] unhandled error: ${error}`);
  await context.sendActivity("The bot encountered an error or bug.");
};

function createAdaptiveCard(json: string) {
  const cardAttachment = CardFactory.adaptiveCard(json);

  // Return a Message Activity that has attachments
  return MessageFactory.attachment(cardAttachment);
}

export async function sendNotification(
  reference: Partial<ConversationReference>,
  message: any | string,
): Promise<void> {
  const appId = process.env.CLIENT_ID;

  if (!appId) {
    throw new Error(
      "CLIENT_ID (Microsoft App ID) is not defined in environment variables.",
    );
  }

  try {
    await adapter.continueConversationAsync(
      appId,
      reference as any,
      async (context) => {
        if (typeof message === "string") {
          const msg = MessageFactory.text(message);
          msg.summary = message;
          msg.channelData = {
            notification: {
              alert: true,
            },
          };
          await context.sendActivity(msg);
        } else {
          message.channelData = {
            notification: {
              alert: true,
            },
          };
          await context.sendActivity(createAdaptiveCard(message));
        }
      },
    );
  } catch (error) {
    console.error("[sendNotification Error]:", error);
    throw error;
  }
}
