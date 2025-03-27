import { type HanzoCoreOptions } from "hanzo-core";

export type HanzoOptions = {
  // autocapture?: boolean
  persistence?: "localStorage" | "sessionStorage" | "cookie" | "memory";
  persistence_name?: string;
  enabled?: boolean;
} & HanzoCoreOptions;
