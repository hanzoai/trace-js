// uses the compiled fetch version, run yarn build after making changes to the SDKs
import Hanzo from "../hanzo";
import { CallbackHandler } from "../hanzo-langchain";

import { FakeListChatModel } from "@langchain/core/utils/testing";

import { LANGFUSE_BASEURL, LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY } from "./integration-utils";

describe("No errors should be thrown by SDKs", () => {
  jest.useRealTimers();

  // beforeEach(() => {});
  // afterEach(async () => {});

  describe("hanzo-fetch", () => {
    it("incorrect host", async () => {
      global.console.error = jest.fn();
      const hanzo = new Hanzo({
        publicKey: LANGFUSE_PUBLIC_KEY,
        secretKey: LANGFUSE_SECRET_KEY,
        baseUrl: "https://incorrect-host",
        flushAt: 2,
        fetchRetryDelay: 1,
        fetchRetryCount: 2,
      });

      const trace = hanzo.trace({ name: "trace-name" });
      for (let i = 0; i < 10; i++) {
        trace.generation({ name: "generation-name" });
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      await hanzo.shutdownAsync();

      // expect no errors to be thrown (would kill jest) and console.error to be called
      expect(global.console.error).toHaveBeenCalledTimes(1);
    }, 10000);

    it("incorrect keys", async () => {
      global.console.error = jest.fn();
      const hanzo = new Hanzo({
        publicKey: LANGFUSE_PUBLIC_KEY,
        secretKey: "incorrect_key",
        baseUrl: LANGFUSE_BASEURL,
        flushAt: 2,
        fetchRetryDelay: 1,
        fetchRetryCount: 2,
      });

      const trace = hanzo.trace({ name: "trace-name" });
      for (let i = 0; i < 10; i++) {
        trace.generation({ name: "generation-name" });
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      await hanzo.shutdownAsync();

      // expect no errors to be thrown (would kill jest) and console.error to be called
      expect(global.console.error).toHaveBeenCalledTimes(1);
    }, 10000);
  });

  describe("langchain", () => {
    it("incorrect host", async () => {
      global.console.error = jest.fn();
      const fakeListLLM = new FakeListChatModel({
        responses: ["I'll callback later.", "You 'console' them!"],
        sleep: 100,
      });
      const handler = new CallbackHandler({
        publicKey: LANGFUSE_PUBLIC_KEY,
        secretKey: LANGFUSE_SECRET_KEY,
        baseUrl: "https://incorrect-host",
        flushAt: 2,
        fetchRetryDelay: 1,
        fetchRetryCount: 2,
      });

      for (let i = 0; i < 10; i++) {
        fakeListLLM.invoke("Hello world", { callbacks: [handler as any] });
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      await handler.shutdownAsync();

      // expect no errors to be thrown (would kill jest)
      expect(global.console.error).toHaveBeenCalledTimes(0);
    }, 10000);

    it("incorrect keys", async () => {
      global.console.error = jest.fn();
      const fakeListLLM = new FakeListChatModel({
        responses: ["I'll callback later.", "You 'console' them!"],
      });
      const handler = new CallbackHandler({
        publicKey: LANGFUSE_PUBLIC_KEY,
        secretKey: "incorrect_key",
        baseUrl: LANGFUSE_BASEURL,
        flushAt: 2,
        fetchRetryDelay: 1,
        fetchRetryCount: 2,
      });

      for (let i = 0; i < 10; i++) {
        fakeListLLM.invoke("Hello world", { callbacks: [handler as any] }); // TODO fix typing of handler
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      await handler.shutdownAsync();

      // expect no errors to be thrown (would kill jest)
      expect(global.console.error).toHaveBeenCalledTimes(0);
    }, 10000);
  });
});

describe("shutdown async behavior", () => {
  jest.useRealTimers();

  // beforeEach(() => {});
  // afterEach(async () => {});

  it("hanzo - no events after shutdownAync is awaited", async () => {
    const hanzo = new Hanzo({
      publicKey: LANGFUSE_PUBLIC_KEY,
      secretKey: LANGFUSE_SECRET_KEY,
      baseUrl: LANGFUSE_BASEURL,
      flushAt: 2,
      fetchRetryDelay: 1,
      fetchRetryCount: 2,
    });

    // create jest callback which consumes the flush event
    const flushCallback = jest.fn();
    const anyCallback = jest.fn();

    hanzo.on("flush", () => {
      flushCallback();
    });
    hanzo.on("*", () => {
      anyCallback();
    });

    for (let i = 0; i < 101; i++) {
      hanzo.trace({ name: `test-trace-${i}` });
    }

    await hanzo.shutdownAsync();
    expect(flushCallback).toHaveBeenCalledTimes(51);

    const anyCallbackCount = anyCallback.mock.calls.length;

    // expect no events to be emitted after shutdownAsync
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(anyCallback).toHaveBeenCalledTimes(anyCallbackCount);
  });

  it("langchain - no events after shutdownAync is awaited", async () => {
    const fakeListLLM = new FakeListChatModel({
      responses: ["I'll callback later.", "You 'console' them!"],
      sleep: 100,
    });
    const handler = new CallbackHandler({
      publicKey: LANGFUSE_PUBLIC_KEY,
      secretKey: LANGFUSE_SECRET_KEY,
      baseUrl: LANGFUSE_BASEURL,
      flushAt: 3,
      fetchRetryDelay: 1,
      fetchRetryCount: 2,
    });

    // create jest callback which consumes the flush event
    const flushCallback = jest.fn();
    const anyCallback = jest.fn();

    handler.hanzo.on("flush", () => {
      flushCallback();
    });
    handler.hanzo.on("*", () => {
      anyCallback();
    });

    for (let i = 0; i < 11; i++) {
      await fakeListLLM.invoke("Hello world", { callbacks: [handler as any] }); // TODO fix typing of handler
    }

    await handler.shutdownAsync();
    expect(flushCallback).toHaveBeenCalledTimes(8);

    const anyCallbackCount = anyCallback.mock.calls.length;

    // expect no events to be emitted after shutdownAsync
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(anyCallback).toHaveBeenCalledTimes(anyCallbackCount);
  });
});
