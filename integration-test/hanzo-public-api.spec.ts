import { randomUUID } from "crypto";
import { Hanzo } from "../hanzo";

describe("Hanzo Public API", () => {
  jest.setTimeout(10_000);

  const traceId = randomUUID();
  const observationId = randomUUID();
  const scoreId = randomUUID();

  let hanzo: Hanzo;

  const traceData = {
    id: traceId,
    name: "test-trace",
    userId: "test-user",
    input: { prompt: "test input" },
    output: { completion: "test output" },
    metadata: { source: "test" },
    tags: ["test", "integration"],
    version: "1.0.0",
    public: true,
  };

  const observationData = {
    id: observationId,
    traceId,
    type: "GENERATION",
    name: "test-generation",
    startTime: new Date(),
    endTime: new Date(),
    model: "gpt-4",
    modelParameters: {
      temperature: 0.7,
      maxTokens: 100,
    },
    input: { prompt: "test prompt" },
    output: { completion: "test completion" },
    metadata: { source: "test" },
    level: "DEFAULT" as const,
  };

  const scoreConfig = {
    id: scoreId,
    traceId,
    name: "accuracy",
    dataType: "NUMERIC" as const,
    description: "Accuracy score",
    minValue: 0,
    maxValue: 1,
    value: 0.5,
  };

  beforeAll(async () => {
    hanzo = new Hanzo();

    const trace = hanzo.trace(traceData);
    trace.generation(observationData);
    hanzo.score(scoreConfig);

    await hanzo.flushAsync();

    jest.useRealTimers();
    await new Promise((resolve) => setTimeout(resolve, 3_000));
  });

  describe("Health", () => {
    it("should check API health", async () => {
      const response = await hanzo.api.healthHealth();
      expect(response.status).toBe("OK");
    });
  });

  describe("Traces", () => {
    it("should retrieve traces", async () => {
      const createResponse = await hanzo.api.traceGet(traceId);
      expect(createResponse.id).toBe(traceData.id);

      const getResponse = await hanzo.api.traceGet(traceId);
      expect(getResponse.name).toBe(traceData.name);
      expect(getResponse.userId).toBe(traceData.userId);
      expect(getResponse.input).toEqual(traceData.input);
      expect(getResponse.public).toBe(true);
    });

    it("should list traces with pagination and filters", async () => {
      const response = await hanzo.api.traceList({
        page: 1,
        limit: 10,
        userId: "test-user",
        name: "test-trace",
        tags: ["test"],
        version: "1.0.0",
      });
      expect(response.data).toBeDefined();
      expect(response.meta.page).toBe(1);
      expect(response.meta.limit).toBe(10);
    });

    it("should filter traces by date range", async () => {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);

      const response = await hanzo.api.traceList({
        fromTimestamp: fromDate.toISOString(),
        toTimestamp: new Date().toISOString(),
      });
      expect(response.data).toBeDefined();
    });
  });

  describe("Observations", () => {
    it("should create and retrieve observations", async () => {
      const getResponse = await hanzo.api.observationsGet(observationId);

      expect(getResponse.name).toBe(observationData.name);
      expect(getResponse.type).toBe(observationData.type);
    });

    it("should list observations with filters", async () => {
      const response = await hanzo.api.observationsGetMany({
        page: 1,
        limit: 10,
        type: "GENERATION",
        name: "test-generation",
      });
      expect(response.data).toBeDefined();
      expect(response.meta.limit).toBe(10);
    });
  });

  describe("Scores", () => {
    it("should list scores with complex filters", async () => {
      const response = await hanzo.api.scoreGet({
        name: "accuracy",
        dataType: "NUMERIC",
        page: 1,
        limit: 20,
      });

      expect(response.data).toBeDefined();
      expect(response.meta.totalItems).toBeDefined();
    });
  });

  describe("Datasets and Runs", () => {
    it("should manage complete dataset lifecycle", async () => {
      // Create dataset
      const dataset = {
        name: "test-dataset-" + Date.now(),
        description: "Test dataset description",
        metadata: { source: "integration-test" },
      };
      const createResponse = await hanzo.api.datasetsCreate(dataset);
      expect(createResponse.name).toBe(dataset.name);

      // Create items
      const item = {
        datasetName: dataset.name,
        input: { prompt: "test prompt" },
        expectedOutput: { completion: "test completion" },
        metadata: { difficulty: "easy" },
        id: "test-item-" + Date.now(),
      };
      const itemResponse = await hanzo.api.datasetItemsCreate(item);
      expect(itemResponse.input).toEqual(item.input);

      // Create run
      const run = {
        runName: "test-run-" + Date.now(),
        runDescription: "Test run description",
        metadata: { model: "gpt-4" },
        datasetItemId: item.id,
        traceId: traceId,
      };
      const runResponse = await hanzo.api.datasetRunItemsCreate(run);
      expect(runResponse.datasetRunName).toBe(run.runName);
    });
  });

  describe("Media Handling", () => {
    it("should manage media uploads", async () => {
      const mediaRequest = {
        traceId: "test-trace-id",
        observationId: "test-observation-id",
        contentType: "image/png" as const,
        contentLength: 1024,
        sha256Hash: "q2ynIWR72jXMQsXA/SmbxpjfL53KwFd2Xf7d8DFXB4k=",
        field: "input",
      };

      const uploadUrlResponse = await hanzo.api.mediaGetUploadUrl(mediaRequest);
      expect(uploadUrlResponse.uploadUrl).toBeDefined();
      expect(uploadUrlResponse.mediaId).toBeDefined();

      // Simulate upload completion
      const patchBody = {
        uploadedAt: new Date().toISOString(),
        uploadHttpStatus: 200,
        uploadTimeMs: 1000,
      };
      await hanzo.api.mediaPatch(uploadUrlResponse.mediaId, patchBody);

      const getResponse = await hanzo.api.mediaGet(uploadUrlResponse.mediaId);
      expect(getResponse.contentType).toBe(mediaRequest.contentType);
    });
  });

  describe("Models", () => {
    it("should create and manage model definitions", async () => {
      const model = {
        modelName: "gpt-4-test",
        matchPattern: "(?i)^gpt-4",
        unit: "TOKENS" as const,
        inputPrice: 0.01,
        outputPrice: 0.02,
      };

      const createResponse = await hanzo.api.modelsCreate(model);
      expect(createResponse.modelName).toBe(model.modelName);

      const listResponse = await hanzo.api.modelsList({ page: 2 });
      expect(listResponse.data).toContainEqual(
        expect.objectContaining({
          modelName: model.modelName,
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid authentication", async () => {
      const invalidHanzo = new Hanzo({
        publicKey: "invalid",
        secretKey: "invalid",
      });

      try {
        await invalidHanzo.api.projectsGet();
      } catch (e: any) {
        expect(e.status).toBe(401);
      }
    });

    it("should handle resource not found errors", async () => {
      try {
        await hanzo.api.traceGet("non-existent-id");
        fail("Expected request to fail");
      } catch (error: any) {
        expect(error.status).toBe(404);
      }

      try {
        await hanzo.api.observationsGet("non-existent-id");
        fail("Expected request to fail");
      } catch (error: any) {
        expect(error.status).toBe(404);
      }

      try {
        await hanzo.api.scoreGetById("non-existent-id");
        fail("Expected request to fail");
      } catch (error: any) {
        expect(error.status).toBe(404);
      }
    });
  });
});
