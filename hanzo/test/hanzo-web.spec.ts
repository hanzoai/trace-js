/**
 * @jest-environment jsdom
 */

// import { HanzoWeb } from '../'
import { utils } from "../../hanzo-core/src";
import { HanzoWeb } from "../index";
import { LANGFUSE_BASEURL } from "../../integration-test/integration-utils";

describe("hanzoWeb", () => {
  let fetch: jest.Mock;
  jest.useRealTimers();

  beforeEach(() => {
    (global as any).fetch = fetch = jest.fn(async (url) => {
      let res: any = { status: "ok" };

      // Can add more mocks here
      if (url.includes("traces")) {
        res = {
          ...res,
        };
      }

      if (url.startsWith("https://cloud-fail.hanzo.com")) {
        return {
          status: 404,
          json: () => Promise.resolve(res),
        };
      }

      return {
        status: 200,
        json: () => Promise.resolve(res),
      };
    });
  });

  describe("instantiation", () => {
    it("instantiates with env variables", async () => {
      const hanzo = new HanzoWeb();

      const options = hanzo._getFetchOptions({ method: "POST", body: "test" });

      expect(hanzo.baseUrl).toEqual("https://cloud.hanzo.ai");

      expect(options).toMatchObject({
        headers: {
          "Content-Type": "application/json",
          "X-Hanzo-Sdk-Name": "trace-js",
          "X-Hanzo-Sdk-Variant": "hanzo-frontend",
          "X-Hanzo-Public-Key": "",
          Authorization: "Bearer ",
        },
        body: "test",
      });
    });

    it("instantiates with constructor variables", async () => {
      const hanzo = new HanzoWeb({ publicKey: "test", baseUrl: "http://example.com" });

      const options = hanzo._getFetchOptions({ method: "POST", body: "test" });

      expect(hanzo.baseUrl).toEqual("http://example.com");
      expect(options).toMatchObject({
        headers: {
          "Content-Type": "application/json",
          "X-Hanzo-Sdk-Name": "trace-js",
          "X-Hanzo-Sdk-Variant": "hanzo-frontend",
          "X-Hanzo-Public-Key": "test",
          Authorization: "Bearer test",
        },
        body: "test",
      });
    });

    it("instantiates with without mandatory variables", async () => {
      const LANGFUSE_PUBLIC_KEY = String(process.env.LANGFUSE_PUBLIC_KEY);
      const LANGFUSE_SECRET_KEY = String(process.env.LANGFUSE_SECRET_KEY);
      const LANGFUSE_BASEURL = String(process.env.LANGFUSE_BASEURL);

      delete process.env.LANGFUSE_PUBLIC_KEY;
      delete process.env.LANGFUSE_SECRET_KEY;
      delete process.env.LANGFUSE_BASEURL;

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      const hanzoWeb = new HanzoWeb();

      expect((hanzoWeb as any).enabled).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Hanzo public key not passed to constructor and not set as 'LANGFUSE_PUBLIC_KEY' environment variable. No observability data will be sent to Hanzo."
      );

      process.env.LANGFUSE_PUBLIC_KEY = LANGFUSE_PUBLIC_KEY;
      process.env.LANGFUSE_SECRET_KEY = LANGFUSE_SECRET_KEY;
      process.env.LANGFUSE_BASEURL = LANGFUSE_BASEURL;
    });

    it("instantiates with public key only", async () => {
      const LANGFUSE_PUBLIC_KEY = String(process.env.LANGFUSE_PUBLIC_KEY);
      const LANGFUSE_SECRET_KEY = String(process.env.LANGFUSE_SECRET_KEY);
      const LANGFUSE_BASEURL = String(process.env.LANGFUSE_BASEURL);

      delete process.env.LANGFUSE_PUBLIC_KEY;
      delete process.env.LANGFUSE_SECRET_KEY;
      delete process.env.LANGFUSE_BASEURL;

      const hanzo = new HanzoWeb({ publicKey: "test", baseUrl: "http://example.com" });
      const options = hanzo._getFetchOptions({ method: "POST", body: "test" });

      expect(hanzo.baseUrl).toEqual("http://example.com");
      expect(options).toMatchObject({
        headers: {
          "Content-Type": "application/json",
          "X-Hanzo-Sdk-Name": "trace-js",
          "X-Hanzo-Sdk-Variant": "hanzo-frontend",
          "X-Hanzo-Public-Key": "test",
          Authorization: "Bearer test",
        },
        body: "test",
      });

      process.env.LANGFUSE_PUBLIC_KEY = LANGFUSE_PUBLIC_KEY;
      process.env.LANGFUSE_SECRET_KEY = LANGFUSE_SECRET_KEY;
      process.env.LANGFUSE_BASEURL = LANGFUSE_BASEURL;
    });

    it("should initialize", async () => {
      const hanzo = new HanzoWeb({
        publicKey: "pk",
        baseUrl: "https://cloud.hanzo.ai",
        flushAt: 10,
      });
      expect(hanzo.baseUrl).toEqual("https://cloud.hanzo.ai");

      const scoreNumericId = utils.generateUUID();
      const scoreNumeric = hanzo.score({
        id: scoreNumericId,
        name: "test",
        traceId: "test-trace-1",
        value: 200,
        comment: "test comment",
        observationId: "test-observation-id",
      });
      await jest.advanceTimersByTimeAsync(1);
      const scoreCategoricalId = utils.generateUUID();
      const scoreCategorical = hanzo.score({
        id: scoreCategoricalId,
        name: "test",
        traceId: "test-trace-1",
        value: "great",
        comment: "test comment",
        observationId: "test-observation-id",
      });
      await jest.advanceTimersByTimeAsync(1);

      const scoreBooleanId = utils.generateUUID();
      const scoreBoolean = hanzo.score({
        id: scoreBooleanId,
        name: "test",
        traceId: "test-trace-1",
        value: 0,
        comment: "test comment",
        observationId: "test-observation-id",
        dataType: "BOOLEAN",
      });
      await jest.advanceTimersByTimeAsync(1);

      expect(scoreNumeric).toBeInstanceOf(Promise);
      expect(scoreCategorical).toBeInstanceOf(Promise);
      expect(scoreBoolean).toBeInstanceOf(Promise);

      await scoreNumeric;
      await scoreCategorical;
      await scoreBoolean;

      expect(fetch).toHaveBeenCalledTimes(3);

      expect(fetch).toHaveBeenCalledWith(
        `${hanzo.baseUrl}/api/public/ingestion`,
        expect.objectContaining({
          body: expect.stringContaining(
            JSON.stringify({
              id: scoreNumericId,
              name: "test",
              traceId: "test-trace-1",
              value: 200,
              comment: "test comment",
              observationId: "test-observation-id",
            })
          ),
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Hanzo-Public-Key": "pk",
            Authorization: "Bearer pk",
            "X-Hanzo-Sdk-Name": "trace-js",
            "X-Hanzo-Sdk-Version": hanzo.getLibraryVersion(),
            "X-Hanzo-Sdk-Variant": hanzo.getLibraryId(),
          }),
          signal: expect.anything(),
        })
      );

      expect(fetch).toHaveBeenCalledWith(
        `${hanzo.baseUrl}/api/public/ingestion`,
        expect.objectContaining({
          body: expect.stringContaining(
            JSON.stringify({
              id: scoreCategoricalId,
              name: "test",
              traceId: "test-trace-1",
              value: "great",
              comment: "test comment",
              observationId: "test-observation-id",
            })
          ),
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Hanzo-Public-Key": "pk",
            Authorization: "Bearer pk",
            "X-Hanzo-Sdk-Name": "trace-js",
            "X-Hanzo-Sdk-Version": hanzo.getLibraryVersion(),
            "X-Hanzo-Sdk-Variant": hanzo.getLibraryId(),
          }),
          signal: expect.anything(),
        })
      );

      expect(fetch).toHaveBeenCalledWith(
        `${hanzo.baseUrl}/api/public/ingestion`,
        expect.objectContaining({
          body: expect.stringContaining(
            JSON.stringify({
              id: scoreBooleanId,
              name: "test",
              traceId: "test-trace-1",
              value: 0,
              comment: "test comment",
              observationId: "test-observation-id",
              dataType: "BOOLEAN",
            })
          ),
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Hanzo-Public-Key": "pk",
            Authorization: "Bearer pk",
            "X-Hanzo-Sdk-Name": "trace-js",
            "X-Hanzo-Sdk-Version": hanzo.getLibraryVersion(),
            "X-Hanzo-Sdk-Variant": hanzo.getLibraryId(),
          }),
          signal: expect.anything(),
        })
      );
    });

    it("should log error if score was not created", async () => {
      const hanzo = new HanzoWeb({
        publicKey: "pk",
        baseUrl: "https://cloud-fail.hanzo.com", // this will fail with 404
        flushAt: 10,
        fetchRetryCount: 2,
        fetchRetryDelay: 2,
      });
      expect(hanzo.baseUrl).toEqual("https://cloud-fail.hanzo.com");

      const id = utils.generateUUID();
      await hanzo.score({
        id,
        name: "test",
        traceId: "test-trace-1",
        value: 200,
        comment: "test comment",
        observationId: "test-observation-id",
      });

      // should not throw error

      // 1 call + 2 retries
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it("score is the only available object", async () => {
      const hanzo = new HanzoWeb({ publicKey: "pk" });

      expect(hanzo).toHaveProperty("score");

      expect(hanzo).not.toHaveProperty("trace");
      expect(hanzo).not.toHaveProperty("observation");
      expect(hanzo).not.toHaveProperty("span");
      expect(hanzo).not.toHaveProperty("event");
      expect(hanzo).not.toHaveProperty("generation");
    });
  });
});
