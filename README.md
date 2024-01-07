# valtio-history

valtio utility for creating a proxy state with history tracking

https://valtio.pmnd.rs/docs/api/utils/proxyWithHistory

### Main Packages

| Name                                       | Docs                                                                                                                    | Badges                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [valtio-history](packages/history-utility) | [website](https://valtio.pmnd.rs/docs/api/utils/proxyWithHistory) <br/> [api](packages/history-utility/docs/modules.md) | [![npm version](https://badge.fury.io/js/valtio-history.svg)](https://badge.fury.io/js/valtio-history) |

---

## Getting Started

- Ensure [pnpm](https://pnpm.io/installation) is installed
- Run `pnpm i` to install the dependencies.

## Building

Run `pnpm nx build history-utility` to build the library.

## Running unit tests

Run `pnpm nx test history-utility` to execute the unit tests via [Vitest](https://vitest.dev/).

## Running example project

Run `pnpm nx serve typescript-001`

## Preparing a release

Run `pnpm release`

- There will be a guided step through the release prepration.
- The GitHub release form will open to be filled out
  - Once the release is created in GitHub, then a build will run to publish to npm

## Local publishing of packages for testing

In a dedicated terminal, run `pnpm nx run local-registry`

In another terminal, run: `pnpm nx run-many -t publish --projects=tag:publish`

This assumes the `package.json` versions in `packages/*` folders are updated.
Already published versions will throw a conflict error as usual
