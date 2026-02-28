import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export async function callClaude(opts: {
  model: "claude-sonnet-4-5-20250929" | "claude-opus-4-6";
  system?: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const anthropic = getAnthropicClient();

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: opts.model,
        max_tokens: opts.maxTokens || 4096,
        temperature: opts.temperature ?? 0.3,
        system: opts.system,
        messages: [{ role: "user", content: opts.prompt }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const content = textBlock ? textBlock.text : "";

      return {
        content,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[AI] Attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error("AI call failed after retries");
}
