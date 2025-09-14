# AI Bridge Pro (UXP)

A Photoshop UXP panel for AI image generation with batch processing, history tracking, and preset management.

## Quick start
- Ensure you have Node 20+ and npm installed.
- Run `npm install` to install dependencies.
- Use `npm run dev` to start the development server.
- Open `dist/index.html` in a browser for a UI preview (note that this is not the Photoshop-integrated version).

## Build & package (Photoshop UXP)
- Execute `npm run build` to build the project.
- Run `npm run make:icon` to create the app icon.
- Package the extension by running `npm run pack:zip`.
- Load the resulting folder or `ai-bridge-pro-dist.zip` in the UXP Developer Tool and run it in Photoshop. The manifest will point to `dist/index.html`.

## Testing
- Unit tests are written using Jest with ts-jest.
- Run `npm test` to execute the tests.
- Continuous Integration (CI) is set up to run on push/PR (via GitHub Actions), which builds, tests, and uploads artifacts.

## What’s implemented
- `QueueManager` with sequential processing and retry/backoff mechanisms for handling retryable errors (such as 429/timeout/network issues).
- Engine adapters for `NanoBanana` and `Flux`, both adhering to the same request/response contract.
- `PresetsStore` with default settings (see `presets/presets.v1.json`), including import/export UI functionality.
- `HistoryStore` maintaining the last 50 entries with re-run capability.
- Basic React UI with tabs for Generate, Queue, History, Presets, and Settings.
- Packaging scripts located in `scripts/make_icon.js` and `scripts/build_pack.js`.

## Configure engines
The Settings tab stores the following keys in local storage:
- `nano.url`, `nano.key`
- `flux.url`, `flux.key`

## Engine HTTP contract
- **POST** `<apiUrl>`
- **Headers**: `Authorization: Bearer <apiKey>`, `Content-Type: application/json`
- **Body**: `{ prompt, negative, seed, strength, ref_weight }`
- **Response**: `{ image: "<base64 PNG/JPEG>" }`

## Acceptance checklist
Refer to `docs/ACCEPTANCE.md` for detailed acceptance criteria, including:
- Batch Queue functionality (supporting 20 jobs)
- Mask-smart Fill (currently a pipeline placeholder)
- Reproducibility based on prompt and seed
- History and Presets re-run, along with import/export capabilities
- Robust Error Handling with retry/backoff

## Notes
- To perform real image generation, ensure that functional APIs for `NanoBanana` and `Flux` are provided. For local manual testing, you may mock these with a simple HTTP service that returns `{ image: base64 }` and permits CORS.
- In Node.js, tests will polyfill `fetch` and `atob`. In UXP/Browser environments, `fetch` is available natively.