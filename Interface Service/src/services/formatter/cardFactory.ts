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
          key: "ddddd",
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
        {
          type: "TextBlock",
          text: " [![portfolio](https://img.shields.io/badge/my_portfolio-000?style=for-the-badge&logo=ko-fi&logoColor=white)](https://katherineoelsner.com/) \n | Tables   |      Are      |  Cool |\n|----------|:-------------:|------:|\n| col 1 is |  left-aligned | $1600 |\n| col 2 is |    centered   |   $12 |\n| col 3 is | right-aligned |    $1 |",
          wrap: true,
        },
      ],
    };
  },
};
