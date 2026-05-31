export interface AssistantStarterPrompt {
  id: string;
  label: string;
  message: string;
}

export interface AssistantStarterPromptGroup {
  id: string;
  title: string;
  prompts: AssistantStarterPrompt[];
}

export const ASSISTANT_STARTER_PROMPT_GROUPS: AssistantStarterPromptGroup[] = [
  {
    id: "today",
    title: "Today & upcoming",
    prompts: [
      {
        id: "today-schedule",
        label: "What's on my calendar today?",
        message: "What's on my calendar today? Summarize my tasks and events.",
      },
      {
        id: "tomorrow-schedule",
        label: "Show me tomorrow",
        message: "What does my schedule look like tomorrow?",
      },
      {
        id: "rest-of-week",
        label: "Plan the rest of my week",
        message:
          "Look at the rest of this week and give me a quick overview of what's already scheduled.",
      },
      {
        id: "next-seven-days",
        label: "Next 7 days at a glance",
        message:
          "Review my calendar for the next seven days and highlight anything busy or back-to-back.",
      },
      {
        id: "free-today",
        label: "When am I free today?",
        message:
          "Check my availability for the rest of today and suggest open time slots.",
      },
      {
        id: "free-tomorrow",
        label: "When am I free tomorrow?",
        message:
          "Check my availability tomorrow and list the best open blocks of time.",
      },
    ],
  },
  {
    id: "block-time",
    title: "Block focus time",
    prompts: [
      {
        id: "focus-tomorrow-am",
        label: "Block focus time tomorrow morning",
        message:
          "Block two hours of focus time tomorrow morning on my calendar.",
      },
      {
        id: "focus-today-pm",
        label: "Block focus time this afternoon",
        message:
          "Find a free 90-minute slot this afternoon and draft focus time for me.",
      },
      {
        id: "deep-work-week",
        label: "Add deep work this week",
        message:
          "Find three 2-hour deep work blocks this week where I'm least busy and draft them for me.",
      },
      {
        id: "lunch-break",
        label: "Protect lunch daily",
        message:
          "Draft a recurring-style lunch break around noon on any open days this week for 45 minutes.",
      },
      {
        id: "no-meetings-block",
        label: "No-meetings block Friday",
        message:
          "Draft a no-meetings focus block this Friday from 9 AM to 12 PM.",
      },
    ],
  },
  {
    id: "reminders",
    title: "Reminders & tasks",
    prompts: [
      {
        id: "call-reminder",
        label: "Remind me to call someone",
        message:
          "Remind me to call John tomorrow at 4 PM for 30 minutes.",
      },
      {
        id: "follow-up",
        label: "Schedule a follow-up",
        message:
          "Draft a 30-minute follow-up meeting next week — pick a sensible open slot.",
      },
      {
        id: "deadline-prep",
        label: "Prep time before a deadline",
        message:
          "I have a deadline Friday. Draft two hours of prep time on Wednesday or Thursday.",
      },
      {
        id: "email-catchup",
        label: "Email catch-up block",
        message:
          "Draft a 45-minute email catch-up block tomorrow afternoon.",
      },
      {
        id: "errand-reminder",
        label: "Personal errand reminder",
        message:
          "Draft a reminder to pick up groceries tomorrow evening around 6 PM for 30 minutes.",
      },
    ],
  },
  {
    id: "planning",
    title: "Planning & conflicts",
    prompts: [
      {
        id: "conflicts",
        label: "Any scheduling conflicts?",
        message:
          "Check my schedule this week for overlapping events or tight back-to-back meetings.",
      },
      {
        id: "lighten-day",
        label: "Lighten up a busy day",
        message:
          "Find my busiest day this week and suggest where I could move or shorten something.",
      },
      {
        id: "meeting-slot",
        label: "Find a meeting slot",
        message:
          "Find a 1-hour meeting slot this week that works with my current calendar.",
      },
      {
        id: "morning-routine",
        label: "Morning routine block",
        message:
          "Draft a 30-minute morning planning block on the next three weekdays at 8 AM.",
      },
      {
        id: "wrap-up",
        label: "End-of-day wrap-up",
        message:
          "Draft a 20-minute end-of-day wrap-up block today or tomorrow at 5 PM.",
      },
      {
        id: "weekend-plan",
        label: "Review my weekend",
        message:
          "What's on my calendar this weekend? Keep it brief.",
      },
    ],
  },
];

export const ASSISTANT_STARTER_PROMPTS = ASSISTANT_STARTER_PROMPT_GROUPS.flatMap(
  (group) => group.prompts,
);
