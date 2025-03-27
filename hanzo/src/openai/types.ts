import type OpenAI from "openai";
import type {
  CreateHanzoTraceBody,
  CreateHanzoGenerationBody,
  HanzoCoreOptions,
  HanzoTraceClient,
  HanzoSpanClient,
  HanzoGenerationClient,
  HanzoPromptClient,
} from "hanzo-core";
import type { HanzoSingleton } from "./HanzoSingleton";

export type HanzoInitParams = {
  publicKey?: string;
  secretKey?: string;
} & HanzoCoreOptions;

type HanzoTraceConfig = Pick<
  CreateHanzoTraceBody,
  "sessionId" | "userId" | "release" | "version" | "metadata" | "tags"
>;
type HanzoGenerationConfig = Pick<
  CreateHanzoGenerationBody,
  "metadata" | "version" | "promptName" | "promptVersion"
>;

export type HanzoNewTraceConfig = HanzoTraceConfig & {
  traceId?: string;
  traceName?: string;
  clientInitParams?: HanzoInitParams;
};
export type HanzoParent = HanzoTraceClient | HanzoSpanClient | HanzoGenerationClient;
export type HanzoWithParentConfig = HanzoGenerationConfig & { parent: HanzoParent };

export type HanzoConfig = (HanzoNewTraceConfig | HanzoWithParentConfig) & {
  generationName?: string;
  hanzoPrompt?: HanzoPromptClient;
};
export type HanzoExtension = OpenAI &
  Pick<ReturnType<typeof HanzoSingleton.getInstance>, "flushAsync" | "shutdownAsync">;
