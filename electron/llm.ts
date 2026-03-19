/**
 * Streams a response from Claude API
 */
export async function* streamClaudeResponse(
  apiKey: string,
  userMessage: string
): AsyncGenerator<string, void, unknown> {
  console.log("[Claude] Sending message:", userMessage);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      stream: true,
      system:
        "You are a helpful conversational assistant. Keep responses concise and conversational. Never use markdown formatting, bullet points, asterisks, headers, or any special characters. Respond in plain spoken English only as your response will be read aloud.",
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter((l) => l.startsWith("data:"));

    for (const line of lines) {
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const token = parsed?.delta?.text;
        if (token) {
          yield token;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  console.log("[Claude] Stream complete");
}
