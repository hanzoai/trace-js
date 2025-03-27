import {
  HanzoCore,
  HanzoWebStateless,
  type HanzoFetchOptions,
  type HanzoFetchResponse,
  type HanzoPersistedProperty,
  utils,
} from "hanzo-core";
import { type HanzoStorage, getStorage } from "./storage";
import { HanzoPublicApi } from "./publicApi";
import { version } from "../package.json";
import { type HanzoOptions } from "./types";

export type * from "./publicApi";
export type {
  HanzoPromptClient,
  ChatPromptClient,
  TextPromptClient,
  HanzoPromptRecord,
  HanzoTraceClient,
  HanzoSpanClient,
  HanzoEventClient,
  HanzoGenerationClient,
} from "hanzo-core";

// Required when users pass these as typed arguments
export { HanzoMedia } from "hanzo-core";

export class Hanzo extends HanzoCore {
  private _storage: HanzoStorage;
  private _storageCache: any;
  private _storageKey: string;
  public api: HanzoPublicApi<null>["api"];

  constructor(params?: { publicKey?: string; secretKey?: string } & HanzoOptions) {
    const hanzoConfig = utils.configHanzoSDK(params);
    super(hanzoConfig);

    if (typeof window !== "undefined" && "Deno" in window === false) {
      this._storageKey = params?.persistence_name
        ? `lf_${params.persistence_name}`
        : `lf_${hanzoConfig.publicKey}_hanzo`;
      this._storage = getStorage(params?.persistence || "localStorage", window);
    } else {
      this._storageKey = `lf_${hanzoConfig.publicKey}_hanzo`;
      this._storage = getStorage("memory", undefined);
    }

    this.api = new HanzoPublicApi({
      baseUrl: this.baseUrl,
      baseApiParams: {
        headers: {
          "X-Hanzo-Sdk-Name": "trace-js",
          "X-Hanzo-Sdk-Version": this.getLibraryVersion(),
          "X-Hanzo-Sdk-Variant": this.getLibraryId(),
          "X-Hanzo-Sdk-Integration": this.sdkIntegration,
          "X-Hanzo-Public-Key": this.publicKey,
          ...this.additionalHeaders,
          ...this.constructAuthorizationHeader(this.publicKey, this.secretKey),
        },
      },
    }).api;
  }

  getPersistedProperty<T>(key: HanzoPersistedProperty): T | undefined {
    if (!this._storageCache) {
      this._storageCache = JSON.parse(this._storage.getItem(this._storageKey) || "{}") || {};
    }

    return this._storageCache[key];
  }

  setPersistedProperty<T>(key: HanzoPersistedProperty, value: T | null): void {
    if (!this._storageCache) {
      this._storageCache = JSON.parse(this._storage.getItem(this._storageKey) || "{}") || {};
    }

    if (value === null) {
      delete this._storageCache[key];
    } else {
      this._storageCache[key] = value;
    }

    this._storage.setItem(this._storageKey, JSON.stringify(this._storageCache));
  }

  fetch(url: string, options: HanzoFetchOptions): Promise<HanzoFetchResponse> {
    return fetch(url, options);
  }

  getLibraryId(): string {
    return "hanzo";
  }

  getLibraryVersion(): string {
    return version;
  }

  getCustomUserAgent(): void {
    return;
  }
}

export class HanzoWeb extends HanzoWebStateless {
  private _storage: HanzoStorage;
  private _storageCache: any;
  private _storageKey: string;

  constructor(params?: Omit<HanzoOptions, "secretKey">) {
    const hanzoConfig = utils.configHanzoSDK(params, false);
    super(hanzoConfig);

    if (typeof window !== "undefined") {
      this._storageKey = params?.persistence_name
        ? `lf_${params.persistence_name}`
        : `lf_${hanzoConfig.publicKey}_hanzo`;
      this._storage = getStorage(params?.persistence || "localStorage", window);
    } else {
      this._storageKey = `lf_${hanzoConfig.publicKey}_hanzo`;
      this._storage = getStorage("memory", undefined);
    }
  }

  getPersistedProperty<T>(key: HanzoPersistedProperty): T | undefined {
    if (!this._storageCache) {
      this._storageCache = JSON.parse(this._storage.getItem(this._storageKey) || "{}") || {};
    }

    return this._storageCache[key];
  }

  setPersistedProperty<T>(key: HanzoPersistedProperty, value: T | null): void {
    if (!this._storageCache) {
      this._storageCache = JSON.parse(this._storage.getItem(this._storageKey) || "{}") || {};
    }

    if (value === null) {
      delete this._storageCache[key];
    } else {
      this._storageCache[key] = value;
    }

    this._storage.setItem(this._storageKey, JSON.stringify(this._storageCache));
  }

  fetch(url: string, options: HanzoFetchOptions): Promise<HanzoFetchResponse> {
    return fetch(url, options);
  }

  getLibraryId(): string {
    return "hanzo-frontend";
  }

  getLibraryVersion(): string {
    return version;
  }

  getCustomUserAgent(): void {
    return;
  }
}
