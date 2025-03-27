import { type HanzoObjectClient } from "./index";
import { type HanzoPromptClient } from "./prompts/promptClients";
import { type components, type paths } from "./openapi/server";

export type HanzoCoreOptions = {
  // Hanzo API publicKey obtained from the Hanzo UI project settings
  publicKey?: string;
  // Hanzo API secretKey obtained from the Hanzo UI project settings
  secretKey?: string;
  // Hanzo API baseUrl (https://cloud.hanzo.ai by default)
  baseUrl?: string;
  // Additional HTTP headers to send with each request
  additionalHeaders?: Record<string, string>;
  // The number of events to queue before sending to Hanzo (flushing)
  flushAt?: number;
  // The interval in milliseconds between periodic flushes
  flushInterval?: number;
  // How many times we will retry HTTP requests
  fetchRetryCount?: number;
  // The delay between HTTP request retries
  fetchRetryDelay?: number;
  // Timeout in milliseconds for any calls. Defaults to 10 seconds.
  requestTimeout?: number;
  // release (version) of the application, defaults to env LANGFUSE_RELEASE
  release?: string;
  // integration type of the SDK.
  sdkIntegration?: string; // DEFAULT, LANGCHAIN, or any other custom value
  // Enabled switch for the SDK. If disabled, no observability data will be sent to Hanzo. Defaults to true.
  enabled?: boolean;
  // Mask function to mask data in the event body
  mask?: MaskFunction;
  // Trace sampling rate. Approx. sampleRate % traces will be sent to LF servers
  sampleRate?: number;
  // Environment from which traces originate
  environment?: string;
  // Project ID to use for the SDK in admin mode. This should never be set by users.
  _projectId?: string;
  // Whether to enable local event export. Defaults to false.
  _isLocalEventExportEnabled?: boolean;
};

export enum HanzoPersistedProperty {
  Props = "props",
  Queue = "queue",
  OptedOut = "opted_out",
}

export type HanzoFetchOptions = {
  method: "GET" | "POST" | "PUT" | "PATCH";
  headers: { [key: string]: string };
  body?: string | Buffer;
  signal?: AbortSignal;
};

export type HanzoFetchResponse<T = any> = {
  status: number;
  text: () => Promise<string>;
  json: () => Promise<T>;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type HanzoObject = SingleIngestionEvent["type"];

export type HanzoQueueItem = SingleIngestionEvent & {
  callback?: (err: any) => void;
};

export type SingleIngestionEvent =
  paths["/api/public/ingestion"]["post"]["requestBody"]["content"]["application/json"]["batch"][number];

// return type of ingestion endpoint defined on 200 status error in fern as 207 is not possible
export type IngestionReturnType =
  paths["/api/public/ingestion"]["post"]["responses"][207]["content"]["application/json"];

export type HanzoEventProperties = {
  [key: string]: any;
};

export type HanzoMetadataProperties = {
  [key: string]: any;
};

// ASYNC
export type CreateHanzoTraceBody = FixTypes<components["schemas"]["TraceBody"]>;

export type CreateHanzoEventBody = FixTypes<components["schemas"]["CreateEventBody"]>;

export type CreateHanzoSpanBody = FixTypes<components["schemas"]["CreateSpanBody"]>;
export type UpdateHanzoSpanBody = FixTypes<components["schemas"]["UpdateSpanBody"]>;
export type EventBody =
  | CreateHanzoTraceBody
  | CreateHanzoEventBody
  | CreateHanzoSpanBody
  | CreateHanzoGenerationBody
  | CreateHanzoScoreBody
  | UpdateHanzoSpanBody
  | UpdateHanzoGenerationBody;

export type Usage = FixTypes<components["schemas"]["IngestionUsage"]>;
export type UsageDetails = FixTypes<components["schemas"]["UsageDetails"]>;
export type CreateHanzoGenerationBody = FixTypes<components["schemas"]["CreateGenerationBody"]>;
export type UpdateHanzoGenerationBody = FixTypes<components["schemas"]["UpdateGenerationBody"]>;

export type CreateHanzoScoreBody = FixTypes<components["schemas"]["ScoreBody"]>;

// SYNC
export type GetHanzoTracesQuery = FixTypes<paths["/api/public/traces"]["get"]["parameters"]["query"]>;
export type GetHanzoTracesResponse = FixTypes<
  paths["/api/public/traces"]["get"]["responses"]["200"]["content"]["application/json"]
>;
export type GetHanzoTraceResponse = FixTypes<
  paths["/api/public/traces/{traceId}"]["get"]["responses"]["200"]["content"]["application/json"]
>;
export type GetHanzoObservationsQuery = FixTypes<paths["/api/public/observations"]["get"]["parameters"]["query"]>;
export type GetHanzoObservationsResponse = FixTypes<
  paths["/api/public/observations"]["get"]["responses"]["200"]["content"]["application/json"]
>;
export type GetHanzoObservationResponse = FixTypes<
  paths["/api/public/observations/{observationId}"]["get"]["responses"]["200"]["content"]["application/json"]
>;
export type GetHanzoSessionsQuery = FixTypes<paths["/api/public/sessions"]["get"]["parameters"]["query"]>;
export type GetHanzoSessionsResponse = FixTypes<
  paths["/api/public/sessions"]["get"]["responses"]["200"]["content"]["application/json"]
>;
export type GetHanzoDatasetParams = FixTypes<
  paths["/api/public/v2/datasets/{datasetName}"]["get"]["parameters"]["path"]
>;
export type GetHanzoDatasetResponse = FixTypes<
  paths["/api/public/v2/datasets/{datasetName}"]["get"]["responses"]["200"]["content"]["application/json"]
>;
export type GetHanzoDatasetItemsQuery = paths["/api/public/dataset-items"]["get"]["parameters"]["query"];
export type GetHanzoDatasetItemsResponse = FixTypes<
  paths["/api/public/dataset-items"]["get"]["responses"]["200"]["content"]["application/json"]
>;
export type CreateHanzoDatasetRunItemBody = FixTypes<
  paths["/api/public/dataset-run-items"]["post"]["requestBody"]["content"]["application/json"]
>;
export type CreateHanzoDatasetRunItemResponse = FixTypes<
  paths["/api/public/dataset-run-items"]["post"]["responses"]["200"]["content"]["application/json"]
>;
export type CreateHanzoDatasetBody =
  paths["/api/public/v2/datasets"]["post"]["requestBody"]["content"]["application/json"];
export type CreateHanzoDatasetResponse = FixTypes<
  paths["/api/public/v2/datasets"]["post"]["responses"]["200"]["content"]["application/json"]
>;
export type CreateHanzoDatasetItemBody = FixTypes<
  paths["/api/public/dataset-items"]["post"]["requestBody"]["content"]["application/json"]
>;
export type CreateHanzoDatasetItemResponse = FixTypes<
  paths["/api/public/dataset-items"]["post"]["responses"]["200"]["content"]["application/json"]
>;
export type GetHanzoDatasetRunParams = FixTypes<
  paths["/api/public/datasets/{datasetName}/runs/{runName}"]["get"]["parameters"]["path"]
>;
export type GetHanzoDatasetRunResponse = FixTypes<
  paths["/api/public/datasets/{datasetName}/runs/{runName}"]["get"]["responses"]["200"]["content"]["application/json"]
>;
export type GetHanzoDatasetRunsQuery =
  paths["/api/public/datasets/{datasetName}/runs"]["get"]["parameters"]["query"];
export type GetHanzoDatasetRunsPath = paths["/api/public/datasets/{datasetName}/runs"]["get"]["parameters"]["path"];

export type GetHanzoDatasetRunsResponse = FixTypes<
  paths["/api/public/datasets/{datasetName}/runs"]["get"]["responses"]["200"]["content"]["application/json"]
>;
export type CreateHanzoPromptBody = FixTypes<
  paths["/api/public/v2/prompts"]["post"]["requestBody"]["content"]["application/json"]
>;
export type UpdatePromptBody = FixTypes<
  paths["/api/public/v2/prompts/{name}/versions/{version}"]["patch"]["requestBody"]["content"]["application/json"]
>;
export type CreateHanzoPromptResponse =
  paths["/api/public/v2/prompts"]["post"]["responses"]["200"]["content"]["application/json"];

export type GetHanzoPromptSuccessData =
  paths["/api/public/v2/prompts/{promptName}"]["get"]["responses"]["200"]["content"]["application/json"];

export type GetHanzoPromptFailureData = { message?: string };
export type GetHanzoPromptResponse =
  | {
      fetchResult: "success";
      data: GetHanzoPromptSuccessData;
    }
  | { fetchResult: "failure"; data: GetHanzoPromptFailureData };

export type ChatMessage = FixTypes<components["schemas"]["ChatMessage"]>;
export type ChatPrompt = FixTypes<components["schemas"]["ChatPrompt"]> & { type: "chat" };
export type TextPrompt = FixTypes<components["schemas"]["TextPrompt"]> & { type: "text" };

// Media
export type GetMediaUploadUrlRequest = FixTypes<components["schemas"]["GetMediaUploadUrlRequest"]>;
export type GetMediaUploadUrlResponse = FixTypes<components["schemas"]["GetMediaUploadUrlResponse"]>;
export type MediaContentType = components["schemas"]["MediaContentType"];
export type PatchMediaBody = FixTypes<components["schemas"]["PatchMediaBody"]>;
export type GetMediaResponse = FixTypes<components["schemas"]["GetMediaResponse"]>;

type CreateTextPromptRequest = FixTypes<components["schemas"]["CreateTextPromptRequest"]>;
type CreateChatPromptRequest = FixTypes<components["schemas"]["CreateChatPromptRequest"]>;
export type CreateTextPromptBody = { type?: "text" } & Omit<CreateTextPromptRequest, "type"> & { isActive?: boolean }; // isActive is optional for backward compatibility
export type CreateChatPromptBody = { type: "chat" } & Omit<CreateChatPromptRequest, "type"> & { isActive?: boolean }; // isActive is optional for backward compatibility

export type CreatePromptBody = CreateTextPromptBody | CreateChatPromptBody;

export type PromptInput = {
  prompt?: HanzoPromptRecord | HanzoPromptClient;
};

export type JsonType = string | number | boolean | null | { [key: string]: JsonType } | Array<JsonType>;

type OptionalTypes<T> = T extends null | undefined ? T : never;

type FixTypes<T> = T extends undefined
  ? undefined
  : Omit<
      {
        [P in keyof T]: P extends
          | "startTime"
          | "endTime"
          | "timestamp"
          | "completionStartTime"
          | "createdAt"
          | "updatedAt"
          | "fromTimestamp"
          | "toTimestamp"
          | "fromStartTime"
          | "toStartTime"
          ? // Dates instead of strings
            Date | OptionalTypes<T[P]>
          : P extends "metadata" | "input" | "output" | "completion" | "expectedOutput"
            ? // JSON instead of strings
              any | OptionalTypes<T[P]>
            : T[P];
      },
      "externalId" | "traceIdType"
    >;

export type DeferRuntime = {
  hanzoTraces: (
    traces: {
      id: string;
      name: string;
      url: string;
    }[]
  ) => void;
};

// Datasets
export type DatasetItemData = GetHanzoDatasetItemsResponse["data"][number];
export type LinkDatasetItem = (
  obj: HanzoObjectClient,
  runName: string,
  runArgs?: {
    description?: string;
    metadata?: any;
  }
) => Promise<{ id: string }>;
export type DatasetItem = DatasetItemData & { link: LinkDatasetItem };

export type MaskFunction = (params: { data: any }) => any;

export type HanzoPromptRecord = (TextPrompt | ChatPrompt) & { isFallback: boolean };
