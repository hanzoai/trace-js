import { type HanzoCoreOptions, type HanzoFetchOptions, type HanzoFetchResponse } from "hanzo-core";

export type HanzoOptions = HanzoCoreOptions & {
  persistence?: "memory";
  // Timeout in milliseconds for any calls. Defaults to 10 seconds.
  requestTimeout?: number;
  // A custom fetch implementation. Defaults to axios in the node package.
  fetch?: (url: string, options: HanzoFetchOptions) => Promise<HanzoFetchResponse>;
};
