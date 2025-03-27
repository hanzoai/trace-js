import { Hanzo, CallbackHandler } from "hanzo-langchain";
import HanzoDefaultCallbackHandler from "hanzo-langchain";

import { Hanzo as HanzoNode } from "hanzo-node";
import HanzoNodeDefault from "hanzo-node";

import { OpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

import * as dotenv from "dotenv";

export async function run(): Promise<void> {
  dotenv.config();

  const secrets = {
    baseUrl: String(process.env["LANGFUSE_BASEURL"]),
    publicKey: String(process.env["LANGFUSE_PUBLIC_KEY"]),
    secretKey: String(process.env["LANGFUSE_SECRET_KEY"]),
  };

  const hanzo = new Hanzo(secrets);

  const trace = hanzo.trace({ userId: "user-id" });

  const hanzoHandler = new CallbackHandler({ root: trace });
  await hanzoHandler.flushAsync();

  const hanzoHandler2 = new HanzoDefaultCallbackHandler({ root: trace });
  await hanzoHandler2.flushAsync();

  console.log("Did construct objects and called them.");

  new HanzoNode();
  new HanzoNodeDefault();

  const prompt = PromptTemplate.fromTemplate("What is a good name for a company that makes {product}?");
  const llm = new OpenAI({
    temperature: 0,
    openAIApiKey: String(process.env["OPENAI_API_KEY"]),
  });

  // we are not calling the chain, just testing that it typechecks
  prompt.pipe(llm).withConfig({ callbacks: [hanzoHandler] });
  prompt.pipe(llm).withConfig({ callbacks: [hanzoHandler2] });
}

run();
