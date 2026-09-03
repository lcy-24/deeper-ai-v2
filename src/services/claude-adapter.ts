// ============================================================
// Claude (Anthropic) 适配器
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import type { AIModelAdapter, ChatChunk, ChatOptions, ChatResponse, Message, ModelMeta, TransportConfig } from '@/types';

export function createClaudeAdapter(meta: ModelMeta, transport: TransportConfig): AIModelAdapter {
  const client = new Anthropic({
    apiKey: transport.apiKey || 'placeholder',
    baseURL: transport.endpoint.replace(/\/v1$/, ''),
    defaultHeaders: transport.headers,
  });

  return {
    modelId: meta.id,
    capabilities: meta.capabilities,

    async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
      const systemPrompt = extractSystemPrompt(messages, options);
      const userMessages = convertMessages(messages);

      const resp = await client.messages.create({
        model: meta.modelName,
        max_tokens: options?.maxTokens ?? 4096,
        system: systemPrompt,
        messages: userMessages,
      });

      const textBlock = resp.content.find((b) => b.type === 'text');
      return {
        id: resp.id,
        content: textBlock && 'text' in textBlock ? textBlock.text : '',
        model: resp.model,
        usage: {
          promptTokens: resp.usage.input_tokens,
          completionTokens: resp.usage.output_tokens,
          totalTokens: resp.usage.input_tokens + resp.usage.output_tokens,
        },
      };
    },

    async *chatStream(messages: Message[], options?: ChatOptions): AsyncIterable<ChatChunk> {
      const systemPrompt = extractSystemPrompt(messages, options);
      const userMessages = convertMessages(messages);

      const stream = await client.messages.create({
        model: meta.modelName,
        max_tokens: options?.maxTokens ?? 4096,
        system: systemPrompt,
        messages: userMessages,
        stream: true,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield { content: event.delta.text, done: false };
        }
      }
      yield { content: '', done: true };
    },
  };
}

function extractSystemPrompt(messages: Message[], options?: ChatOptions): string {
  const systemMsg = messages.find((m) => m.role === 'system');
  return systemMsg?.content || options?.systemPrompt || '';
}

function convertMessages(messages: Message[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
}