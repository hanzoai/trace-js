import type { HanzoCore } from "hanzo-core";

import { HanzoSingleton } from "./HanzoSingleton";
import { withTracing } from "./traceMethod";
import type { HanzoConfig, HanzoExtension } from "./types";

/**
 * Wraps an OpenAI SDK object with Hanzo tracing. Function calls are extended with a tracer that logs detailed information about the call, including the method name,
 * input parameters, and output.
 * 
 * @param {T} sdk - The OpenAI SDK object to be wrapped.
 * @param {HanzoConfig} [hanzoConfig] - Optional configuration object for the wrapper.
 * @param {string} [hanzoConfig.traceName] - The name to use for tracing. If not provided, a default name based on the SDK's constructor name and the method name will be used.
 * @param {string} [hanzoConfig.sessionId] - Optional session ID for tracing.
 * @param {string} [hanzoConfig.userId] - Optional user ID for tracing.
 * @param {string} [hanzoConfig.release] - Optional release version for tracing.
 * @param {string} [hanzoConfig.version] - Optional version for tracing.
 * @param {string} [hanzoConfig.metadata] - Optional metadata for tracing.
 * @param {string} [hanzoConfig.tags] - Optional tags for tracing.
 * @returns {T} - A proxy of the original SDK object with methods wrapped for tracing.
 *
 * @example
 * const client = new OpenAI();
 * const res = observeOpenAI(client, { traceName: "My.OpenAI.Chat.Trace" }).chat.completions.create({
 *      messages: [{ role: "system", content: "Say this is a test!" }],
        model: "gpt-3.5-turbo",
        user: "hanzo",
        max_tokens: 300
 * });
 * */
export const observeOpenAI = <SDKType extends object>(
  sdk: SDKType,
  hanzoConfig?: HanzoConfig
): SDKType & HanzoExtension => {
  return new Proxy(sdk, {
    get(wrappedSdk, propKey, proxy) {
      const originalProperty = wrappedSdk[propKey as keyof SDKType];

      const defaultGenerationName = `${sdk.constructor?.name}.${propKey.toString()}`;
      const generationName = hanzoConfig?.generationName ?? defaultGenerationName;
      const traceName = hanzoConfig && "traceName" in hanzoConfig ? hanzoConfig.traceName : generationName;
      const config = { ...hanzoConfig, generationName, traceName };

      // Add a flushAsync method to the OpenAI SDK that flushes the Hanzo client
      if (propKey === "flushAsync") {
        let hanzoClient: HanzoCore;

        // Flush the correct client depending on whether a parent client is provided
        if (hanzoConfig && "parent" in hanzoConfig) {
          hanzoClient = hanzoConfig.parent.client;
        } else {
          hanzoClient = HanzoSingleton.getInstance();
        }

        return hanzoClient.flushAsync.bind(hanzoClient);
      }

      // Add a shutdownAsync method to the OpenAI SDK that flushes the Hanzo client
      if (propKey === "shutdownAsync") {
        let hanzoClient: HanzoCore;

        // Flush the correct client depending on whether a parent client is provided
        if (hanzoConfig && "parent" in hanzoConfig) {
          hanzoClient = hanzoConfig.parent.client;
        } else {
          hanzoClient = HanzoSingleton.getInstance();
        }

        return hanzoClient.shutdownAsync.bind(hanzoClient);
      }

      // Trace methods of the OpenAI SDK
      if (typeof originalProperty === "function") {
        return withTracing(originalProperty.bind(wrappedSdk), config);
      }

      const isNestedOpenAIObject =
        originalProperty &&
        !Array.isArray(originalProperty) &&
        !(originalProperty instanceof Date) &&
        typeof originalProperty === "object";

      // Recursively wrap nested objects to ensure all nested properties or methods are also traced
      if (isNestedOpenAIObject) {
        return observeOpenAI(originalProperty, config);
      }

      // Fallback to returning the original value
      return Reflect.get(wrappedSdk, propKey, proxy);
    },
  }) as SDKType & HanzoExtension;
};
