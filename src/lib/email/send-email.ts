interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface SendEmailResult {
  sent: boolean;
  messageId?: string;
  reason?: string;
  error?: string;
}

const DEFAULT_FROM = "CalTask <onboarding@resend.dev>";

function getResendConfig() {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;
  return { resendKey, from };
}

export function isEmailConfigured(): boolean {
  return Boolean(getResendConfig().resendKey);
}

/** Override provider DB email — use your real inbox for Resend delivery. */
export function resolveProviderNotificationEmail(providerEmail: string): string {
  const override = process.env.PROVIDER_NOTIFICATION_EMAIL?.trim();
  if (override) return override;

  if (providerEmail.endsWith("@example.com")) {
    console.warn(
      "[email] Provider email is a placeholder (@example.com). Set PROVIDER_NOTIFICATION_EMAIL in .env to your real inbox.",
    );
  }

  return providerEmail;
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const { resendKey, from } = getResendConfig();

  if (!resendKey) {
    console.info(
      "[email] Email not sent — set RESEND_API_KEY in .env and restart the dev server.",
      { to: input.to, subject: input.subject },
    );
    return { sent: false, reason: "not_configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    const body = (await response.json()) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!response.ok) {
      const error =
        body.message ??
        (typeof body === "object" ? JSON.stringify(body) : "Unknown error");
      console.error("Resend API error:", response.status, error);
      return { sent: false, reason: "resend_error", error };
    }

    console.info("[email] Sent successfully:", {
      to: input.to,
      subject: input.subject,
      messageId: body.id,
    });

    return { sent: true, messageId: body.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to send email via Resend:", error);
    return { sent: false, reason: "resend_error", error };
  }
}
