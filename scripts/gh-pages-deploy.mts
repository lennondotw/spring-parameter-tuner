#!/usr/bin/env pnpm exec tsx

import ghPages from 'gh-pages';
import { resolve } from 'node:path';

const distPath = resolve(import.meta.dirname, '../dist');

let publishError: unknown;

await ghPages.publish(
  distPath,
  {
    dotfiles: false,
    nojekyll: true,
    push: true,
    history: false,
    message: 'Publish build to GitHub Pages',
  },
  (error: unknown) => {
    publishError = error;
  }
);

if (publishError) {
  throw publishError;
}

console.log('Artifacts committed and force pushed to gh-pages branch');
