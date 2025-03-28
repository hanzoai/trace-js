import { parseBody } from "./test-utils/test-utils";
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
    [hanzo, mocks] = createTestClient({
      publicKey: "pk-lf-111",
      secretKey: "sk-lf-111",
      flushAt: 1,
    });
  });

  describe("end a span", () => {
    it("should end a span", async () => {
      jest.setSystemTime(new Date("2022-01-01"));

      const trace = hanzo.trace({
        name: "test-trace",
      });
      const span = trace.span({
        name: "test-span-1",
      });
      span.end({
        output: { text: "test-output" },
      });

      await hanzo.shutdownAsync();

      expect(mocks.fetch).toHaveBeenCalledTimes(3);
      const [url, options] = mocks.fetch.mock.calls[2];
      expect(url).toMatch("https://cloud.hanzo.ai/api/public/ingestion");
      expect(options.method).toBe("POST");
      const body = parseBody(mocks.fetch.mock.calls[2]);
      expect(body).toMatchObject({
        batch: [
          {
            id: expect.any(String),
            type: "span-update",
            timestamp: expect.any(String),
            body: {
              traceId: trace.id,
              id: span.id,
              output: { text: "test-output" },
              endTime: "2022-01-01T00:00:00.000Z",
            },
          },
        ],
        metadata: {
          batch_size: 1,
          public_key: "pk-lf-111",
          sdk_integration: "DEFAULT",
          sdk_name: "trace-js",
          sdk_variant: "hanzo-core-tests",
          sdk_version: "2.0.0-alpha.2",
        },
      });
    });

    it("should end a span (without body)", async () => {
      jest.setSystemTime(new Date("2022-01-01"));

      const trace = hanzo.trace({
        name: "test-trace",
      });
      const span = trace.span({
        name: "test-span-1",
      });
      span.end();

      await hanzo.shutdownAsync();

      expect(mocks.fetch).toHaveBeenCalledTimes(3);
      const [url, options] = mocks.fetch.mock.calls[2];
      expect(url).toMatch("https://cloud.hanzo.ai/api/public/ingestion");
      expect(options.method).toBe("POST");
      const body = parseBody(mocks.fetch.mock.calls[2]);
      expect(body).toEqual({
        batch: [
          {
            id: expect.any(String),
            type: "span-update",
            timestamp: expect.any(String),
            body: {
              traceId: trace.id,
              id: span.id,
              endTime: "2022-01-01T00:00:00.000Z",
            },
          },
        ],
        metadata: {
          batch_size: 1,
          public_key: "pk-lf-111",
          sdk_integration: "DEFAULT",
          sdk_name: "trace-js",
          sdk_variant: "hanzo-core-tests",
          sdk_version: "2.0.0-alpha.2",
        },
      });
    });
  });

  describe("end a generation", () => {
    it("should end a generation", async () => {
      jest.setSystemTime(new Date("2022-01-01"));

      const trace = hanzo.trace({
        name: "test-trace",
      });
      const generation = trace.generation({
        name: "test-span-1",
      });
      generation.end({
        version: "1.0.0",
      });

      await hanzo.shutdownAsync();

      expect(mocks.fetch).toHaveBeenCalledTimes(3);
      const [url, options] = mocks.fetch.mock.calls[2];
      expect(url).toMatch("https://cloud.hanzo.ai/api/public/ingestion");
      expect(options.method).toBe("POST");
      const body = parseBody(mocks.fetch.mock.calls[2]);
      expect(body).toMatchObject({
        batch: [
          {
            id: expect.any(String),
            type: "generation-update",
            timestamp: expect.any(String),
            body: {
              traceId: trace.id,
              id: generation.id,
              version: "1.0.0",
              endTime: "2022-01-01T00:00:00.000Z",
            },
          },
        ],
      });
    });

    it("should end a generation (without body)", async () => {
      jest.setSystemTime(new Date("2022-01-01"));

      const trace = hanzo.trace({
        name: "test-trace",
      });
      const generation = trace.generation({
        name: "test-span-1",
      });
      generation.end();

      await hanzo.shutdownAsync();

      expect(mocks.fetch).toHaveBeenCalledTimes(3);
      const [url, options] = mocks.fetch.mock.calls[2];
      expect(url).toMatch("https://cloud.hanzo.ai/api/public/ingestion");
      expect(options.method).toBe("POST");
      const body = parseBody(mocks.fetch.mock.calls[2]);
      expect(body).toMatchObject({
        batch: [
          {
            id: expect.any(String),
            type: "generation-update",
            timestamp: expect.any(String),
            body: {
              traceId: trace.id,
              id: generation.id,
              endTime: "2022-01-01T00:00:00.000Z",
            },
          },
        ],
      });
    });
  });
});
