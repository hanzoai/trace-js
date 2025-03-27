/**
 * @jest-environment jsdom
 */

// import { Hanzo } from '../'
import { LANGFUSE_BASEURL } from "../../integration-test/integration-utils";
import { Hanzo } from "../index";

describe("hanzoWeb", () => {
  let fetch: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    (global as any).fetch = fetch = jest.fn(async (url) => {
      let res: any = { status: "ok" };

      // Can add more mocks here
      if (url.includes("traces")) {
        res = {
          ...res,
        };
      }

      return {
        status: 200,
        json: () => Promise.resolve(res),
      };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("init", () => {
    it("should initialise", async () => {
      const hanzo = new Hanzo({
        publicKey: "pk",
        secretKey: "sk",
        flushAt: 1,
      });
      expect(hanzo.baseUrl).toEqual("https://cloud.hanzo.ai");

      hanzo.trace({ name: "test-trace-1" });
      await jest.runAllTimersAsync();

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("correct trace", async () => {
      const hanzo = new Hanzo({
        publicKey: "pk",
        secretKey: "sk",
        flushAt: 1,
      });

      hanzo.trace({ name: "test-trace-1", id: "test-id" });
      await jest.advanceTimersByTimeAsync(1);

      expect(fetch).toHaveBeenCalledWith("https://cloud.hanzo.ai/api/public/ingestion", {
        body: expect.stringMatching(/.*"id"\s*:\s*"test-id".*"name"\s*:\s*"test-trace-1".*/),
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Basic " + Buffer.from("pk:sk").toString("base64"),
          "X-Hanzo-Sdk-Name": "trace-js",
          "X-Hanzo-Sdk-Version": hanzo.getLibraryVersion(),
          "X-Hanzo-Sdk-Variant": hanzo.getLibraryId(),
          "X-Hanzo-Public-Key": "pk",
        }),
        signal: expect.anything(),
      });
    });
  });
});
