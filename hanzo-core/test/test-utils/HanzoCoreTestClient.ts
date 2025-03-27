import {
  HanzoCore,
  type HanzoCoreOptions,
  type HanzoFetchOptions,
  type HanzoFetchResponse,
} from "../../src";

const version = "2.0.0-alpha.2";

export interface HanzoCoreTestClientMocks {
  fetch: jest.Mock<Promise<HanzoFetchResponse>, [string, HanzoFetchOptions]>;
  storage: {
    getItem: jest.Mock<any | undefined, [string]>;
    setItem: jest.Mock<void, [string, any | null]>;
  };
}

export class HanzoCoreTestClient extends HanzoCore {
  public _cachedDistinctId?: string;

  constructor(
    private mocks: HanzoCoreTestClientMocks,
    params: { publicKey: string; secretKey: string } & HanzoCoreOptions
  ) {
    super(params);
  }

  getPersistedProperty<T>(key: string): T {
    return this.mocks.storage.getItem(key);
  }
  setPersistedProperty<T>(key: string, value: T | null): void {
    return this.mocks.storage.setItem(key, value);
  }
  fetch(url: string, options: HanzoFetchOptions): Promise<HanzoFetchResponse> {
    return this.mocks.fetch(url, options);
  }
  getLibraryId(): string {
    return "hanzo-core-tests";
  }
  getLibraryVersion(): string {
    return version;
  }
  getCustomUserAgent(): string {
    return "hanzo-core-tests";
  }
}

export const createTestClient = (
  params: {
    publicKey: string;
    secretKey: string;
  } & HanzoCoreOptions,
  setupMocks?: (mocks: HanzoCoreTestClientMocks) => void
): [HanzoCoreTestClient, HanzoCoreTestClientMocks] => {
  const storageCache: { [key: string]: string | undefined } = {};
  const mocks = {
    fetch: jest.fn<Promise<HanzoFetchResponse>, [string, HanzoFetchOptions]>(),
    storage: {
      getItem: jest.fn<any | undefined, [string]>((key) => storageCache[key]),
      setItem: jest.fn<void, [string, any | null]>((key, val) => {
        storageCache[key] = val == null ? undefined : val;
      }),
    },
  };

  mocks.fetch.mockImplementation(() =>
    Promise.resolve({
      status: 200,
      text: () => Promise.resolve("ok"),
      json: () => Promise.resolve({ status: "ok" }),
      arrayBuffer: () => Promise.resolve(new Uint8Array()),
    })
  );

  setupMocks?.(mocks);

  return [new HanzoCoreTestClient(mocks, params), mocks];
};
