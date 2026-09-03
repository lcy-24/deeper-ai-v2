// ============================================================
// OpenAI 兼容适配器（覆盖 13+ 国产模型）
// ============================================================

import OpenAI from 'openai';
import type { AIModelAdapter, ChatChunk, ChatOptions, ChatResponse, Message, ModelMeta, TransportConfig } from '@/types';

export function createOpenAICompatibleAdapter(meta: ModelMeta, transport: TransportConfig): AIModelAdapter {
  const client = new OpenAI({
    apiKey: transport.apiKey || 'placeholder',
    baseURL: transport.endpoint,
    dangerouslyAllowBrowser: true,
    defaultHeaders: transport.headers,
  });

  return {
    modelId: meta.id,
    capabilities: meta.capabilities,

    async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
      const msgs = buildMessages(messages, options);
      const resp = await client.chat.completions.create({
        model: meta.modelName,
        messages: msgs as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      });

      return {
        id: resp.id,
        content: resp.choices[0]?.message?.content || '',
        model: resp.model,
        usage: resp.usage ? {
          promptTokens: resp.usage.prompt_tokens,
          completionTokens: resp.usage.completion_tokens,
          totalTokens: resp.usage.total_tokens,
        } : undefined,
      };
    },

    async *chatStream(messages: Message[], options?: ChatOptions): AsyncIterable<ChatChunk> {
      const msgs = buildMessages(messages, options);
      const stream = await client.chat.completions.create({
        model: meta.modelName,
        messages: msgs as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          yield { content: delta, done: false };
        }
      }
      yield { content: '', done: true };
    },
  };
}

function buildMessages(messages: Message[], options?: ChatOptions): Array<{ role: string; content: string }> {
  const result: Array<{ role: string; content: string }> = [];

  if (options?.systemPrompt) {
    result.push({ role: 'system', content: options.systemPrompt });
  }

  for (const msg of messages) {
    result.push({ role: msg.role, content: msg.content });
  }

  return result;
}