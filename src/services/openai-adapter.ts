// ============================================================
// OpenAI 适配器
// ============================================================

import OpenAI from 'openai';
import type { AIModelAdapter, ChatChunk, ChatOptions, ChatResponse, Message, ModelMeta, TransportConfig } from '@/types';

export function createOpenAIAdapter(meta: ModelMeta, transport: TransportConfig): AIModelAdapter {
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
        top_p: options?.topP ?? 1,
        max_tokens: options?.maxTokens ?? 4096,
      });

      const choice = resp.choices[0];
      return {
        id: resp.id,
        content: choice.message?.content || '',
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
        top_p: options?.topP ?? 1,
        max_tokens: options?.maxTokens ?? 4096,
        stream: true,
      });

      let fullContent = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        fullContent += delta;
        yield {
          content: delta,
          done: chunk.choices[0]?.finish_reason !== null ? false : false,
        };
      }
      yield { content: '', done: true };
    },
  };
}

function buildMessages(messages: Message[], options?: ChatOptions): Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> {
  const result: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [];

  if (options?.systemPrompt) {
    result.push({ role: 'system', content: options.systemPrompt });
  }

  for (const msg of messages) {
    if (msg.images?.length) {
      const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: 'text', text: msg.content },
      ];
      for (const img of msg.images) {
        parts.push({ type: 'image_url', image_url: { url: img } });
      }
      result.push({ role: msg.role, content: parts });
    } else {
      result.push({ role: msg.role, content: msg.content });
    }
  }

  return result;
}