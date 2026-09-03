// ============================================================
// 聊天服务 — 核心对话逻辑
// ============================================================

import type { ChatChunk, ChatOptions, Message } from '@/types';
import { modelFactory } from './model-factory';
import { withRetry } from './retry-middleware';

export interface ChatCallbacks {
  onChunk: (chunk: ChatChunk) => void;
  onError: (error: Error) => void;
  onDone: (fullContent: string) => void;
}

/** 发送流式聊天 */
export async function sendChatStream(
  modelId: string,
  messages: Message[],
  options: ChatOptions,
  callbacks: ChatCallbacks,
  abortSignal?: AbortSignal,
): Promise<void> {
  const adapter = modelFactory.getAdapter(modelId);

  try {
    const stream = await withRetry(
      `chat-${modelId}`,
      () => Promise.resolve(adapter.chatStream(messages, options)),
    );

    let fullContent = '';
    for await (const chunk of stream) {
      if (abortSignal?.aborted) break;
      fullContent += chunk.content;
      callbacks.onChunk(chunk);
      if (chunk.done) {
        callbacks.onDone(fullContent);
        return;
      }
    }
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  }
}

/** 发送非流式聊天 */
export async function sendChat(
  modelId: string,
  messages: Message[],
  options: ChatOptions,
): Promise<string> {
  const adapter = modelFactory.getAdapter(modelId);
  const response = await withRetry(`chat-${modelId}`, () =>
    adapter.chat(messages, options),
  );
  return response.content;
}

/** 比较两个模型的回答 */
export async function compareModels(
  modelIdA: string,
  modelIdB: string,
  messages: Message[],
  options: ChatOptions,
): Promise<{ modelA: string; modelB: string }> {
  const [a, b] = await Promise.all([
    sendChat(modelIdA, messages, options),
    sendChat(modelIdB, messages, options),
  ]);
  return { modelA: a, modelB: b };
}