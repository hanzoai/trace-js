import { waitForPromises } from "./test-utils/test-utils";
import {
  createTestClient,
  type HanzoCoreTestClient,
  type HanzoCoreTestClientMocks,
} from "./test-utils/HanzoCoreTestClient";

describe("Hanzo Core", () => {
  let hanzo: HanzoCoreTestClient;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mocks: HanzoCoreTestClientMocks;

  jest.useFakeTimers();
  jest.setSystemTime(new Date("2022-01-01"));

  beforeEach(() => {
    [hanzo, mocks] = createTestClient({
      publicKey: "pk-lf-111",
      secretKey: "sk-lf-111",
      flushAt: 1,
    });
  });

  describe("on", () => {
    it("should listen to various events", async () => {
      const mock = jest.fn();
      const mockOther = jest.fn();
      const mockOther2 = jest.fn();
      hanzo.on("trace-create", mock);
      hanzo.on("trace-create", mockOther);
      hanzo.on("somethingElse", mockOther2);

      hanzo.trace({ name: "test-trace" });
      await jest.advanceTimersByTimeAsync(1);
      expect(mock).toHaveBeenCalledTimes(1);
      expect(mockOther).toHaveBeenCalledTimes(1);
      expect(mockOther2).toHaveBeenCalledTimes(0);
      expect(mock.mock.lastCall[0]).toMatchObject({ name: "test-trace" });
    });

    it("should unsubscribe when called", async () => {
      const mock = jest.fn();
      const unsubscribe = hanzo.on("trace-create", mock);

      hanzo.trace({ name: "test-trace1" });
      await jest.advanceTimersByTimeAsync(1);
      expect(mock).toHaveBeenCalledTimes(1);
      hanzo.trace({ name: "test-trace2" });
      await jest.advanceTimersByTimeAsync(1);
      expect(mock).toHaveBeenCalledTimes(2);
      unsubscribe();
      hanzo.trace({ name: "test-trace3" });
      await jest.advanceTimersByTimeAsync(1);
      expect(mock).toHaveBeenCalledTimes(2);
    });

    it("should subscribe to flush events", async () => {
      const mock = jest.fn();
      hanzo.on("flush", mock);
      hanzo.trace({ name: "test-trace" });
      expect(mock).toHaveBeenCalledTimes(0);
      jest.runOnlyPendingTimers();
      await waitForPromises();
      expect(mock).toHaveBeenCalledTimes(1);
    });
  });
});
