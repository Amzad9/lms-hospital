/**
 * @file openai.config.ts
 *
 * NestJS ConfigModule factory for all OpenAI / AI-layer settings.
 * Loaded via ConfigModule.forRoot({ load: [openAiConfig] }) in AiModule.
 *
 * All values are read from environment variables so nothing sensitive
 * is ever hard-coded.  Provide sensible defaults where safe to do so.
 */
export interface OpenAiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  maxIterations: number;
}

/**
 * Factory function consumed by NestJS ConfigModule.
 * Keys are namespaced under 'openai' to prevent collisions.
 *
 * @example
 *  configService.get<string>('openai.model')
 */
export default (): { openai: OpenAiConfig } => ({
  openai: {
    /** OpenAI secret key — must be set in .env */
    apiKey: process.env.OPENAI_API_KEY ?? '',

    /**
     * Model to use for the planner (reasoning) calls.
     * gpt-4o gives the best tool-calling accuracy.
     * Can be overridden to 'gpt-4o-mini' for cost savings.
     */
    model: process.env.OPENAI_MODEL ?? 'gpt-4o',

    /**
     * Lower temperature → more deterministic tool-call decisions.
     * Keep at 0 for agentic / structured-output use-cases.
     */
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE ?? '0'),

    /**
     * Maximum tokens in the model's response per planner turn.
     * 1024 is sufficient for tool-selection reasoning.
     */
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS ?? '1024', 10),

    /**
     * Hard cap on planner ↔ executor cycles per user request.
     * Prevents infinite loops when tools keep returning errors.
     */
    maxIterations: parseInt(process.env.AGENT_MAX_ITERATIONS ?? '10', 10),
  },
});
