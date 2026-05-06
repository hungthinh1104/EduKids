import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RecommendationGeminiApiService {
  private readonly logger = new Logger(RecommendationGeminiApiService.name);

  async generateJson(prompt: string): Promise<unknown | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }

    const baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const endpoint = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const startedAt = Date.now();
    const TIMEOUT_MS = 15_000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        this.logger.warn(
          `Gemini request failed: status=${response.status}, model=${model}, latencyMs=${Date.now() - startedAt}`,
        );
        return null;
      }

      const payload = (await response.json()) as any;
      const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        this.logger.warn(
          `Gemini response missing text: model=${model}, latencyMs=${Date.now() - startedAt}`,
        );
        return null;
      }

      this.logger.debug(
        `Gemini success: model=${model}, latencyMs=${Date.now() - startedAt}, outputChars=${String(text).length}`,
      );

      return text;
    } catch (error) {
      this.logger.warn(
        `Gemini request error: ${(error as Error).message}, model=${model}, latencyMs=${Date.now() - startedAt}`,
      );
      return null;
    }
  }
}
