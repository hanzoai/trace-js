import { parseBody } from "./test-utils/test-utils";
import {
  createTestClient,
  type HanzoCoreTestClient,
  type HanzoCoreTestClientMocks,
} from "./test-utils/HanzoCoreTestClient";
import { type HanzoObjectClient } from "../src";

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

  describe("multiple spans", () => {
    it("should create a trace", async () => {
      jest.setSystemTime(new Date("2022-01-01"));

      const trace = hanzo.trace({
        name: "test-trace",
      });
      trace.span({
        name: "test-span-1",
      });
      const span2 = trace.span({
        name: "test-span-2",
      });
      const event = span2.event({
        name: "test-event-1",
      });
      event.score({
        name: "test-score-1",
        value: 0.5,
      });
      event.score({
        name: "test-score-categorical",
        value: "my-category",
      });
      event.score({
        name: "test-score-boolean",
        value: 0,
        dataType: "BOOLEAN",
      });

      await hanzo.shutdownAsync();

      const checks = [
        {
          url: "https://cloud.hanzo.ai/api/public/ingestion",
          object: {
            batch: [
              {
                id: expect.any(String),
                timestamp: expect.any(String),
                type: "trace-create",
                body: { name: "test-trace" },
              },
            ],
          },
        },
        {
          url: "https://cloud.hanzo.ai/api/public/ingestion",
          object: {
            batch: [
              {
                id: expect.any(String),
                timestamp: expect.any(String),
                type: "span-create",
                body: { name: "test-span-1", traceId: trace.id },
              },
            ],
          },
        },
        {
          url: "https://cloud.hanzo.ai/api/public/ingestion",
          object: {
            batch: [
              {
                id: expect.any(String),
                timestamp: expect.any(String),
                type: "span-create",
                body: { name: "test-span-2", traceId: trace.id },
              },
            ],
          },
        },
        {
          url: "https://cloud.hanzo.ai/api/public/ingestion",
          object: {
            batch: [
              {
                id: expect.any(String),
                timestamp: expect.any(String),
                type: "event-create",
                body: {
                  name: "test-event-1",
                  traceId: trace.id,
                  parentObservationId: span2.id,
                },
              },
            ],
          },
        },
        {
          url: "https://cloud.hanzo.ai/api/public/ingestion",
          object: {
            batch: [
              {
                id: expect.any(String),
                timestamp: expect.any(String),
                type: "score-create",
                body: {
                  name: "test-score-1",
                  traceId: trace.id,
                  observationId: event.id,
                  value: 0.5,
                },
              },
            ],
          },
        },
        {
          url: "https://cloud.hanzo.ai/api/public/ingestion",
          object: {
            batch: [
              {
                id: expect.any(String),
                timestamp: expect.any(String),
                type: "score-create",
                body: {
                  name: "test-score-categorical",
                  traceId: trace.id,
                  observationId: event.id,
                  value: "my-category",
                },
              },
            ],
          },
        },
        {
          url: "https://cloud.hanzo.ai/api/public/ingestion",
          object: {
            batch: [
              {
                id: expect.any(String),
                timestamp: expect.any(String),
                type: "score-create",
                body: {
                  name: "test-score-boolean",
                  traceId: trace.id,
                  observationId: event.id,
                  value: 0,
                  dataType: "BOOLEAN",
                },
              },
            ],
          },
        },
      ];
      expect(mocks.fetch).toHaveBeenCalledTimes(7);
      checks.forEach((check, i) => {
        const [url, options] = mocks.fetch.mock.calls[i];
        expect(url).toMatch(check.url);
        expect(options.method).toBe("POST");
        const body = parseBody(mocks.fetch.mock.calls[i]);
        expect(body).toMatchObject(check.object);
      });
    });

    it("it should not break when nesting deeply", async () => {
      const trace = hanzo.trace({
        name: "test-trace",
      });

      let client: HanzoObjectClient = trace.span({
        name: "test-span-1",
      });

      for (let i = 0; i < 100; i++) {
        let nextClient: HanzoObjectClient;
        const rand = Math.random();
        if (rand < 0.33) {
          nextClient = client.span({
            name: `test-span-${i}`,
          });
          await hanzo.flushAsync();
          expect(parseBody(mocks.fetch.mock.calls.pop())).toMatchObject({
            batch: [
              {
                id: expect.any(String),
                timestamp: expect.any(String),
                type: "span-create",
                body: {
                  traceId: trace.id,
                  parentObservationId: client.id,
                  id: nextClient.id,
                  name: `test-span-${i}`,
                },
              },
            ],
          });
        } else if (rand < 0.66) {
          nextClient = client.event({
            name: `test-event-${i}`,
          });
          await hanzo.flushAsync();
          expect(parseBody(mocks.fetch.mock.calls.pop())).toMatchObject({
            batch: [
              {
                id: expect.any(String),
                timestamp: expect.any(String),
                type: "event-create",
                body: {
                  traceId: trace.id,
                  parentObservationId: client.id,
                  id: nextClient.id,
                  name: `test-event-${i}`,
                },
              },
            ],
          });
        } else {
          nextClient = client.generation({
            name: `test-generation-${i}`,
          });
          await hanzo.flushAsync();
          expect(parseBody(mocks.fetch.mock.calls.pop())).toMatchObject({
            batch: [
              {
                id: expect.any(String),
                timestamp: expect.any(String),
                type: "generation-create",
                body: {
                  traceId: trace.id,
                  parentObservationId: client.id,
                  id: nextClient.id,
                  name: `test-generation-${i}`,
                },
              },
            ],
          });
        }
        client = nextClient;
      }
    });
  });
});
