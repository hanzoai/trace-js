/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: ["./hanzo", "./hanzo-core", "./hanzo-langchain", "./hanzo-node", "./hanzo-vercel"],
  entryPointStrategy: "packages",
  name: "Hanzo JS/TS SDKs",
  navigationLinks: {
    GitHub: "http://github.com/hanzoai/trace-js",
    Docs: "https://hanzo.com/docs/sdk/typescript",
  },
};
