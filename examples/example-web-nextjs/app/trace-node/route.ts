import Hanzo from "hanzo-node";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = crypto.randomUUID();

  const hanzo = new Hanzo({
    publicKey: "pk-lf-1234567890",
    secretKey: "sk-lf-1234567890",
    baseUrl: "http://localhost:3000",
    flushAt: 1,
  });

  hanzo.debug();

  hanzo.trace({
    id,
    name: "example-nextjs-backend-route",
  });

  await hanzo.shutdownAsync();

  return new Response(JSON.stringify({ id }), {
    headers: { "content-type": "application/json" },
  });
}
