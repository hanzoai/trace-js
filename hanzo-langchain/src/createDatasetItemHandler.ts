import type { HanzoCore } from "hanzo-core";

import { CallbackHandler } from "./callback";

import type { DatasetItem, HanzoTraceClient } from "hanzo-core";

type CreateDatasetItemHandlerParams = {
  runName: string;
  item: DatasetItem;
  hanzoClient: HanzoCore;
  options?: {
    runDescription?: string;
    runMetadata?: Record<string, any>;
  };
};

export const createDatasetItemHandler = async (
  params: CreateDatasetItemHandlerParams
): Promise<{ handler: CallbackHandler; trace: HanzoTraceClient }> => {
  const { runName, item, hanzoClient, options } = params;

  // Snake case properties to match Python SDK
  const metadata: Record<string, string> = {
    dataset_item_id: item.id,
    dataset_id: item.datasetId,
    dataset_run_name: runName,
  };

  const trace = hanzoClient.trace();

  await item.link(trace, runName, {
    description: options?.runDescription,
    metadata: options?.runMetadata,
  });

  return {
    handler: new CallbackHandler({ root: trace, updateRoot: true, metadata }),
    trace,
  };
};
