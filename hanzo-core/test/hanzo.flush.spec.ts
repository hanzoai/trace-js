import {
  createTestClient,
  type HanzoCoreTestClient,
  type HanzoCoreTestClientMocks,
} from "./test-utils/HanzoCoreTestClient";

describe("Hanzo Core", () => {
  let hanzo: HanzoCoreTestClient;
  let mocks: HanzoCoreTestClientMocks;

  describe("flush", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      [hanzo, mocks] = createTestClient({
        publicKey: "pk-lf-111",
        secretKey: "sk-lf-111",
        flushAt: 5,
        fetchRetryCount: 3,
        fetchRetryDelay: 100,
      });
    });

    it("doesn't fail when queue is empty", async () => {
      jest.useRealTimers();
      await expect(hanzo.flushAsync()).resolves.not.toThrow();
    });

    it("flush messsages once called", async () => {
      hanzo.trace({ name: "test-trace-1" });
      hanzo.trace({ name: "test-trace-2" });
      hanzo.trace({ name: "test-trace-3" });
      expect(mocks.fetch).not.toHaveBeenCalled();
      await expect(hanzo.flushAsync()).resolves.toHaveLength(3);
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
    });

    it("responds with an error after retries", async () => {
      hanzo.trace({ name: "test-trace-1" });
      mocks.fetch.mockImplementation(() => {
        return Promise.resolve({
          status: 400,
          text: async () => "err",
          json: async () => ({ status: "err" }),
          arrayBuffer: async () => new Uint8Array(),
        });
      });

      const time = Date.now();
      jest.useRealTimers();
      expect(await hanzo.flushAsync()).toBeUndefined();
      expect(mocks.fetch).toHaveBeenCalledTimes(4);
      expect(Date.now() - time).toBeGreaterThan(300);
      expect(Date.now() - time).toBeLessThan(2000);
    });

    it("resolves without an error after retries 207", async () => {
      const trace = hanzo.trace({ name: "test-trace-1" });
      mocks.fetch.mockImplementation(() => {
        return Promise.resolve({
          status: 207,
          text: async () => "err",
          json: async () => ({ successes: [], errors: [{ id: trace.id, message: "Something failed" }] }),
          arrayBuffer: async () => new Uint8Array(),
        });
      });

      const time = Date.now();
      jest.useRealTimers();
      expect(await hanzo.flushAsync()).toBeUndefined();
      expect(mocks.fetch).toHaveBeenCalledTimes(4);
      expect(Date.now() - time).toBeGreaterThan(300);
      expect(Date.now() - time).toBeLessThan(2000);
    });

    it("responds with an error after retries 207 and then continues after fail", async () => {
      let index = 0;
      // 5 events in one network request which fail
      for (let i = 0; i < 5; i++) {
        hanzo.trace({ name: `test-trace-failing-${i}` });
      }

      // 2 more events which succeed
      for (let i = 0; i < 2; i++) {
        hanzo.trace({ name: `test-trace-succeeding-${i}` });
      }
      await jest.advanceTimersByTimeAsync(1);

      mocks.fetch.mockImplementation(() => {
        if (index < 3) {
          index++;
          return Promise.resolve({
            status: 207,
            text: async () => "err",
            json: async () => ({ successes: [], errors: [{ id: "someId", message: "Something failed" }] }),
            arrayBuffer: async () => new Uint8Array(),
          });
        } else {
          index++;
          return Promise.resolve({
            status: 200,
            text: async () => "ok",
            json: async () => ({ successes: [], errors: [] }),
            arrayBuffer: async () => new Uint8Array(),
          });
        }
      });

      const time = Date.now();
      jest.useRealTimers();
      await hanzo.flushAsync();
      expect(index).toBe(4);
      expect(mocks.fetch).toHaveBeenCalledTimes(5);
      expect(Date.now() - time).toBeGreaterThan(300);
      expect(Date.now() - time).toBeLessThan(2000);
    });

    it("expect number of calls to match the number of items", async () => {
      [hanzo, mocks] = createTestClient({
        publicKey: "pk-lf-111",
        secretKey: "sk-lf-111",
        flushAt: 1,
      });

      hanzo.trace({ name: "test-trace-1" });
      await jest.advanceTimersByTimeAsync(1);
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
      hanzo.trace({ name: "test-trace-2" });
      hanzo.trace({ name: "test-trace-3" });
      hanzo.trace({ name: "test-trace-4" });
      hanzo.trace({ name: "test-trace-5" });
      await jest.advanceTimersByTimeAsync(1);

      expect(mocks.fetch).toHaveBeenCalledTimes(5);
    });

    it("expect number of calls to match the number of items (more scale)", async () => {
      [hanzo, mocks] = createTestClient({
        publicKey: "pk-lf-111",
        secretKey: "sk-lf-111",
        flushInterval: 200,
        flushAt: 5,
      });

      for (let i = 0; i < 20_004; i++) {
        hanzo.trace({ name: `test-trace-${i}` });
      }
      await jest.advanceTimersByTimeAsync(1);

      expect(mocks.fetch).toHaveBeenCalledTimes(4_000);

      // wait for the last flush
      await jest.advanceTimersByTimeAsync(200);

      expect(mocks.fetch).toHaveBeenCalledTimes(4_001);
    });

    it("no flush events after shutdownAync is awaited", async () => {
      jest.useRealTimers();
      [hanzo, mocks] = createTestClient(
        {
          publicKey: "pk-lf-111",
          secretKey: "sk-lf-111",
          flushInterval: 200,
          flushAt: 5,
        },
        ({ fetch }) => {
          fetch.mockImplementation(() => {
            return new Promise((resolve) => {
              // resolve fetch promise after 100ms
              setTimeout(() => {
                resolve({
                  status: 200,
                  text: async () => "ok",
                  json: async () => ({ status: "ok" }),
                  arrayBuffer: async () => new Uint8Array(),
                });
              }, 500); // add delay to simulate network request
            });
          });
        }
      );

      // create jest callback which consumes the flush event
      const flushCallback = jest.fn();
      hanzo.on("flush", () => {
        flushCallback();
      });

      for (let i = 0; i < 20_004; i++) {
        hanzo.trace({ name: `test-trace-${i}` });
      }

      // before flush
      await jest.advanceTimersByTimeAsync(1);
      expect(mocks.fetch).toHaveBeenCalledTimes(4_000);

      // after flush
      await hanzo.shutdownAsync();
      expect(flushCallback).toHaveBeenCalledTimes(4_001);
      expect(mocks.fetch).toHaveBeenCalledTimes(4_001);
    });

    it("no exceptions if fetch timeouts", async () => {
      jest.useRealTimers();
      [hanzo, mocks] = createTestClient(
        {
          publicKey: "pk-lf-111",
          secretKey: "sk-lf-111",
          flushAt: 1,
          requestTimeout: 100,
          fetchRetryDelay: 1,
          fetchRetryCount: 2,
        },
        ({ fetch }) => {
          fetch.mockImplementation(() => {
            throw new Error("unspecified error");
          });
        }
      );

      for (let i = 0; i < 2; i++) {
        hanzo.trace({ name: `test-trace-${i}` });
      }

      // after flush
      await hanzo.shutdownAsync();
      expect(true).toBe(true);
    });

    it("expect number of calls to match when flushing at intervals", async () => {
      [hanzo, mocks] = createTestClient({
        publicKey: "pk-lf-111",
        secretKey: "sk-lf-111",
        flushAt: 5,
        flushInterval: 200,
      });

      hanzo.trace({ name: "test-trace-1" });
      hanzo.trace({ name: "test-trace-2" });
      hanzo.trace({ name: "test-trace-3" });
      expect(mocks.fetch).toHaveBeenCalledTimes(0);

      await jest.advanceTimersByTimeAsync(300);

      expect(mocks.fetch).toHaveBeenCalledTimes(1);
    });

    it("should not send events in admin mode", async () => {
      [hanzo, mocks] = createTestClient({
        publicKey: "pk-lf-111",
        secretKey: "sk-lf-111",
        _projectId: "test-project-id",
        _isLocalEventExportEnabled: true,
        flushAt: 5,
        flushInterval: 200,
      });

      // Create multiple traces
      const traces = ["test-trace-1", "test-trace-2", "test-trace-3"];
      traces.forEach((name) => hanzo.trace({ name }));

      expect(mocks.fetch).not.toHaveBeenCalled();

      await jest.runAllTimersAsync();

      expect(mocks.fetch).not.toHaveBeenCalled();
    });
  });

  describe("when queue is completely full", () => {
    const MAX_MSG_SIZE = 1_000_000;
    const BATCH_SIZE_LIMIT = 2_500_000;
    // Message is right under the message size limit
    const MSG_SIZE = MAX_MSG_SIZE - 1000;
    const BIG_STRING = "a".repeat(MSG_SIZE);

    it("should flush remaining items on subsequent flush", async () => {
      const n = Math.floor(BATCH_SIZE_LIMIT / MSG_SIZE) + 1;

      [hanzo, mocks] = createTestClient({
        publicKey: "pk-lf-111",
        secretKey: "sk-lf-111",
        flushAt: n,
        flushInterval: 200,
      });

      // Adds enough messages to exceed batch size limit
      for (let i = 0; i < n; i++) {
        hanzo.trace({ name: `test-trace-${i}`, input: { content: BIG_STRING } });
      }

      await jest.advanceTimersByTimeAsync(200);
      expect(mocks.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
