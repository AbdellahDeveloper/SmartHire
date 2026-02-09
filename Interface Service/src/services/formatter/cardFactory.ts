export const cardFactory = {
  approvalCard(toolsNames: string[], approvalId: string, rejectionId: string) {
    return {
      type: "AdaptiveCard",
      $schema: "https://adaptivecards.io/schemas/adaptive-card.json",
      version: "1.6",
      actions: [
        {
          type: "Action.Submit",
          title: "Approve Actions",
        },
        {
          type: "Action.Submit",
          title: "Reject Actions",
        },
      ],
      body: [
        {
          type: "Badge",
          text: "Actions that Needs your approval",
          size: "Large",
          style: "Accent",
        },
      ],
    };
  },
};
