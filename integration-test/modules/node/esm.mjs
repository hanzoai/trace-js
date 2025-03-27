import { Hanzo, CallbackHandler } from "hanzo-langchain";
import HanzoDefaultCallbackHandler from "hanzo-langchain";

import * as dotenv from "dotenv";

export async function run() {
  dotenv.config();

  const hanzo = new Hanzo({
    baseUrl: String(process.env["HANZO_BASEURL"]),
    publicKey: String(process.env["HANZO_PUBLIC_KEY"]),
    secretKey: String(process.env["HANZO_SECRET_KEY"]),
  });

  const trace = hanzo.trace({ userId: "user-id" });

  const hanzoHandler = new CallbackHandler({ root: trace });
  await hanzoHandler.flushAsync();

  const hanzoHandler2 = new HanzoDefaultCallbackHandler({ root: trace });
  await hanzoHandler2.flushAsync();

  console.log("Did construct objects and called them.");
}

run();
