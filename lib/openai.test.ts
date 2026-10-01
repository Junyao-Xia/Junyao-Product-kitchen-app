import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchChatCompletion,
  getOpenAIApiKey,
  OPENAI_MODEL,
} from "@/lib/openai";

describe("openai client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("reads a trimmed API key from the environment", () => {
    vi.stubEnv("OPENAI_API_KEY", "  sk-test  ");
    expect(getOpenAIApiKey()).toBe("sk-test");
    vi.stubEnv("OPENAI_API_KEY", "   ");
    expect(getOpenAIApiKey()).toBeUndefined();
  });

  it("returns chat completion content on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "  hello  " } }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const content = await fetchChatCompletion("sys", "user", "sk-test", {
      jsonObject: true,
    });

    expect(content).toBe("hello");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as {
      model: string;
      response_format?: { type: string };
    };
    expect(body.model).toBe(OPENAI_MODEL);
    expect(body.response_format).toEqual({ type: "json_object" });
  });

  it("throws when the API responds with an error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );

    await expect(
      fetchChatCompletion("sys", "user", "sk-test"),
    ).rejects.toThrow("503");
  });

  it("throws when the API returns empty content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "   " } }] }),
      }),
    );

    await expect(
      fetchChatCompletion("sys", "user", "sk-test"),
    ).rejects.toThrow("empty response");
  });
});
