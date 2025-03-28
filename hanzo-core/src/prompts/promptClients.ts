import mustache from "mustache";

import type { ChatMessage, ChatPrompt, CreateHanzoPromptResponse, TextPrompt } from "../types";

mustache.escape = function (text) {
  return text;
};

abstract class BasePromptClient {
  public readonly name: string;
  public readonly version: number;
  public readonly config: unknown;
  public readonly labels: string[];
  public readonly tags: string[];
  public readonly isFallback: boolean;
  public readonly type: "text" | "chat";
  public readonly prompt: string | ChatMessage[];
  public readonly commitMessage: string | null | undefined;

  constructor(prompt: CreateHanzoPromptResponse, isFallback = false, type: "text" | "chat") {
    this.name = prompt.name;
    this.version = prompt.version;
    this.config = prompt.config;
    this.labels = prompt.labels;
    this.tags = prompt.tags;
    this.isFallback = isFallback;
    this.type = type;
    this.prompt = prompt.prompt;
    this.commitMessage = prompt.commitMessage;
  }

  abstract compile(variables?: Record<string, string>): string | ChatMessage[];

  public abstract getLangchainPrompt(): string | ChatMessage[];

  protected _transformToLangchainVariables(content: string): string {
    return content.replace(/\{\{(.*?)\}\}/g, "{$1}");
  }

  public toJSON(): string {
    return JSON.stringify({
      name: this.name,
      prompt: this.prompt,
      version: this.version,
      isFallback: this.isFallback,
      tags: this.tags,
      labels: this.labels,
      type: this.type,
      config: this.config,
    });
  }
}

export class TextPromptClient extends BasePromptClient {
  public readonly promptResponse: TextPrompt;
  public readonly prompt: string;

  constructor(prompt: TextPrompt, isFallback = false) {
    super(prompt, isFallback, "text");
    this.promptResponse = prompt;
    this.prompt = prompt.prompt;
  }

  compile(variables?: Record<string, string>): string {
    return mustache.render(this.promptResponse.prompt, variables ?? {});
  }

  public getLangchainPrompt(): string {
    /**
     * Converts Hanzo prompt into string compatible with Langchain PromptTemplate.
     *
     * It specifically adapts the mustache-style double curly braces {{variable}} used in Hanzo
     * to the single curly brace {variable} format expected by Langchain.
     *
     * @returns {string} The string that can be plugged into Langchain's PromptTemplate.
     */
    return this._transformToLangchainVariables(this.prompt);
  }
}

export class ChatPromptClient extends BasePromptClient {
  public readonly promptResponse: ChatPrompt;
  public readonly prompt: ChatMessage[];

  constructor(prompt: ChatPrompt, isFallback = false) {
    super(prompt, isFallback, "chat");
    this.promptResponse = prompt;
    this.prompt = prompt.prompt;
  }

  compile(variables?: Record<string, string>): ChatMessage[] {
    return this.prompt.map<ChatMessage>((chatMessage) => ({
      ...chatMessage,
      content: mustache.render(chatMessage.content, variables ?? {}),
    }));
  }

  public getLangchainPrompt(): ChatMessage[] {
    /**
     * Converts Hanzo prompt into string compatible with Langchain PromptTemplate.
     *
     * It specifically adapts the mustache-style double curly braces {{variable}} used in Hanzo
     * to the single curly brace {variable} format expected by Langchain.
     * Example usage:
     *
     * ```
     * import { ChatPromptTemplate } from "@langchain/core/prompts";
     *
     * const langchainChatPrompt = ChatPromptTemplate.fromMessages(
     *    hanzoChatPrompt.getLangchainPrompt().map((m) => [m.role, m.content])
     *  );
     *
     * const formattedPrompt = await langchainPrompt.format(values);
     *
     * ```
     * @returns {ChatMessage[]} Chat messages with variables that can be plugged into Langchain's ChatPromptTemplate.
     */
    return this.prompt.map((chatMessage) => ({
      ...chatMessage,
      content: this._transformToLangchainVariables(chatMessage.content),
    }));
  }
}

export type HanzoPromptClient = TextPromptClient | ChatPromptClient;
