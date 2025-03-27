import {
  createTestClient,
  type HanzoCoreTestClient,
  type HanzoCoreTestClientMocks,
} from "./test-utils/HanzoCoreTestClient";

describe("Hanzo Core", () => {
  let hanzo: HanzoCoreTestClient;
  let mocks: HanzoCoreTestClientMocks;

  jest.useFakeTimers();

  beforeEach(() => {
    delete process.env.LANGFUSE_RELEASE;
    [hanzo, mocks] = createTestClient({
      publicKey: "pk-lf-111",
      secretKey: "sk-lf-111",
      flushAt: 1,
    });
  });

  describe("Headers", () => {
    it("should create a trace", async () => {
      hanzo.trace({
        name: "test-trace",
      });
      await jest.advanceTimersByTimeAsync(1);

      expect(mocks.fetch).toHaveBeenCalledTimes(1);
      // check headers
      const options = mocks.fetch.mock.calls[0][1];
      expect(options.method).toBe("POST");
      expect(options.headers).toMatchObject({
        "Content-Type": "application/json",
        "X-Hanzo-Sdk-Name": "trace-js",
        "X-Hanzo-Sdk-Version": hanzo.getLibraryVersion(),
        "X-Hanzo-Sdk-Variant": hanzo.getLibraryId(),
        "X-Hanzo-Sdk-Integration": hanzo.getSdkIntegration(),
      });
    });
  });
});
