/* eslint-disable @typescript-eslint/no-var-requires */
const { Hanzo, CallbackHandler } = require("hanzo-langchain");
const HanzoDefaultCallbackHandler = require("hanzo-langchain").default;

const { Hanzo: HanzoNode } = require("hanzo-node");
const HanzoNodeDefault = require("hanzo-node").default;

const dotenv = require("dotenv");

async function run() {
  dotenv.config();

  const secrets = {
    baseUrl: String(process.env["HANZO_BASEURL"]),
    publicKey: String(process.env["HANZO_PUBLIC_KEY"]),
    secretKey: String(process.env["HANZO_SECRET_KEY"]),
  };

  const hanzo = new Hanzo(secrets);

  const trace = hanzo.trace({ userId: "user-id" });

  const hanzoHandler = new CallbackHandler({ root: trace });
  await hanzoHandler.flushAsync();

  const hanzoHandler2 = new HanzoDefaultCallbackHandler({ root: trace });
  await hanzoHandler2.flushAsync();

  console.log("Did construct objects and called them.");

  const hanzoNode = new HanzoNode(secrets);
  const hanzoNodeDefault = new HanzoNodeDefault(secrets);
}

run();
