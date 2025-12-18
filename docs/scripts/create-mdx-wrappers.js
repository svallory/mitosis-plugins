#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = join(__dirname, '../src/content/docs');

// Define the wrapper files to create
const wrappers = [
  {
    path: join(docsDir, 'plugins/magic-imports.mdx'),
    title: 'Magic Imports Plugin',
    description: 'Enable virtual imports with framework-specific mappings for Mitosis',
    readmePath: join(docsDir, '../../../../../src/magic-imports/README.md')
  },
  {
    path: join(docsDir, 'plugins/index-generator.mdx'),
    title: 'Index Generator Plugin',
    description: 'Generate index.ts files for clean imports in Mitosis projects',
    readmePath: join(docsDir, '../../../../../src/index-generator/README.md')
  },
  {
    path: join(docsDir, 'plugins/story-generator.mdx'),
    title: 'Story Generator Plugin',
    description: 'Auto-generate Storybook stories from Mitosis components',
    readmePath: join(docsDir, '../../../../../src/story-generator/README.md')
  },
  {
    path: join(docsDir, 'plugins/rich-types.mdx'),
    title: 'Rich Types Plugin',
    description: 'Fix TypeScript type inference issues in Mitosis generated code',
    readmePath: join(docsDir, '../../../../../src/rich-types/README.md')
  },
  {
    path: join(docsDir, 'plugins/target-files.mdx'),
    title: 'Target Files Plugin',
    description: 'Handle target-specific files using naming conventions',
    readmePath: join(docsDir, '../../../../../src/target-files/README.md')
  },
  {
    path: join(docsDir, 'plugins/css-modules.mdx'),
    title: 'CSS Modules Plugin',
    description: 'Inject CSS from .module.css files into Mitosis components',
    readmePath: join(docsDir, '../../../../../src/css-modules/README.md')
  },
  {
    path: join(docsDir, 'guides/overview.mdx'),
    title: 'Mitosis Plugins Overview',
    description: 'Complete overview of mitosis-plugins with quick start guide',
    readmePath: join(docsDir, '../../../../../README.md')
  }
];

// Create MDX wrapper files
wrappers.forEach(({ path, title, description, readmePath }) => {
  const relativePath = readmePath.replace(join(docsDir, '/'), '');

  const mdxContent = `---
title: ${title}
description: ${description}
---

import ReadmeContent from '${relativePath}';

<ReadmeContent />
`;

  writeFileSync(path, mdxContent);
  console.log(`Created wrapper: ${path}`);
});

console.log('\nAll MDX wrapper files created successfully!');
console.log('Next steps:');
console.log('1. Update astro.config.ts with new sidebar items');
console.log('2. Run npm run dev to test the documentation');