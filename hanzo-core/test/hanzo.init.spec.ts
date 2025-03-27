import {
  createTestClient,
  type HanzoCoreTestClient,
  type HanzoCoreTestClientMocks,
} from "./test-utils/HanzoCoreTestClient";

describe("Hanzo Core", () => {
  let hanzo: HanzoCoreTestClient;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mocks: HanzoCoreTestClientMocks;

  beforeEach(() => {
    [hanzo, mocks] = createTestClient({
      publicKey: "pk-lf-111",
      secretKey: "sk-lf-111",
    });
  });

  describe("init", () => {
    it("should initialise", () => {
      expect(hanzo.baseUrl).toEqual("https://cloud.hanzo.ai");
    });

    it("should initialise in disabled state with missing api key or enabled flag set to false", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const disabledClient = createTestClient({
        publicKey: "public key",
        secretKey: "secret key",
        enabled: false,
      });

      expect((disabledClient[0] as any).enabled).toBe(false);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        "Hanzo is disabled. No observability data will be sent to Hanzo."
      );

      const noPublicKeyClient = createTestClient({
        publicKey: undefined as unknown as string,
        secretKey: "secret key",
      });

      expect((noPublicKeyClient[0] as any).enabled).toBe(false);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        2,
        "Hanzo public key was not passed to constructor or not set as 'LANGFUSE_PUBLIC_KEY' environment variable. No observability data will be sent to Hanzo."
      );

      const noSecretKeyClient = createTestClient({
        publicKey: "public key",
        secretKey: undefined as unknown as string,
      });
      expect(consoleSpy).toHaveBeenNthCalledWith(
        3,
        "Hanzo secret key was not passed to constructor or not set as 'LANGFUSE_SECRET_KEY' environment variable. No observability data will be sent to Hanzo."
      );

      expect((noSecretKeyClient[0] as any).enabled).toBe(false);

      const noKeysClient = createTestClient({
        publicKey: undefined as unknown as string,
        secretKey: undefined as unknown as string,
      });

      expect((noKeysClient[0] as any).enabled).toBe(false);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        4,
        "Hanzo secret key was not passed to constructor or not set as 'LANGFUSE_SECRET_KEY' environment variable. No observability data will be sent to Hanzo."
      );
    });

    it("should initialise default options", () => {
      expect(hanzo as any).toMatchObject({
        secretKey: "sk-lf-111",
        publicKey: "pk-lf-111",
        baseUrl: "https://cloud.hanzo.ai",
        flushInterval: 10000,
      });
    });

    it("overwrites defaults with options", () => {
      [hanzo, mocks] = createTestClient({
        publicKey: "pk",
        secretKey: "sk",
        baseUrl: "https://a.com",
        flushAt: 1,
        flushInterval: 2,
      });

      expect(hanzo).toMatchObject({
        secretKey: "sk",
        publicKey: "pk",
        baseUrl: "https://a.com",
        flushAt: 1,
        flushInterval: 2,
      });
    });

    it("should keep the flushAt option above zero", () => {
      [hanzo, mocks] = createTestClient({
        secretKey: "sk",
        publicKey: "pk",
        flushAt: -2,
      }) as any;
      expect((hanzo as any).flushAt).toEqual(1);
    });

    it("should remove trailing slashes from `baseUrl`", () => {
      [hanzo, mocks] = createTestClient({
        secretKey: "sk",
        publicKey: "pk",
        baseUrl: "http://my-local-hanzo.com///",
      });

      expect((hanzo as any).baseUrl).toEqual("http://my-local-hanzo.com");
    });
  });
});
