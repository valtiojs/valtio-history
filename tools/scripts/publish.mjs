/**
 * This is a minimal script to publish your package to "npm".
 * This is meant to be used as-is or customize as you see fit.
 *
 * This script is executed on "dist/path/to/library" as "cwd" by default.
 *
 * You might need to authenticate with NPM before running this script.
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { execSync } from 'child_process';

import devkit from '@nx/devkit';
const { readCachedProjectGraph } = devkit;

function invariant(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

/**
 * for local publishing and testing ensure to run: pnpm nx run local-registry
 */
// Executing publish script: node path/to/publish.mjs --name {name} --version {version} --tag {tag}
// Default "tag" to "next" so we won't publish the "latest" tag by accident.
const { name, tag = 'next' } = yargs(hideBin(process.argv))
  .scriptName('publish')
  .option('name', {
    alias: 'n',
    type: 'string',
    describe: 'the name to say hello to',
  })
  .option('tag', {
    alias: 't',
    type: 'string',
    description: 'provide intended tag',
    default: 'next',
  })
  .help().argv;

const graph = readCachedProjectGraph();
const project = graph.nodes[name];

invariant(
  project,
  `Could not find project "${name}" in the workspace. Is the project.json configured correctly?`
);

const outputPath = project.data?.targets?.build?.options?.outputPath;
invariant(
  outputPath,
  `Could not find "build.options.outputPath" of project "${name}". Is project.json configured  correctly?`
);

process.chdir(outputPath);
const persistPublish = process.env.NPM_REGISTRY_PERSIST === 'true';
console.table([
  { name: 'cwd', value: outputPath },
  { name: 'persist', value: persistPublish },
]);

const registry = persistPublish ? '' : ' --registry http://localhost:4873/';

// Execute "npm publish" to publish
execSync(`npm publish${registry} --access public --tag ${tag}`);
