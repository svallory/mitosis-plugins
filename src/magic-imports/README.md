---
title: Magic Imports Plugin
description: Enable virtual imports with framework-specific mappings for Mitosis
---

# Magic Imports Plugin

A Mitosis plugin that enables **virtual imports** with framework-specific mappings, symbol renaming, and automatic import splitting.


## Installation

```bash
bun add mitosis-plugins
```

## Features

- **Framework-specific imports** - Map virtual imports to different packages per target framework
- **Symbol renaming** - Rename imports to match framework conventions (e.g., `Flow` → `ReactFlow as Flow`)
- **Auto-splitting** - Automatically split imports across multiple packages
- **Type safety** - Generates ambient TypeScript declarations for IDE support
- **Catch-all routing** - Use `'*'` to handle unmapped symbols

## Quick Start

```javascript
const { magicImportsPlugin } = require('@opendocs/mitosis-plugins');

module.exports = {
  plugins: [
    magicImportsPlugin({
      shimOutputFile: 'src/typings/magic-imports.d.ts',
      modules: {
        'lucide': {
          shim: 'lucide-react',
          targets: {
            react: 'lucide-react',
            svelte: 'lucide-svelte',
            vue: 'lucide-vue-next'
          }
        }
      }
    })
  ]
};
```

**Source code:**
```typescript
import { Home, Settings } from 'virtual:lucide';
```

**Generated output:**
- React: `import { Home, Settings } from 'lucide-react';`
- Svelte: `import { Home, Settings } from 'lucide-svelte';`
- Vue: `import { Home, Settings } from 'lucide-vue-next';`

## Configuration

### Plugin Options

```typescript
interface MagicImportsPluginOptions {
  /** Path to write type declarations, or false to disable */
  shimOutputFile?: string | false;  // default: 'src/typings/magic-imports.d.ts'

  /** Virtual module configurations */
  modules: Record<string, ModuleConfig>;
}
```

### Module Configuration

```typescript
interface ModuleConfig {
  /** Shim configuration for type declarations */
  shim?: ShimConfig;

  /** Target-specific import mappings */
  targets: Record<string, TargetConfig>;
}
```

### Target Configuration

Two styles are supported:

#### 1. Simple String (All symbols from one module)

```javascript
targets: {
  react: 'lucide-react',
  vue: 'lucide-vue-next'
}
```

#### 2. Object with Symbol Mapping

```javascript
targets: {
  vue: {
    // localName -> where it comes from
    Flow: { from: '@vue-flow/core', symbol: 'VueFlow' },
    Background: '@vue-flow/background',
    Controls: '@vue-flow/controls',
    '*': '@vue-flow/core'  // catch-all for unmapped symbols
  }
}
```

## Use Cases

### Use Case 1: Simple Module Replacement

Replace a virtual import with framework-specific packages:

```javascript
'lucide': {
  shim: 'lucide-react',
  targets: {
    react: 'lucide-react',
    svelte: 'lucide-svelte',
    vue: 'lucide-vue-next'
  }
}
```

**Source:** `import { Home } from 'virtual:lucide';`

**Output:**
- React: `import { Home } from 'lucide-react';`
- Svelte: `import { Home } from 'lucide-svelte';`
- Vue: `import { Home } from 'lucide-vue-next';`

### Use Case 2: Symbol Renaming

Rename framework-specific components while keeping source API unchanged:

```javascript
'flow': {
  shim: {
    '@xyflow/react': {
      reexportAll: true,
      aliases: { Flow: 'ReactFlow' }
    }
  },
  targets: {
    react: {
      Flow: { from: '@xyflow/react', symbol: 'ReactFlow' },
      '*': '@xyflow/react'
    },
    svelte: {
      Flow: { from: '@xyflow/svelte', symbol: 'SvelteFlow' },
      '*': '@xyflow/svelte'
    }
  }
}
```

**Source:** `import { Flow, Background } from 'virtual:flow';`

**Output:**
- React: `import { ReactFlow as Flow, Background } from '@xyflow/react';`
- Svelte: `import { SvelteFlow as Flow, Background } from '@xyflow/svelte';`

### Use Case 3: Auto-Splitting (Multi-Package)

Automatically split imports across multiple packages:

```javascript
'flow': {
  shim: {
    '@vue-flow/core': '*',
    '@vue-flow/background': '*',
    '@vue-flow/controls': '*'
  },
  targets: {
    vue: {
      Flow: { from: '@vue-flow/core', symbol: 'VueFlow' },
      Handle: '@vue-flow/core',
      Position: '@vue-flow/core',
      Background: '@vue-flow/background',
      Controls: '@vue-flow/controls',
      '*': '@vue-flow/core'
    }
  }
}
```

**Source:**
```typescript
import { Flow, Handle, Background, Controls } from 'virtual:flow';
```

**Generated Vue output:**
```typescript
import { VueFlow as Flow, Handle } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
```

## Shim Configuration

The `shim` property controls type declaration generation:

### Simple String

```javascript
shim: 'lucide-react'
// generates: export * from "lucide-react";
```

### Per-Package Configuration

```javascript
shim: {
  '@xyflow/react': {
    reexportAll: true,
    aliases: {
      Flow: 'ReactFlow',
      useFlow: 'useReactFlow'
    }
  },
  '@xyflow/background': '*'  // shorthand for { reexportAll: true }
}
// generates:
// export { ReactFlow as Flow } from "@xyflow/react";
// export { useReactFlow as useFlow } from "@xyflow/react";
// export * from "@xyflow/react";
// export * from "@xyflow/background";
```

## Symbol Mapping

### SymbolSource Object

```typescript
interface SymbolSource {
  /** Target module to import from */
  from: string;
  /** Symbol name in the target module (for renaming) */
  symbol?: string;
}
```

### Mapping Shorthand

```javascript
// Shorthand - just the module
Background: '@vue-flow/background'

// Equivalent to:
Background: { from: '@vue-flow/background' }
```

### With Renaming

```javascript
// Full form with renaming
Flow: { from: '@vue-flow/core', symbol: 'VueFlow' }

// Source: import { Flow } from 'virtual:flow'
// Output: import { VueFlow as Flow } from '@vue-flow/core'
```

## Catch-All Routing

Use `'*'` to handle symbols not explicitly mapped:

```javascript
targets: {
  vue: {
    Flow: { from: '@vue-flow/core', symbol: 'VueFlow' },
    Background: '@vue-flow/background',
    '*': '@vue-flow/core'  // Everything else from core
  }
}
```

When a symbol like `Handle` is imported but not explicitly mapped, it falls back to `@vue-flow/core`.

## API Reference

### Plugin Options

```typescript
interface MagicImportsPluginOptions {
  shimOutputFile?: string | false;
  modules: Record<string, ModuleConfig>;
}
```

### Module Config

```typescript
interface ModuleConfig {
  shim?: ShimConfig;
  targets: Partial<Record<Targets, TargetConfig>>;
}
```

### Target Config

```typescript
type TargetConfig =
  | string  // all symbols from this module
  | Record<string, string | SymbolSource>;  // symbol map with '*' catch-all
```

### Shim Config

```typescript
type ShimConfig =
  | string  // export * from this package
  | Record<string, '*' | ShimPackageConfig>;

interface ShimPackageConfig {
  reexportAll?: boolean;
  aliases?: Record<string, string>;  // localName -> exportedName
}
```

### Symbol Source

```typescript
interface SymbolSource {
  from: string;
  symbol?: string;
}
```

## Troubleshooting

### Virtual imports not transforming

1. Check that the virtual module name is prefixed with `virtual:` in source code
2. Verify the plugin is registered in `mitosis.config.cjs`
3. Ensure the target framework has a mapping configured

### TypeScript errors on virtual imports

1. Verify shim file is generated (check plugin console output)
2. Ensure the shim file is included in `tsconfig.json`:
   ```json
   {
     "include": ["src", "src/typings/magic-imports.d.ts"]
   }
   ```
3. Check that `shim` is specified in module config

### Symbol not found warnings

Add missing symbols to the target config, or use `'*'` catch-all:

```javascript
targets: {
  vue: {
    MissingSymbol: '@some-package',
    // or use catch-all
    '*': '@default-package'
  }
}
```

## Related Plugins

- **[Target Files](../target-files/README.md)** - Use together when you need framework-specific files for your virtual imports
- **[Rich Types](../rich-types/README.md)** - Combine for better TypeScript support with complex import mappings

## License

MIT
