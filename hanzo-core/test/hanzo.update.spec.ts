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

  describe("update span", () => {
    it("should update a span", async () => {
      jest.setSystemTime(new Date("2022-01-01"));

      const trace = hanzo.trace({
        name: "test-trace",
      });
      const span = trace.span({
        name: "test-span-1",
      });
      span.update({
        version: "1.0.0",
        name: "test-span-2",
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
            timestamp: expect.any(String),
            type: "span-update",
            body: {
              traceId: trace.id,
              id: span.id,
              version: "1.0.0",
              name: "test-span-2",
            },
          },
        ],
      });
    });

    it("should update a generation", async () => {
      jest.setSystemTime(new Date("2022-01-01"));

      const trace = hanzo.trace({
        name: "test-trace",
      });
      const generation = trace.generation({
        name: "test-span-1",
      });
      generation.update({
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
            timestamp: expect.any(String),
            type: "generation-update",
            body: {
              traceId: trace.id,
              id: generation.id,
              version: "1.0.0",
            },
          },
        ],
      });
    });
  });
});
