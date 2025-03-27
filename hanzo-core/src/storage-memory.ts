import { type HanzoPersistedProperty } from "./types";

export class HanzoMemoryStorage {
  private _memoryStorage: { [key: string]: any | undefined } = {};

  getProperty(key: HanzoPersistedProperty): any | undefined {
    return this._memoryStorage[key];
  }

  setProperty(key: HanzoPersistedProperty, value: any | null): void {
    this._memoryStorage[key] = value !== null ? value : undefined;
  }
}
