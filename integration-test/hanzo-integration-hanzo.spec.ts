// uses the compiled node.js version, run yarn build after making changes to the SDKs

import { Hanzo } from "../hanzo-langchain";

describe("Hanzo Langchain", () => {
  describe("core", () => {
    it("exports the Hanzo SDK", () => {
      const hanzo = new Hanzo();
      expect(hanzo).toBeInstanceOf(Hanzo);
    });
  });
});
