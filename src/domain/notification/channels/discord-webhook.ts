/**
 * Sends a notification to a Discord channel via webhook.
 * Silently no-ops if DISCORD_WEBHOOK_URL is not configured.
 */
export async function sendDiscordWebhook(
  title: string,
  message: string
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title,
          description: message,
          color: 0x5865f2, // Discord blurple
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });
}
