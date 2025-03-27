import { Hanzo, CallbackHandler } from "hanzo-langchain";
// This import will not typecheck at THERE below when NodeNext is configured badly
// as then the imports will be treated as CommonJS imports resulting in a missing default export.
import HanzoDefaultCallbackHandler from "hanzo-langchain";

import { OpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

import * as dotenv from "dotenv";

export async function run(): Promise<void> {
  dotenv.config();

  const hanzo = new Hanzo({
    baseUrl: String(process.env["HANZO_BASEURL"]),
    publicKey: String(process.env["HANZO_PUBLIC_KEY"]),
    secretKey: String(process.env["HANZO_SECRET_KEY"]),
  });

  const trace = hanzo.trace({ userId: "user-id" });

  const hanzoHandler = new CallbackHandler({ root: trace });
  await hanzoHandler.flushAsync();

  // THERE
  const hanzoHandler2 = new HanzoDefaultCallbackHandler({ root: trace });
  await hanzoHandler2.flushAsync();

  const prompt = PromptTemplate.fromTemplate("What is a good name for a company that makes {product}?");
  const llm = new OpenAI({
    temperature: 0,
    openAIApiKey: String(process.env["OPENAI_API_KEY"]),
  });
  // we are not calling the chain, just testing that it typechecks
  prompt.pipe(llm).withConfig({ callbacks: [hanzoHandler] });
  prompt.pipe(llm).withConfig({ callbacks: [hanzoHandler2] });
  console.log("Did construct objects and called them.");
}

run();
