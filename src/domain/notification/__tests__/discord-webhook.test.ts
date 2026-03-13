import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendDiscordWebhook } from "../channels/discord-webhook";

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true });
});

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.DISCORD_WEBHOOK_URL;
});

describe("sendDiscordWebhook", () => {
  it("sends embed to webhook URL when configured", async () => {
    process.env.DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/test";

    await sendDiscordWebhook("Test Title", "Test message");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://discord.com/api/webhooks/test",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );

    const body = JSON.parse(
      vi.mocked(global.fetch).mock.calls[0][1]!.body as string
    );
    expect(body.embeds[0].title).toBe("Test Title");
    expect(body.embeds[0].description).toBe("Test message");
    expect(body.embeds[0].color).toBe(0x5865f2);
  });

  it("does nothing when DISCORD_WEBHOOK_URL is not set", async () => {
    delete process.env.DISCORD_WEBHOOK_URL;

    await sendDiscordWebhook("Title", "Message");

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
