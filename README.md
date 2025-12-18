---
title: Mitosis Plugins Overview
description: Complete overview of mitosis-plugins with quick start guide and plugin descriptions
---

# Overview

A collection of plugins for [Mitosis](https://mitosis.builder.io/) to enhance cross-framework component development.

## Installation

```bash
bun add mitosis-plugins
```

## Documentation Map

```
Quick Start → Plugin Summaries → Plugin Details
```

1. **Quick Start** - Get started with a minimal configuration
2. **Plugin Summaries** - Understand what each plugin does
3. **Plugin Details** - Deep dive into configuration options and advanced usage

## Quick Start

Create a `mitosis.config.cjs` with this minimal configuration:

```javascript
const {
  magicImportsPlugin,
  indexGeneratorPlugin,
  storyGeneratorPlugin,
  richTypesPlugin,
  targetFilesPlugin,
  cssModulesPlugin
} = require('mitosis-plugins');

module.exports = {
  files: 'src/**/*.lite.tsx',
  targets: ['react', 'vue', 'svelte'],
  commonOptions: {
    // Plugins applied to all targets
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
        },
        ambientTypesPath: 'src/ambient.d.ts'
      }),
      targetFilesPlugin({
        allTargets: ['react', 'vue', 'svelte']
      })
    ]
  },
  options: {
    react: {
      plugins: [
        indexGeneratorPlugin(),
        storyGeneratorPlugin(),
        richTypesPlugin({
          react: { useStateDefaultType: 'string | null' }
        })
      ]
    },
    vue: {
      plugins: [
        indexGeneratorPlugin(),
        storyGeneratorPlugin()
      ]
    },
    svelte: {
      plugins: [
        indexGeneratorPlugin(),
        storyGeneratorPlugin()
      ]
    }
  }
};
```

## Plugins

| Plugin | Description |
|--------|-------------|
| [`magicImportsPlugin`](#magic-imports) | Replace virtual imports with framework-specific packages |
| [`indexGeneratorPlugin`](#index-generator) | Generate index.ts files for folder-based imports |
| [`storyGeneratorPlugin`](#story-generator) | Auto-generate Storybook stories from components |
| [`richTypesPlugin`](#rich-types) | Fix TypeScript type inference issues |
| [`targetFilesPlugin`](#target-files) | Copy target-specific files using naming convention |
| [`cssModulesPlugin`](#css-modules) | Inject CSS from `.module.css` files into components |

## Plugin Summaries

### Magic Imports

Replace virtual imports with framework-specific packages. Perfect for libraries that have different package names per framework (e.g., `lucide-react` vs `lucide-vue-next`).

**When to use:**
- You need the same functionality from different packages in each framework
- Frameworks use different component names (ReactFlow vs VueFlow)
- You want to maintain a single import statement in source code



### Index Generator

Generates `index.ts` files for each component to support clean imports like `import Button from './components/Button'` instead of `./components/Button/Button`.

**When to use:**
- You want clean, concise import paths
- You're organizing components into subdirectories
- You're building a component library



### Story Generator

Automatically generates framework-specific Storybook stories from component metadata using customizable templates.

**When to use:**
- You want to document components with interactive examples
- You need framework-specific Storybook stories
- You want to maintain story configuration alongside component code



### Rich Types

Adds TypeScript type hints to fix common Mitosis type inference issues, especially with `useState` and dynamic components.

**When to use:**
- Mitosis generates code with TypeScript errors
- Dynamic component references need type casts
- Generated code lacks proper type annotations



### Target Files

Enables target-specific files using `*.[target].*` naming convention. Perfect for framework-specific code that can't be handled by Mitosis compilation.

**When to use:**
- A library has different package structures between frameworks
- You need framework-specific utility functions
- You want to avoid bundling unused code



### CSS Modules

Reads CSS from `.module.css` files and injects into components, enabling better IDE support and cleaner component files.

**When to use:**
- You prefer CSS in separate files rather than inline `useStyle`
- You want better IDE support for CSS editing
- You're migrating existing CSS Modules to Mitosis



## API Reference

All plugins export their configuration types:

```typescript
import type {
  MagicImportsOptions,
  IndexGeneratorOptions,
  StoryGeneratorOptions,
  RichTypesOptions,
  TargetFilesOptions,
  CssModulesPluginOptions
} from 'mitosis-plugins';
```

See individual plugin documentation for detailed API references.

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) first.

## License

MIT