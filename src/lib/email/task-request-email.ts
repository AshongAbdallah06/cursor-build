import { format, isSameDay } from "date-fns";
import { getAppUrl } from "@/lib/app-url";
import {
  resolveProviderNotificationEmail,
  sendEmail,
} from "@/lib/email/send-email";
import { TASK_PRIORITY_LABELS } from "@/lib/constants";
import type { TaskPriority } from "@/types";

interface TaskRequestEmailInput {
  providerEmail: string;
  providerName: string;
  clientName: string;
  clientEmail: string;
  title: string;
  description: string | null;
  startTime: Date | null;
  endTime: Date | null;
  priority: TaskPriority;
}

export async function sendTaskRequestEmail(input: TaskRequestEmailInput) {
  const appUrl = getAppUrl();
  const whenLabel = formatScheduleRange(input.startTime, input.endTime);
  const priority = TASK_PRIORITY_LABELS[input.priority];
  const to = resolveProviderNotificationEmail(input.providerEmail);

  const subject = `New task request from ${input.clientName}: ${input.title}`;

  const text = [
    `Hi ${input.providerName},`,
    "",
    `${input.clientName} (${input.clientEmail}) submitted a new task request.`,
    "",
    `Title: ${input.title}`,
    input.description ? `Details: ${input.description}` : null,
    `When: ${whenLabel}`,
    `Priority: ${priority}`,
    "",
    `Review it in CalTask: ${appUrl}/calendar`,
    "",
    "— CalTask",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <p>Hi ${escapeHtml(input.providerName)},</p>
    <p><strong>${escapeHtml(input.clientName)}</strong> (${escapeHtml(input.clientEmail)}) submitted a new task request.</p>
    <table style="border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Title</td><td>${escapeHtml(input.title)}</td></tr>
      ${
        input.description
          ? `<tr><td style="padding:4px 12px 4px 0;font-weight:600;vertical-align:top;">Details</td><td>${escapeHtml(input.description)}</td></tr>`
          : ""
      }
      <tr><td style="padding:4px 12px 4px 0;font-weight:600;">When</td><td>${escapeHtml(whenLabel)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Priority</td><td>${escapeHtml(priority)}</td></tr>
    </table>
    <p><a href="${escapeHtml(`${appUrl}/calendar`)}">Open your calendar</a> to review the request.</p>
    <p style="color:#666;font-size:12px;">— CalTask</p>
  `.trim();

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}

function formatScheduleRange(start: Date | null, end: Date | null): string {
  if (!start || !end) {
    return "No date or time specified";
  }

  if (isSameDay(start, end)) {
    return `${format(start, "EEEE, MMMM d, yyyy · h:mm a")} – ${format(end, "h:mm a")}`;
  }

  return `${format(start, "MMM d, yyyy · h:mm a")} – ${format(end, "MMM d, yyyy · h:mm a")}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
