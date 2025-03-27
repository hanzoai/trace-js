import {
  createTestClient,
  type HanzoCoreTestClient,
  type HanzoCoreTestClientMocks,
} from "./test-utils/HanzoCoreTestClient";

describe("Hanzo Core", () => {
  let hanzo: HanzoCoreTestClient;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mocks: HanzoCoreTestClientMocks;

  beforeEach(() => {
    [hanzo, mocks] = createTestClient({
      publicKey: "pk-lf-111",
      secretKey: "sk-lf-111",
      flushAt: 1,
    });
  });

  describe("debug", () => {
    it("should log emitted events when enabled", async () => {
      const spy = jest.spyOn(console, "log");

      hanzo.trace({ name: "test-trace1" });
      expect(spy).toHaveBeenCalledTimes(0);

      hanzo.debug();
      hanzo.trace({ name: "test-trace2" });
      await jest.advanceTimersByTimeAsync(1);
      expect(spy).toHaveBeenCalledTimes(4);
      expect(spy).toHaveBeenCalledWith("[Hanzo Debug]", "trace-create", expect.stringContaining("test-trace2"));
      expect(spy).toHaveBeenCalledWith("[Hanzo Debug]", "flush", expect.stringContaining("test-trace2"));

      spy.mockReset();
      hanzo.debug(false);
      hanzo.trace({ name: "test-trace3" });
      await jest.advanceTimersByTimeAsync(1);

      expect(spy).toHaveBeenCalledTimes(0);
    });
  });
});
