import { ChatPromptTemplate } from "@langchain/core/prompts";

import { type GetHanzoPromptResponse } from "../src";
import { DEFAULT_PROMPT_CACHE_TTL_SECONDS } from "../src/prompts/promptCache";
import { ChatPromptClient, TextPromptClient } from "../src/prompts/promptClients";
import {
  createTestClient,
  type HanzoCoreTestClient,
  type HanzoCoreTestClientMocks,
} from "./test-utils/HanzoCoreTestClient";
import { parseBody } from "./test-utils/test-utils";

describe("Hanzo Core", () => {
  let hanzo: HanzoCoreTestClient;
  let mocks: HanzoCoreTestClientMocks;

  const getPromptStatelessSuccess = {
    fetchResult: "success" as const,
    data: {
      name: "test-prompt",
      prompt: "This is a prompt with a {{variable}}",
      type: "text",
      version: 1,
      config: {
        temperature: 0.5,
      },
      labels: ["production"] as string[],
      tags: ["tag1", "tag2"] as string[],
    } as const,
  };

  // Currently the fetch API doesn't throw on client or server errors, but resolves with a response object
  const getPromptStatelessFailure: GetHanzoPromptResponse = {
    fetchResult: "failure",
    data: {
      message: "Prompt not found",
    },
  };

  beforeEach(() => {
    jest.useFakeTimers();
    delete process.env.LANGFUSE_RELEASE;
    [hanzo, mocks] = createTestClient({
      publicKey: "pk-lf-111",
      secretKey: "sk-lf-111",
      flushAt: 1,
    });

    jest.setSystemTime(new Date("2022-01-01"));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("prompts", () => {
    it("should create a prompt", async () => {
      await hanzo.createPrompt({
        name: "test-prompt",
        prompt: "This is a prompt with a {{variable}}",
        labels: ["production"],
        config: {
          temperature: 0.5,
        },
      });

      expect(mocks.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = mocks.fetch.mock.calls[0];
      expect(url).toMatch(/^https:\/\/cloud\.hanzo\.ai\/api\/public\/v2\/prompts/);
      expect(options.method).toBe("POST");
      const body = parseBody(mocks.fetch.mock.calls[0]);

      expect(body).toMatchObject({
        prompt: "This is a prompt with a {{variable}}",
        name: "test-prompt",
        type: "text",
        config: { temperature: 0.5 },
        labels: ["production"],
      });
    });

    it("should create a prompt with isActive for backward compat", async () => {
      await hanzo.createPrompt({
        name: "test-prompt",
        prompt: "This is a prompt with a {{variable}}",
        isActive: true,
        config: {
          temperature: 0.5,
        },
      });

      expect(mocks.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = mocks.fetch.mock.calls[0];
      expect(url).toMatch(/^https:\/\/cloud\.hanzo\.ai\/api\/public\/v2\/prompts/);
      expect(options.method).toBe("POST");
      const body = parseBody(mocks.fetch.mock.calls[0]);

      expect(body).toMatchObject({
        prompt: "This is a prompt with a {{variable}}",
        name: "test-prompt",
        type: "text",
        config: { temperature: 0.5 },
        labels: ["production"],
      });
    });

    it("should create a chat prompt", async () => {
      await hanzo.createPrompt({
        name: "test-prompt",
        type: "chat",
        prompt: [{ role: "system", content: "This is a prompt with a {{variable}}" }],
        isActive: true,
        config: {
          temperature: 0.5,
        },
      });

      expect(mocks.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = mocks.fetch.mock.calls[0];
      expect(url).toMatch(/^https:\/\/cloud\.hanzo\.ai\/api\/public\/v2\/prompts/);
      expect(options.method).toBe("POST");
      const body = parseBody(mocks.fetch.mock.calls[0]);

      expect(body).toMatchObject({
        isActive: true,
        prompt: [{ role: "system", content: "This is a prompt with a {{variable}}" }],
        name: "test-prompt",
        type: "chat",
        config: { temperature: 0.5 },
        labels: ["production"],
      });
    });

    it("should create prompt with tags", async () => {
      await hanzo.createPrompt({
        name: "test-prompt",
        prompt: "This is a prompt with a {{variable}}",
        tags: ["tag1", "tag2"],
      });

      expect(mocks.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = mocks.fetch.mock.calls[0];
      expect(url).toMatch(/^https:\/\/cloud\.hanzo\.ai\/api\/public\/v2\/prompts/);
      expect(options.method).toBe("POST");
      const body = parseBody(mocks.fetch.mock.calls[0]);

      expect(body).toMatchObject({
        name: "test-prompt",
        type: "text",
        tags: ["tag1", "tag2"],
      });
    });

    it("should get a prompt name only", async () => {
      hanzo.getPromptStateless("test-prompt");

      expect(mocks.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = mocks.fetch.mock.calls[0];
      expect(url).toEqual("https://cloud.hanzo.ai/api/public/v2/prompts/test-prompt");
      expect(options.method).toBe("GET");
    });

    it("should get a prompt with name and version", async () => {
      hanzo.getPromptStateless("test-prompt", 2);

      expect(mocks.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = mocks.fetch.mock.calls[0];
      expect(url).toEqual("https://cloud.hanzo.ai/api/public/v2/prompts/test-prompt?version=2");
      expect(options.method).toBe("GET");
    });
    it("should retry if custom request timeout is exceeded", async () => {
      jest.useRealTimers();

      const fetch = jest.spyOn(hanzo, "fetch").mockImplementation(async (url, options) => {
        expect(options.signal).toBeInstanceOf(AbortSignal);
        expect(options.signal?.aborted).toBe(false);

        return new Promise((resolve, reject) => {
          const startTime = Date.now();
          options.signal?.addEventListener("abort", () => {
            const elapsedTime = Date.now() - startTime;
            console.log("Request aborted after", elapsedTime, "ms");
            expect(elapsedTime).toBeGreaterThanOrEqual(250);
            expect(elapsedTime).toBeLessThan(450); // Allow some buffer for timing variations
            reject(new Error("AbortError: Request aborted"));
          });

          // Simulate a fetch delay
          const timeout = setTimeout(() => {
            resolve({
              status: 200,
              json: async () => ({ status: "200" }),
              text: async () => "ok",
              arrayBuffer: async () => new Uint8Array(),
            });
          }, 1000);

          // Clean up the timeout if aborted
          options.signal?.addEventListener("abort", () => {
            clearTimeout(timeout);
          });
        });
      });

      await expect(
        hanzo.getPrompt("test-prompt", undefined, { fetchTimeoutMs: 300, maxRetries: 2 })
      ).rejects.toThrow("Network error while fetching Hanzo");
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it("should fetch and cache a prompt when not in cache", async () => {
      const mockGetPromptStateless = jest
        .spyOn(hanzo, "getPromptStateless")
        .mockResolvedValueOnce(getPromptStatelessSuccess);
      const result = await hanzo.getPrompt("test-prompt");

      expect(mockGetPromptStateless).toHaveBeenCalledTimes(1);
      expect(result).toEqual(new TextPromptClient(getPromptStatelessSuccess.data));
    });

    it("should throw an error if nothing in cache and fetch fails", async () => {
      const mockGetPromptStateless = jest
        .spyOn(hanzo, "getPromptStateless")
        .mockResolvedValueOnce(getPromptStatelessFailure);

      expect(async () => await hanzo.getPrompt("test-prompt")).rejects.toThrow();
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(1);
    });

    it("should return cached prompt if not expired", async () => {
      const mockGetPromptStateless = jest
        .spyOn(hanzo, "getPromptStateless")
        .mockResolvedValueOnce(getPromptStatelessSuccess);

      await hanzo.getPrompt("test-prompt");
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(1);

      const result = await hanzo.getPrompt("test-prompt");
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(1);

      expect(result).toEqual(new TextPromptClient(getPromptStatelessSuccess.data));
    });

    it("should return cached prompt if not expired according to custom TTL", async () => {
      const cacheTtlSeconds = Math.max(DEFAULT_PROMPT_CACHE_TTL_SECONDS - 20, 10);
      const mockGetPromptStateless = jest
        .spyOn(hanzo, "getPromptStateless")
        .mockResolvedValue(getPromptStatelessSuccess);

      await hanzo.getPrompt("test-prompt", undefined, { cacheTtlSeconds });
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(cacheTtlSeconds * 1000 - 1);

      const cachedResult = await hanzo.getPrompt("test-prompt", undefined, { cacheTtlSeconds });
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(1); // Should not refetch
      expect(cachedResult).toEqual(new TextPromptClient(getPromptStatelessSuccess.data));
    });

    it("should always fetch latest version of prompt if cacheTtlSeconds is 0", async () => {
      const mockGetPromptStateless = jest
        .spyOn(hanzo, "getPromptStateless")
        .mockResolvedValueOnce(getPromptStatelessSuccess);

      // First call to getPrompt
      const result1 = await hanzo.getPrompt("test-prompt", undefined, { cacheTtlSeconds: 0 });
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(new TextPromptClient(getPromptStatelessSuccess.data));

      // Mock a change in the prompt
      const updatedPrompt = {
        ...getPromptStatelessSuccess,
        data: {
          ...getPromptStatelessSuccess.data,
          version: getPromptStatelessSuccess.data.version + 1,
          prompt: "This is an updated prompt with a {{variable}}",
        },
      };
      mockGetPromptStateless.mockResolvedValueOnce(updatedPrompt);

      // Second call to getPrompt
      const result2 = await hanzo.getPrompt("test-prompt", undefined, { cacheTtlSeconds: 0 });
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(2);
      expect(result2).toEqual(new TextPromptClient(updatedPrompt.data));

      // Verify that the prompt has been updated
      expect(result2.version).toBe(result1.version + 1);
      expect(result2.prompt).not.toBe(result1.prompt);

      // Mock another change in the prompt for the third call
      const furtherUpdatedPrompt = {
        ...updatedPrompt,
        data: {
          ...updatedPrompt.data,
          version: 3,
          prompt: "This is a further updated prompt with a {{variable}}",
        },
      };
      mockGetPromptStateless.mockResolvedValueOnce(furtherUpdatedPrompt);

      // Third call to getPrompt
      const result3 = await hanzo.getPrompt("test-prompt", undefined, { cacheTtlSeconds: 0 });
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(3);
      expect(result3).toEqual(new TextPromptClient(furtherUpdatedPrompt.data));

      // Verify that the prompt has been updated to version 3
      expect(result3.version).toBe(3);
      expect(result3.prompt).toBe("This is a further updated prompt with a {{variable}}");
      expect(result3.version).toBeGreaterThan(result2.version);
      expect(result3.prompt).not.toBe(result2.prompt);
    });

    it("should return stale prompt immediately if cached one is expired according to default TTL and add to refresh promise map", async () => {
      const mockGetPromptStateless = jest
        .spyOn(hanzo, "getPromptStateless")
        .mockResolvedValue(getPromptStatelessSuccess);

      const result = await hanzo.getPrompt("test-prompt", undefined);

      // update the version of the returned mocked prompt
      const updatedPrompt = {
        ...getPromptStatelessSuccess,
        data: {
          ...getPromptStatelessSuccess.data,
          version: getPromptStatelessSuccess.data.version + 1,
        },
      };
      mockGetPromptStateless.mockResolvedValue(updatedPrompt);

      expect(mockGetPromptStateless).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(DEFAULT_PROMPT_CACHE_TTL_SECONDS * 1000 + 1);

      // Accessing private methods using a workaround
      const cacheKey = hanzo["_getPromptCacheKey"]({ name: "test-prompt" });

      const staleResult = await hanzo.getPrompt("test-prompt", undefined);
      expect(hanzo["_promptCache"].isRefreshing(cacheKey)).toBe(true);

      // create more stale requests to check that only one refresh is triggered
      await hanzo.getPrompt("test-prompt", undefined);
      await hanzo.getPrompt("test-prompt", undefined);
      await hanzo.getPrompt("test-prompt", undefined);
      await hanzo.getPrompt("test-prompt", undefined);

      expect(staleResult.version).toBe(result.version);
      expect(staleResult).toEqual(new TextPromptClient(getPromptStatelessSuccess.data));

      // wait for the refresh to complete
      await hanzo["_promptCache"]["_refreshingKeys"].get(cacheKey);
      expect(hanzo["_promptCache"].isRefreshing(cacheKey)).toBe(false);

      // check that the prompt has been updated
      const updatedResult = await hanzo.getPrompt("test-prompt", undefined);
      expect(updatedResult.version).toBe(result.version + 1);

      // Should only have refetched once despite multiple calls
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(2);

      // final check for returned prompt
      expect(updatedResult).toEqual(new TextPromptClient(updatedPrompt.data));
    });

    it("should return expired prompt if refetch fails", async () => {
      const cacheTtlSeconds = Math.max(DEFAULT_PROMPT_CACHE_TTL_SECONDS - 20, 10);
      const mockGetPromptStateless = jest
        .spyOn(hanzo, "getPromptStateless")
        .mockResolvedValueOnce(getPromptStatelessSuccess);

      await hanzo.getPrompt("test-prompt", undefined, { cacheTtlSeconds });
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(cacheTtlSeconds * 1000 + 1);

      mockGetPromptStateless.mockResolvedValueOnce(getPromptStatelessFailure);
      const result = await hanzo.getPrompt("test-prompt", undefined, { cacheTtlSeconds });
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(2);

      expect(result).toEqual(new TextPromptClient(getPromptStatelessSuccess.data));
    });

    it("should return expired prompt if refetch fails", async () => {
      const cacheTtlSeconds = Math.max(DEFAULT_PROMPT_CACHE_TTL_SECONDS - 20, 10);
      const mockGetPromptStateless = jest
        .spyOn(hanzo, "getPromptStateless")
        .mockResolvedValueOnce(getPromptStatelessSuccess);

      await hanzo.getPrompt("test-prompt", undefined, { cacheTtlSeconds });
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(cacheTtlSeconds * 1000 + 1);

      mockGetPromptStateless.mockResolvedValueOnce(getPromptStatelessFailure);
      const result = await hanzo.getPrompt("test-prompt", undefined, { cacheTtlSeconds });
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(2);

      expect(result).toEqual(new TextPromptClient(getPromptStatelessSuccess.data));
    });

    it("should fetch new prompt if version changes", async () => {
      const newPromptVersion = getPromptStatelessSuccess.data.version - 1;
      const versionChangedPrompt = {
        ...getPromptStatelessSuccess,
        data: {
          ...getPromptStatelessSuccess.data,
          version: getPromptStatelessSuccess.data.version - 1,
        },
      };
      const mockGetPromptStateless = jest
        .spyOn(hanzo, "getPromptStateless")
        .mockResolvedValueOnce(getPromptStatelessSuccess);

      await hanzo.getPrompt("test-prompt", undefined);
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(1);

      mockGetPromptStateless.mockResolvedValue(versionChangedPrompt);
      const result1 = await hanzo.getPrompt("test-prompt", newPromptVersion);
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(2);

      expect(result1).toEqual(new TextPromptClient(versionChangedPrompt.data));

      // Return cached value on subsequent calls
      mockGetPromptStateless.mockResolvedValue(versionChangedPrompt);
      const result2 = await hanzo.getPrompt("test-prompt", newPromptVersion);
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(2);

      expect(result2).toEqual(new TextPromptClient(versionChangedPrompt.data));

      // Refetch if cache has expired
      jest.advanceTimersByTime(DEFAULT_PROMPT_CACHE_TTL_SECONDS * 1000 + 1);
      mockGetPromptStateless.mockResolvedValue(versionChangedPrompt);
      const result3 = await hanzo.getPrompt("test-prompt", newPromptVersion);
      expect(mockGetPromptStateless).toHaveBeenCalledTimes(3);

      expect(result3).toEqual(new TextPromptClient(versionChangedPrompt.data));
    });

    it("should correctly get langchain prompt format", async () => {
      const testPrompts = [
        {
          prompt: "This is a {{test}}",
          values: { test: "test" },
          expected: "Human: This is a test",
        }, // test simple input argument
        {
          prompt: "This is a {{test}}. And this is a {{test}}",
          values: { test: "test", test2: "test2" },
          expected: "Human: This is a test. And this is a test",
        }, // test single input arguments multiple times
        {
          prompt: "This is a {{test}}. And this is a {{test2}}",
          values: { test: "test", test2: "test2" },
          expected: "Human: This is a test. And this is a test2",
        }, // test multiple input arguments
        {
          prompt: "This is a test. And this is a test",
          values: { test: "test", test2: "test2" },
          expected: "Human: This is a test. And this is a test",
        }, // test no arguments
      ];

      for (let i = 0; i < testPrompts.length; i++) {
        const testPrompt = testPrompts[i].prompt;
        const values = testPrompts[i].values;
        const expected = testPrompts[i].expected;

        // Create a new prompt
        const hanzoPrompt = new TextPromptClient({
          name: `test_${i}`,
          version: 1,
          prompt: testPrompt,
          type: "text",
          config: {
            model: "gpt-3.5-turbo-1106",
            temperature: 0,
          },
          labels: [],
          tags: [],
        });

        // Convert to Langchain prompt
        const langchainPrompt = ChatPromptTemplate.fromTemplate(hanzoPrompt.getLangchainPrompt());

        // Assertions
        const message = await langchainPrompt.format(values);
        expect(message).toBe(expected);
      }
    });
    it("should correctly get langchain prompt format for chats", async () => {
      const testPrompts = [
        {
          prompt: [{ role: "system", content: "This is a {{test}}" }],
          values: { test: "test" },
          expected: "System: This is a test",
        }, // test system role
        {
          prompt: [{ role: "assistant", content: "This is a {{test}}" }],
          values: { test: "test" },
          expected: "AI: This is a test",
        }, // test assistant role
        {
          prompt: [{ role: "user", content: "This is a {{test}}" }],
          values: { test: "test" },
          expected: "Human: This is a test",
        }, // test simple input argument
        {
          prompt: [{ role: "user", content: "This is a {{test}}. And this is a {{test}}" }],
          values: { test: "test", test2: "test2" },
          expected: "Human: This is a test. And this is a test",
        }, // test single input arguments multiple times
        {
          prompt: [{ role: "user", content: "This is a {{test}}. And this is a {{test2}}" }],
          values: { test: "test", test2: "test2" },
          expected: "Human: This is a test. And this is a test2",
        }, // test multiple input arguments
        {
          prompt: [{ role: "user", content: "This is a test. And this is a test" }],
          values: { test: "test", test2: "test2" },
          expected: "Human: This is a test. And this is a test",
        }, // test no arguments
      ];

      for (let i = 0; i < testPrompts.length; i++) {
        const testPrompt = testPrompts[i].prompt;
        const values = testPrompts[i].values;
        const expected = testPrompts[i].expected;

        // Create a new prompt
        const hanzoPrompt = new ChatPromptClient({
          name: `test_${i}`,
          version: 1,
          prompt: testPrompt,
          type: "chat",
          config: {
            model: "gpt-3.5-turbo-1106",
            temperature: 0,
          },
          labels: [],
          tags: [],
        });

        // Convert to Langchain prompt
        const langchainPrompt = ChatPromptTemplate.fromMessages(
          hanzoPrompt.getLangchainPrompt().map((m) => [m.role, m.content])
        );

        // Assertions
        const message = await langchainPrompt.format(values);
        expect(message).toBe(expected);
      }
    });

    it("should not HTML escape characters in prompt compile inputs", async () => {
      const promptClient = new TextPromptClient({
        name: "test",
        type: "text",
        version: 1,
        prompt: "This is a prompt with {{someJson}}",
        config: {
          model: "gpt-3.5-turbo-1106",
          temperature: 0,
        },
        labels: [],
        tags: [],
      });

      const prompt = promptClient.compile({ someJson: JSON.stringify({ foo: "bar" }) });
      expect(prompt).toBe('This is a prompt with {"foo":"bar"}');
    });

    it("should not HTML escape characters in chat prompt compile inputs", async () => {
      const promptClient = new ChatPromptClient({
        name: "test",
        type: "chat",
        version: 1,
        prompt: [{ role: "system", content: "This is a prompt with {{someJson}}" }],
        config: {
          model: "gpt-3.5-turbo-1106",
          temperature: 0,
        },
        labels: [],
        tags: [],
      });

      const prompt = promptClient.compile({ someJson: JSON.stringify({ foo: "bar" }) });
      expect(prompt).toEqual([{ role: "system", content: 'This is a prompt with {"foo":"bar"}' }]);
    });
  });
});
