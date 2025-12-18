---
title: Index Generator Plugin
description: Generate index.ts files for clean imports in Mitosis projects
---

# Index Generator Plugin


Generates `index.ts` files for each component to support folder-based import structures.

## Problem

When Mitosis generates components into their own folders, imports become verbose:

```typescript
// Without index files
import Button from './components/Button/Button';
import Modal from './components/Modal/Modal';

// With index files
import Button from './components/Button';
import Modal from './components/Modal';
```

## Solution

This plugin automatically generates `index.ts` files that re-export the default component:

```typescript
// packages/react/src/components/Button/index.ts
export { default } from './Button';
```

## Installation

```bash
bun add mitosis-plugins
```

## Usage

### Basic Setup

```javascript
const { indexGeneratorPlugin } = require('mitosis-plugins');

module.exports = {
  targets: ['react', 'vue', 'svelte'],
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
```

### Custom Component Paths

Organize components into subdirectories based on naming conventions:

```javascript
indexGeneratorPlugin({
  getComponentBasePath: (name) => {
    if (name.startsWith('Form')) return 'components/forms';
    if (name.startsWith('Layout')) return 'components/layouts';
    if (name.startsWith('Icon')) return 'components/icons';
    return 'components';
  }
})
```

### Custom Output Directory

Override the default output structure:

```javascript
indexGeneratorPlugin({
  outputDir: 'lib/components'
})
```

### Full Control

For complete customization:

```javascript
const path = require('path');

indexGeneratorPlugin({
  getIndexOutputPath: (componentName, framework, projectRoot) => {
    return path.join(projectRoot, 'dist', framework, componentName, 'index.ts');
  },
  generateIndexContent: (componentName, framework) => {
    const ext = framework === 'vue' ? '.vue' : framework === 'svelte' ? '.svelte' : '';
    return `export { default } from './${componentName}${ext}';\nexport * from './${componentName}${ext}';\n`;
  }
})
```

## Configuration Options

```typescript
interface IndexGeneratorOptions {
  /**
   * Base output directory for generated files.
   * Defaults to `packages/{framework}/src` relative to the project root.
   */
  outputDir?: string;

  /**
   * Function to determine the component's base path within the output directory.
   */
  getComponentBasePath?: (componentName: string) => string;

  /**
   * Function to determine the full output path for the index file.
   * Overrides default path calculation.
   */
  getIndexOutputPath?: (componentName: string, framework: string, projectRoot: string) => string;

  /**
   * Function to generate custom index file content.
   */
  generateIndexContent?: (componentName: string, framework: string) => string;

  /**
   * Enable debug logging.
   * @default false
   */
  debug?: boolean;
}
```

## Output

For a component named `Button`, the plugin generates:

**React** (`packages/react/src/components/Button/index.ts`):
```typescript
export { default } from './Button';
```

**Vue** (`packages/vue/src/components/Button/index.ts`):
```typescript
export { default } from './Button.vue';
```

**Svelte** (`packages/svelte/src/components/Button/index.ts`):
```typescript
export { default } from './Button.svelte';
```

## Subcomponents

Components in `subcomponents/` directories are automatically skipped. These are typically internal components that shouldn't be exported directly.

## Related Plugins

- **[Story Generator](../story-generator/README.md)** - Automatically generates Storybook stories for your components
- **[Rich Types](../rich-types/README.md)** - Adds TypeScript type hints to generated code
- **[Target Files](../target-files/README.md)** - Enables target-specific files using naming conventions

## License

MIT
