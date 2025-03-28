// uses the compiled node.js version, run yarn build after making changes to the SDKs
import Hanzo from "../hanzo-node";
import { createDatasetItemHandler } from "../hanzo-langchain";
import { randomUUID } from "crypto";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatOpenAI } from "@langchain/openai";

describe("Hanzo Node.js", () => {
  let hanzo: Hanzo;
  // jest.setTimeout(100000)
  jest.useRealTimers();

  beforeEach(() => {
    hanzo = new Hanzo();
    hanzo.debug(true);
  });

  afterEach(async () => {
    // ensure clean shutdown & no test interdependencies
    await hanzo.shutdownAsync();
  });

  describe("dataset and items", () => {
    it("create and get dataset, name only", async () => {
      const projectNameRandom = Math.random().toString(36).substring(7);
      await hanzo.createDataset(projectNameRandom);
      const getDataset = await hanzo.getDataset(projectNameRandom);
      expect(getDataset).toMatchObject({
        name: projectNameRandom,
      });
    });

    it("create and get dataset, name only, special character", async () => {
      const projectNameRandom = Math.random().toString(36).substring(7) + "+ 7/";
      await hanzo.createDataset(projectNameRandom);
      const getDataset = await hanzo.getDataset(projectNameRandom);
      expect(getDataset).toMatchObject({
        name: projectNameRandom,
      });
    });

    it("create and get dataset, object", async () => {
      const projectNameRandom = Math.random().toString(36).substring(7);
      await hanzo.createDataset({
        name: projectNameRandom,
        description: "test",
        metadata: { test: "test" },
      });
      const getDataset = await hanzo.getDataset(projectNameRandom);
      expect(getDataset).toMatchObject({
        name: projectNameRandom,
        description: "test",
        metadata: { test: "test" },
      });
    });

    it("create and get dataset item", async () => {
      const datasetNameRandom = Math.random().toString(36).substring(7);
      await hanzo.createDataset({ name: datasetNameRandom, metadata: { test: "test" } });
      const generation = hanzo.generation({ name: "test-observation" });
      await hanzo.flushAsync();
      const item1 = await hanzo.createDatasetItem({
        datasetName: datasetNameRandom,
        metadata: { test: "test" },
      });
      const item2 = await hanzo.createDatasetItem({
        datasetName: datasetNameRandom,
        input: [
          {
            role: "text",
            text: "hello world",
          },
          {
            role: "label",
            text: "hello world",
          },
        ],
        expectedOutput: {
          text: "hello world",
        },
        metadata: { test: "test" },
        sourceObservationId: generation.id,
        sourceTraceId: generation.traceId,
      });
      const item3 = await hanzo.createDatasetItem({
        datasetName: datasetNameRandom,
        input: "prompt",
        expectedOutput: "completion",
      });
      const getDataset = await hanzo.getDataset(datasetNameRandom);
      expect(getDataset).toMatchObject({
        name: datasetNameRandom,
        description: undefined,
        metadata: { test: "test" },
        items: expect.arrayContaining([
          expect.objectContaining({ ...item1, link: expect.any(Function) }),
          expect.objectContaining({ ...item2, link: expect.any(Function) }),
          expect.objectContaining({ ...item3, link: expect.any(Function) }),
        ]),
      });

      const getDatasetItem = await hanzo.getDatasetItem(item1.id);
      expect(getDatasetItem).toEqual(item1);
    }, 10000);

    it("create and get many dataset items to test pagination", async () => {
      const datasetNameRandom = Math.random().toString(36).substring(7);
      await hanzo.createDataset({ name: datasetNameRandom, metadata: { test: "test" } });
      await hanzo.flushAsync();
      // create 99 items
      for (let i = 0; i < 99; i++) {
        await hanzo.createDatasetItem({
          datasetName: datasetNameRandom,
          input: "prompt",
          expectedOutput: "completion",
          metadata: { test: "test" },
        });
      }

      // default
      const getDatasetDefault = await hanzo.getDataset(datasetNameRandom);
      expect(getDatasetDefault.items.length).toEqual(99);
      expect(getDatasetDefault.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ input: "prompt", expectedOutput: "completion", metadata: { test: "test" } }),
        ])
      );

      // chunks 8
      const getDatasetChunk8 = await hanzo.getDataset(datasetNameRandom, { fetchItemsPageSize: 8 });
      expect(getDatasetChunk8.items.length).toEqual(99);

      // chunks 11
      const getDatasetChunk11 = await hanzo.getDataset(datasetNameRandom, { fetchItemsPageSize: 11 });
      expect(getDatasetChunk11.items.length).toEqual(99);
    }, 10000);

    it("create, upsert and get dataset item", async () => {
      const projectNameRandom = Math.random().toString(36).substring(7);
      await hanzo.createDataset(projectNameRandom);

      const createRes = await hanzo.createDatasetItem({
        datasetName: projectNameRandom,
        input: {
          text: "hello world",
        },
        expectedOutput: {
          text: "hello world",
        },
      });
      const getRes = await hanzo.getDatasetItem(createRes.id);
      expect(getRes).toEqual(createRes);

      const UpdateRes = await hanzo.createDatasetItem({
        datasetName: projectNameRandom,
        id: createRes.id,
        input: {
          text: "hello world2",
        },
        expectedOutput: {
          text: "hello world2",
        },
        metadata: {
          test: "test",
        },
        status: "ARCHIVED",
      });
      const getUpdateRes = await hanzo.getDatasetItem(createRes.id);
      expect(getUpdateRes).toEqual(UpdateRes);
      expect(getUpdateRes).toMatchObject({
        id: createRes.id,
        input: {
          text: "hello world2",
        },
        expectedOutput: {
          text: "hello world2",
        },
        metadata: {
          test: "test",
        },
        status: "ARCHIVED",
      });
    }, 10000);

    it("e2e", async () => {
      const projectNameRandom = Math.random().toString(36).substring(7);
      await hanzo.createDataset(projectNameRandom);
      await hanzo.createDatasetItem({
        datasetName: projectNameRandom,
        input: "Hello trace",
        expectedOutput: "Hello world",
      });
      await hanzo.createDatasetItem({
        datasetName: projectNameRandom,
        input: "Hello generation",
        expectedOutput: "Hello world",
      });

      const trace = hanzo.trace({
        id: "test-trace-id-" + projectNameRandom,
        input: "input",
        output: "Hello world traced",
      });

      const generation = hanzo.generation({
        id: "test-generation-id-" + projectNameRandom,
        input: "input",
        output: "Hello world generated",
      });

      await hanzo.flushAsync();

      const dataset = await hanzo.getDataset(projectNameRandom);
      for (const item of dataset.items) {
        if (item.input === "Hello trace") {
          await item.link(trace, "test-run-" + projectNameRandom);
          trace.score({
            name: "test-score-trace",
            value: 0.5,
          });
        } else if (item.input === "Hello generation") {
          await item.link(generation, "test-run-" + projectNameRandom, {
            description: "test-run-description",
            metadata: { test: "test" },
          });
          generation.score({
            name: "test-score-generation",
            value: 0.5,
          });
        }
      }

      const getRun = await hanzo.getDatasetRun({
        datasetName: projectNameRandom,
        runName: "test-run-" + projectNameRandom,
      });

      expect(getRun).toMatchObject({
        name: "test-run-" + projectNameRandom,
        description: "test-run-description", // from second link
        metadata: { test: "test" }, // from second link
        datasetId: dataset.id,
        // array needs to be length 2
        datasetRunItems: expect.arrayContaining([
          expect.objectContaining({
            observationId: generation.id,
            traceId: generation.traceId,
          }),
          expect.objectContaining({
            traceId: trace.id,
          }),
        ]),
      });
    }, 10000);

    it("e2e multiple runs", async () => {
      const datasetName = Math.random().toString(36).substring(7);
      await hanzo.createDataset(datasetName);
      await hanzo.createDatasetItem({
        datasetName: datasetName,
        input: "Hello trace",
        expectedOutput: "Hello world",
      });
      await hanzo.createDatasetItem({
        datasetName: datasetName,
        input: "Hello generation",
        expectedOutput: "Hello world",
      });

      const trace = hanzo.trace({
        id: "test-trace-id-" + datasetName,
        input: "input",
        output: "Hello world traced",
      });

      const generation = hanzo.generation({
        id: "test-generation-id-" + datasetName,
        input: "input",
        output: "Hello world generated",
      });

      await hanzo.flushAsync();

      const dataset = await hanzo.getDataset(datasetName);
      for (let i = 0; i < 9; i++) {
        for (const item of dataset.items) {
          if (item.input === "Hello trace") {
            await item.link(trace, `test-run-${datasetName}-${i}`);
            trace.score({
              name: "test-score-trace",
              value: 0.5,
            });
          } else if (item.input === "Hello generation") {
            await item.link(generation, `test-run-${datasetName}-${i}`, {
              description: "test-run-description",
              metadata: { test: "test" },
            });
            generation.score({
              name: "test-score-generation",
              value: 0.5,
            });
          }
        }
      }

      // all at once
      const getRuns = await hanzo.getDatasetRuns(datasetName);
      expect(getRuns.data.length).toEqual(9);
      expect(getRuns.data[0]).toMatchObject({
        name: `test-run-${datasetName}-8`,
        description: "test-run-description",
        metadata: { test: "test" },
        datasetId: dataset.id,
        datasetName: datasetName,
      });

      // custom query
      const getRunsQuery = await hanzo.getDatasetRuns(datasetName, {
        limit: 2,
        page: 2,
      });
      expect(getRunsQuery.data.length).toEqual(2);
      expect(getRunsQuery.meta).toMatchObject({
        limit: 2,
        page: 2,
        totalItems: 9,
        totalPages: 5,
      });
    }, 10000);

    it("createDatasetItemHandler", async () => {
      // Create simple Langchain chain
      const prompt = new PromptTemplate({
        template: "What is the capital of {country}? Give ONLY the name of the capital.",
        inputVariables: ["country"],
      });
      const llm = new ChatOpenAI();
      const parser = new StringOutputParser();
      const chain = prompt.pipe(llm).pipe(parser);

      // Create a dataset
      const datasetName = randomUUID().slice(0, 8);
      await hanzo.createDataset(datasetName);

      // Add two items to the dataset
      await Promise.all([
        hanzo.createDatasetItem({
          datasetName: datasetName,
          input: "Germany",
          expectedOutput: "Berlin",
        }),

        hanzo.createDatasetItem({
          datasetName: datasetName,
          input: "France",
          expectedOutput: "Paris",
        }),
      ]);

      // Execute chain on dataset items
      const dataset = await hanzo.getDataset(datasetName);
      const runName = "test-run-" + new Date().toISOString();
      const runDescription = "test-run-description";
      const runMetadata = { test: "test" };
      const traceIds: string[] = [];

      for (const item of dataset.items) {
        const { handler, trace } = await createDatasetItemHandler({
          item,
          runName,
          hanzoClient: hanzo,
          options: {
            runDescription,
            runMetadata,
          },
        });

        await chain.invoke({ country: item.input }, { callbacks: [handler] });

        trace.score({
          name: "test-score",
          value: 0.5,
        });

        // Add trace id to list
        traceIds.push(trace.id);
      }

      await hanzo.flushAsync();

      // Verify that the dataset item is updated with the run name
      const getRun = await hanzo.getDatasetRun({ datasetName, runName });

      expect(getRun).toMatchObject({
        name: runName,
        description: "test-run-description", // from second link
        metadata: { test: "test" }, // from second link
        datasetId: dataset.id,
        datasetRunItems: expect.arrayContaining([
          expect.objectContaining({
            traceId: traceIds[0],
          }),
          expect.objectContaining({
            traceId: traceIds[1],
          }),
        ]),
      });
    }, 15000);
  });
});
