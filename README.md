# SEED Angular

## Prerequisites
- Node v22+
- [pnpm](https://pnpm.io/installation)

## Setup
1. Install Node v22 or newer
2. Install pnpm globally: `npm i -g pnpm`
3. Install the project dependencies: `pnpm i`

## Actions

### Run
1. Run `pnpm start`
2. Browse to [localhost:4200](http://localhost:4200)

### Lint
1. Run `pnpm lint`, or `pnpm lint:fix` to automatically fix issues

### Update Translations
1. Create a `.env` file in the root of the project directory that matches the format of [`.env.example`](.env.example), and add your Lokalise API key
2. Run `pnpm update-translations`

## Coding Standards
Refer to [DEVELOPER.md](DEVELOPER.md) for all coding standards and guidelines.
