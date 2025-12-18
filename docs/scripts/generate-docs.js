#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '../..');
const docsDir = join(__dirname, '../src/content/docs');

// Ensure directories exist
mkdirSync(join(docsDir, 'plugins'), { recursive: true });
mkdirSync(join(docsDir, 'guides'), { recursive: true });

// Function to add frontmatter to README content
function addFrontmatter(content, title, description) {
  const frontmatter = `---
title: ${title}
description: ${description}
---

`;
  return frontmatter + content;
}

// Plugin documentation
const plugins = [
  {
    name: 'magic-imports',
    title: 'Magic Imports Plugin',
    description: 'Enable virtual imports with framework-specific mappings for Mitosis',
    readmePath: join(rootDir, 'src/magic-imports/README.md')
  },
  {
    name: 'index-generator',
    title: 'Index Generator Plugin',
    description: 'Generate index.ts files for clean imports in Mitosis projects',
    readmePath: join(rootDir, 'src/index-generator/README.md')
  },
  {
    name: 'story-generator',
    title: 'Story Generator Plugin',
    description: 'Auto-generate Storybook stories from Mitosis components',
    readmePath: join(rootDir, 'src/story-generator/README.md')
  },
  {
    name: 'rich-types',
    title: 'Rich Types Plugin',
    description: 'Fix TypeScript type inference issues in Mitosis generated code',
    readmePath: join(rootDir, 'src/rich-types/README.md')
  },
  {
    name: 'target-files',
    title: 'Target Files Plugin',
    description: 'Handle target-specific files using naming conventions',
    readmePath: join(rootDir, 'src/target-files/README.md')
  },
  {
    name: 'css-modules',
    title: 'CSS Modules Plugin',
    description: 'Inject CSS from .module.css files into Mitosis components',
    readmePath: join(rootDir, 'src/css-modules/README.md')
  }
];

// Generate plugin documentation
plugins.forEach(plugin => {
  try {
    const content = readFileSync(plugin.readmePath, 'utf-8');
    // Remove the back navigation link since we're in a proper docs site
    const cleanedContent = content.replace(/^← \[Back to main README\].*\n/m, '');
    const mdxContent = addFrontmatter(cleanedContent, plugin.title, plugin.description);
    const outputPath = join(docsDir, 'plugins', `${plugin.name}.mdx`);
    writeFileSync(outputPath, mdxContent);
    console.log(`✓ Generated: plugins/${plugin.name}.mdx`);
  } catch (error) {
    console.error(`✗ Error processing ${plugin.name}:`, error.message);
  }
});

// Generate overview from main README
try {
  const mainReadme = readFileSync(join(rootDir, 'README.md'), 'utf-8');
  // Clean up the content for the docs
  const cleanedContent = mainReadme
    .replace(/^# mitosis-plugins\n/m, '# Overview\n')
    .replace(/^← \[Back to main README\].*\n/m, '')
    .replace(/\[Learn more →\]\(.*\)/g, ''); // Remove learn more links since we're in docs

  const overviewContent = addFrontmatter(
    cleanedContent,
    'Mitosis Plugins Overview',
    'Complete overview of mitosis-plugins with quick start guide and plugin descriptions'
  );

  writeFileSync(join(docsDir, 'guides/overview.mdx'), overviewContent);
  console.log('✓ Generated: guides/overview.mdx');
} catch (error) {
  console.error('✗ Error processing main README:', error.message);
}

// Create a getting-started guide
try {
  const gettingStartedContent = addFrontmatter(
    `## Quick Start

This guide will help you get started with mitosis-plugins in minutes.

### Installation

\`\`\`bash
bun add mitosis-plugins
\`\`\`

### Basic Configuration

Create a \`mitosis.config.cjs\` file in your project root:

\`\`\`javascript
const {
  magicImportsPlugin,
  indexGeneratorPlugin,
  targetFilesPlugin
} = require('mitosis-plugins');

module.exports = {
  files: 'src/**/*.lite.tsx',
  targets: ['react', 'vue', 'svelte'],
  commonOptions: {
    plugins: [
      magicImportsPlugin({
        imports: {
          'lucide': {
            mapping: {
              react: 'lucide-react',
              vue: 'lucide-vue-next',
              svelte: 'lucide-svelte'
            },
            shim: 'lucide-react'
          }
        }
      }),
      targetFilesPlugin({
        allTargets: ['react', 'vue', 'svelte']
      })
    ]
  },
  options: {
    react: {
      plugins: [indexGeneratorPlugin()]
    },
    vue: {
      plugins: [indexGeneratorPlugin()]
    },
    svelte: {
      plugins: [indexGeneratorPlugin()]
    }
  }
};
\`\`\`

### Next Steps

- Explore the [Plugin Reference](./plugins/) to learn about all available plugins
- Read the [Overview](./overview/) for detailed information about each plugin
- Check out specific plugin guides for advanced configuration options
`,
    'Getting Started',
    'Quick start guide for setting up mitosis-plugins in your project'
  );

  writeFileSync(join(docsDir, 'guides/getting-started.mdx'), gettingStartedContent);
  console.log('✓ Generated: guides/getting-started.mdx');
} catch (error) {
  console.error('✗ Error creating getting-started guide:', error.message);
}

console.log('\n✅ Documentation generation complete!');
console.log('\nNext steps:');
console.log('1. Update astro.config.ts with new sidebar configuration');
console.log('2. Run `npm run dev` to test the documentation site');
console.log('3. Build and deploy the documentation');

// Remove the old symlinks since we're generating actual files
console.log('\nCleaning up old symlinks...');
try {
  unlinkSync(join(docsDir, 'plugins/magic-imports.mdx'));
  unlinkSync(join(docsDir, 'plugins/index-generator.mdx'));
  unlinkSync(join(docsDir, 'plugins/story-generator.mdx'));
  unlinkSync(join(docsDir, 'plugins/rich-types.mdx'));
  unlinkSync(join(docsDir, 'plugins/target-files.mdx'));
  unlinkSync(join(docsDir, 'plugins/css-modules.mdx'));
  unlinkSync(join(docsDir, 'guides/overview.mdx'));
  console.log('✓ Removed old symlinks');
} catch (error) {
  console.log('Note: Some symlinks may not have existed');
}

console.log('\n🎉 All done! Your documentation is ready to be configured.');