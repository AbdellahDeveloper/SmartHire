// this file contains all the tunning and config that defines the Planner Agent behaver

export const SystemPrompt = `
   You are a formatter for an HR platform used inside Microsoft Teams.
   make any text you get organized anf formatted and don't include and ids or stuff that wont benefit the HR

   use teams adaptive cards schema 
   if you want to make a table pls dont exceed 4 colums in a table
   make it look beautiful
   you can use markdown inside TextBlock
   don't use emojis
   dont add action 

   here is some schema examples :

    `;

export const examplesForCards = `
Here is some examples
1. Candidate Profile Card
Description: This card displays a detailed view of a candidate, including their contact information, years of experience, and key skills. It features an action button to open a full CV and includes a hidden metadata section for backend tracking.

JSON
{
  "type": "AdaptiveCard",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.5",
  "body": [
    {
      "type": "Container",
      "items": [
        {
          "type": "TextBlock",
          "text": "Candidate: Sarah Jenkins",
          "weight": "Bolder",
          "size": "ExtraLarge",
          "color": "Accent"
        },
        {
          "type": "TextBlock",
          "text": "Senior Fullstack Engineer",
          "isSubtle": true,
          "size": "Medium",
          "weight": "Bolder",
          "spacing": "None"
        },
        {
          "type": "FactSet",
          "facts": [
            { "title": "Email", "value": "sarah.j@example.com" },
            { "title": "Phone", "value": "+1-555-0123" },
            { "title": "Experience", "value": "8 years" },
            { "title": "Location", "value": "Austin, TX" },
            { "title": "Status", "value": "Ready" }
          ]
        }
      ]
    },
    {
      "type": "Container",
      "separator": true,
      "items": [
        { "type": "TextBlock", "text": "Summary", "weight": "Bolder" },
        { "type": "TextBlock", "text": "Experienced engineer specializing in distributed systems and React-based frontends.", "wrap": true }
      ]
    },
    {
      "type": "Container",
      "separator": true,
      "items": [
        { "type": "TextBlock", "text": "Key Skills", "weight": "Bolder" },
        { "type": "TextBlock", "text": "TypeScript, Node.js, React, AWS, Docker", "wrap": true }
      ]
    },
    {
      "type": "ActionSet",
      "actions": [
        {
          "type": "Action.OpenUrl",
          "title": "Open Full CV",
          "url": "https://example.com/cv/sjenkins"
        }
      ]
    },
    {
      "type": "Container",
      "id": "metadata-cand_001",
      "isVisible": false,
      "items": [
        {
          "type": "FactSet",
          "facts": [
            { "title": "Candidate ID", "value": "cand_001" },
            { "title": "Gender", "value": "Female" },
            { "title": "Languages", "value": "English (Native), Spanish (Professional)" }
          ]
        }
      ]
    }
  ]
}
2. Job Posting Card
Description: This card provides a high-level summary of a job opening. It highlights critical details such as seniority level, work mode (e.g., Remote), and salary ranges, along with required and "nice-to-have" skills.

JSON
{
  "type": "AdaptiveCard",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.5",
  "body": [
    {
      "type": "Container",
      "items": [
        {
          "type": "TextBlock",
          "text": "Job: Backend Architect",
          "weight": "Bolder",
          "size": "ExtraLarge",
          "color": "Accent"
        },
        {
          "type": "TextBlock",
          "text": "Engineering | Technology",
          "isSubtle": true,
          "size": "Medium",
          "weight": "Bolder",
          "spacing": "None"
        },
        {
          "type": "FactSet",
          "facts": [
            { "title": "Seniority", "value": "Senior" },
            { "title": "Work Mode", "value": "Remote" },
            { "title": "Type", "value": "Full-time" },
            { "title": "Location", "value": "New York, NY" },
            { "title": "Salary", "value": "140000 - 180000 USD" },
            { "title": "Education", "value": "Master's Degree" }
          ]
        }
      ]
    },
    {
      "type": "Container",
      "separator": true,
      "items": [
        { "type": "TextBlock", "text": "Description", "weight": "Bolder" },
        { "type": "TextBlock", "text": "We are looking for a Backend Architect to lead our infrastructure scaling efforts.", "wrap": true }
      ]
    },
    {
      "type": "Container",
      "separator": true,
      "items": [
        { "type": "TextBlock", "text": "Required Skills", "weight": "Bolder" },
        { "type": "TextBlock", "text": "Go, Kubernetes, PostgreSQL, Redis", "wrap": true }
      ]
    }
  ]
}
3. Candidate Match Result Card
Description: Used for analyzing how well a candidate fits a specific job. The card uses a color-coded match score (Green for high, Yellow for medium, Red for low) and provides a specific breakdown of matched versus missing skills.

JSON
{
  "type": "AdaptiveCard",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.5",
  "body": [
    {
      "type": "TextBlock",
      "text": "Candidate Matching Results",
      "weight": "Bolder",
      "size": "ExtraLarge",
      "color": "Accent"
    },
    {
      "type": "Container",
      "separator": true,
      "items": [
        {
          "type": "ColumnSet",
          "columns": [
            {
              "type": "Column",
              "width": "stretch",
              "items": [
                { "type": "TextBlock", "text": "Alex Rivera", "weight": "Bolder", "size": "Medium" },
                { "type": "TextBlock", "text": "Lead Developer", "isSubtle": true, "spacing": "None" }
              ]
            },
            {
              "type": "Column",
              "width": "auto",
              "items": [
                { "type": "TextBlock", "text": "92%", "weight": "Bolder", "size": "Large", "color": "Good" }
              ]
            }
          ]
        },
        {
          "type": "TextBlock",
          "text": "Strong match with deep expertise in the required tech stack and 5 years of leadership experience.",
          "wrap": true
        },
        {
          "type": "FactSet",
          "spacing": "Medium",
          "facts": [
            { "title": "Seniority", "value": "Perfect Alignment" },
            { "title": "Experience", "value": "Exceeds requirements" },
            { "title": "Matched Skills", "value": "React, Node.js, SQL" },
            { "title": "Missing Skills", "value": "GraphQL" }
          ]
        }
      ]
    }
  ]
}`;

export const MAX_ITERATIONS = 1;
export const MAX_RETRIES = 1;
export const FORMATTER_MODEL = "gpt-5-mini";
