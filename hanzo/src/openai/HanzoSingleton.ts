import { Hanzo } from "../hanzo";
import type { HanzoInitParams } from "./types";

/**
 * Represents a singleton instance of the Hanzo client.
 */
export class HanzoSingleton {
  private static instance: Hanzo | null = null; // Lazy initialization

  /**
   * Returns the singleton instance of the Hanzo client.
   * @param params Optional parameters for initializing the Hanzo instance. Only used for the first call.
   * @returns The singleton instance of the Hanzo client.
   */
  public static getInstance(params?: HanzoInitParams): Hanzo {
    if (!HanzoSingleton.instance) {
      HanzoSingleton.instance = new Hanzo(params);
    }
    return HanzoSingleton.instance;
  }
}
