import Hanzo from "hanzo-node";
// @ts-ignore
import wtf from "wtfnode";

const {
  LF_PUBLIC = "pk-lf-1234567890",
  LF_SECRET = "sk-lf-1234567890",
  LF_HOST = "http://localhost:3000",
} = process.env;

const hanzo = new Hanzo({
  publicKey: LF_PUBLIC,
  secretKey: LF_SECRET,
  baseUrl: LF_HOST,
  // flushAt: 1,
});

hanzo.trace({
  name: "test-trace",
});

async function cleanup() {
  wtf.dump();
  await hanzo.shutdownAsync();
  wtf.dump();
  console.log("shut down successfully");
}

cleanup();
