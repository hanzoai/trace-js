![GitHub Banner](https://github.com/hanzoai/trace-js/assets/2834609/d1613347-445f-4e91-9e84-428fda9c3659)

# trace-js

[![MIT License](https://img.shields.io/badge/License-MIT-red.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![CI test status](https://img.shields.io/github/actions/workflow/status/hanzo/trace-js/ci.yml?style=flat-square&label=All%20tests)](https://github.com/hanzoai/trace-js/actions/workflows/ci.yml?query=branch%3Amain)
[![GitHub Repo stars](https://img.shields.io/github/stars/hanzo/hanzo?style=flat-square&logo=GitHub&label=hanzo%2Fhanzo)](https://github.com/hanzoai/hanzo)
[![Discord](https://img.shields.io/discord/1111061815649124414?style=flat-square&logo=Discord&logoColor=white&label=Discord&color=%23434EE4)](https://discord.gg/7NXusRtqYU)
[![YC W23](https://img.shields.io/badge/Y%20Combinator-W23-orange?style=flat-square)](https://www.ycombinator.com/companies/hanzo)

Modular mono repo for the Hanzo JS/TS client libraries.

## Packages

> [!IMPORTANT]
> The SDK was rewritten in v2 and released on December 18, 2023. Refer to the [v2 migration guide](https://hanzo.ai/docs/sdk/typescript#upgrade1to2) for instructions on updating your code.

| Package                                                                                     | NPM                                                                                                                                   | Environments          |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| [hanzo](https://github.com/hanzoai/trace-js/tree/main/hanzo)                      | [![npm package](https://img.shields.io/npm/v/hanzo?style=flat-square)](https://www.npmjs.com/package/hanzo)                     | Node >= 18, Web, Edge |
| [hanzo-node](https://github.com/hanzoai/trace-js/tree/main/hanzo-node)            | [![npm package](https://img.shields.io/npm/v/hanzo-node?style=flat-square)](https://www.npmjs.com/package/hanzo-node)           | Node < 18             |
| [hanzo-langchain](https://github.com/hanzoai/trace-js/tree/main/hanzo-langchain)  | [![npm package](https://img.shields.io/npm/v/hanzo-langchain?style=flat-square)](https://www.npmjs.com/package/hanzo-langchain) | Node >= 20, Web, Edge |
| [hanzo-vercel (beta)](https://github.com/hanzoai/trace-js/tree/main/hanzo-vercel) | [![npm package](https://img.shields.io/npm/v/hanzo-vercel?style=flat-square)](https://www.npmjs.com/package/hanzo-vercel)       | Node >= 20, Web, Edge |

## Documentation

- Docs: https://hanzo.ai/docs/sdk/typescript
- Reference: https://js.reference.hanzo.com

## License

[MIT](LICENSE)

## Credits

Thanks to the PostHog team for the awesome work on [posthog-js-lite](https://github.com/PostHog/posthog-js-lite). This project is based on it as it was the best starting point to build a modular SDK repo to support various environments.
