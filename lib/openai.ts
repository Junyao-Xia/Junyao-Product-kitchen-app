export const OPENAI_MODEL = "gpt-4o-mini";

const CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

export function getOpenAIApiKey(): string | undefined {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || undefined;
}

export type ChatCompletionOptions = {
  /** Ask the API to return a JSON object (reduces markdown-wrapped payloads). */
  jsonObject?: boolean;
};

export async function fetchChatCompletion(
  system: string,
  user: string,
  apiKey: string,
  options: ChatCompletionOptions = {},
): Promise<string> {
  const response = await fetch(CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      ...(options.jsonObject ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }
  return content;
}
