import { version } from "../package.json";

import {
  // JsonType,
  HanzoCore,
  type HanzoFetchOptions,
  type HanzoFetchResponse,
  type HanzoPersistedProperty,
  HanzoMemoryStorage,
  utils,
} from "hanzo-core";
import { type HanzoOptions } from "./types";
import { fetch } from "./fetch";

// Required when users pass these as typed arguments
export {
  type HanzoTraceClient,
  type HanzoSpanClient,
  type HanzoEventClient,
  type HanzoGenerationClient,
} from "hanzo-core";

// The actual exported Nodejs API.
export default class Hanzo extends HanzoCore {
  private _memoryStorage = new HanzoMemoryStorage();

  private options: HanzoOptions;

  constructor(params?: { publicKey?: string; secretKey?: string } & HanzoOptions) {
    const { publicKey, secretKey, ...options } = utils.configHanzoSDK(params);
    if (!secretKey) {
      throw new Error("[Hanzo] secretKey is required for instantiation");
    }

    if (!publicKey) {
      throw new Error("[Hanzo] publicKey is required for instantiation");
    }

    super({ publicKey, secretKey, ...options });

    this.options = options;
  }

  getPersistedProperty(key: HanzoPersistedProperty): any | undefined {
    return this._memoryStorage.getProperty(key);
  }

  setPersistedProperty(key: HanzoPersistedProperty, value: any | null): void {
    return this._memoryStorage.setProperty(key, value);
  }

  fetch(url: string, options: HanzoFetchOptions): Promise<HanzoFetchResponse> {
    return this.options.fetch ? this.options.fetch(url, options) : fetch(url, options);
  }

  getLibraryId(): string {
    return "hanzo-node";
  }
  getLibraryVersion(): string {
    return version;
  }
  getCustomUserAgent(): string {
    return `hanzo-node/${version}`;
  }
}
