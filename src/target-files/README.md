---
title: Target Files Plugin
description: Handle target-specific files using naming conventions
---

# Target Files Plugin


A Mitosis plugin that enables target-specific files using a simple naming convention: `*.[target].*`.

## Problem

When building cross-framework components with Mitosis, you sometimes need target-specific code that can't be handled by Mitosis's standard compilation. For example:

- **Vue Flow** splits components across multiple packages (`@vue-flow/core`, `@vue-flow/background`, `@vue-flow/controls`)
- **React Flow** provides everything from a single package (`reactflow`)
- **Svelte Flow** uses `@xyflow/svelte`

You need a way to provide a shim file for Vue without polluting React and Svelte packages with unused code.

## Solution

This plugin allows you to create target-specific files using the pattern `*.[target].*`:

```
src/adapters/
  flow-shim.vue.ts     → Only kept in packages/vue/
  utils.react.ts       → Only kept in packages/react/
  helpers.svelte.ts    → Only kept in packages/svelte/
  common.ts            → Kept in all targets (normal behavior)
```

The plugin:
1. Uses Mitosis's `build.post` hook with the `files.nonComponentFiles` list
2. Renames files matching the current target (strips `.[target]`)
3. Deletes files matching other targets
4. **No postbuild cleanup script needed!**

## Folder-Level Target Scoping

In addition to file-level targeting, you can scope entire folders using the `(target)` syntax (inspired by Next.js/Nuxt/SvelteKit route groups):

```
src/
  adapters/
    (vue)/              → All contents only in packages/vue/
      flow-shim.ts
      composables.ts
    (react)/            → All contents only in packages/react/
      hooks.ts
    common.ts           → Kept in all targets
```

**How it works:**

During the build process:
- For matching target (e.g., building Vue): `(vue)/` folder is unwrapped, files moved up one level
- For non-matching targets: `(vue)/` folder and all contents are deleted
- The `(target)` wrapper is removed from the final path

**Output for Vue target:**
```
packages/vue/src/adapters/
  flow-shim.ts        ← Unwrapped from (vue)/
  composables.ts      ← Unwrapped from (vue)/
  common.ts           ← Regular file, kept
  # (react)/ folder deleted
```

**Output for React target:**
```
packages/react/src/adapters/
  hooks.ts            ← Unwrapped from (react)/
  common.ts           ← Regular file, kept
  # (vue)/ folder deleted
```

### When to Use Each Approach

**File-level (`file.target.ext`)**: Best for single target-specific files
```
src/adapters/
  flow-shim.vue.ts    ← Single Vue-specific file
```

**Folder-level (`(target)/`)**: Best when you have multiple related target-specific files
```
src/adapters/
  (vue)/              ← Multiple Vue-specific files
    flow-shim.ts
    composables.ts
    vue-utils.ts
```

### Precedence Rules

If a file is inside a `(target)` folder AND has a `.target.` suffix, the **file suffix takes precedence**:

```
src/adapters/
  (vue)/
    helper.react.ts   ← Only kept in React (file suffix wins)
    utils.ts          ← Only kept in Vue (folder scoping)
```

This allows you to create exceptions within target-scoped folders.

## Installation

```bash
bun add mitosis-plugins
```

## Usage

Add `targetFilesPlugin()` to your `mitosis.config.js`:

```javascript
const { targetFilesPlugin } = require('mitosis-plugins');

module.exports = {
  files: 'src/**',
  targets: ['react', 'vue', 'svelte'],
  commonOptions: {
    plugins: [
      targetFilesPlugin({
        allTargets: ['react', 'vue', 'svelte']
      })
    ]
  }
};
```

Create files with the pattern `*.[target].*`:

```typescript
// src/adapters/flow-shim.vue.ts
export { VueFlow as Flow, Panel } from '@vue-flow/core';
export { Background } from '@vue-flow/background';
export { Controls } from '@vue-flow/controls';
```

Build your project:

```bash
npm run build
```

Output:
```
packages/
  react/src/adapters/
    (flow-shim.vue.ts deleted)
  vue/src/adapters/
    flow-shim.ts         ← Renamed from flow-shim.vue.ts
  svelte/src/adapters/
    (flow-shim.vue.ts deleted)
```

## Configuration

```typescript
interface TargetFilesOptions {
  /**
   * List of all target names in your Mitosis config.
   * Required for cleanup of files belonging to other targets.
   */
  allTargets: string[];

  /**
   * Enable debug logging.
   * @default false
   */
  debug?: boolean;
}
```

### Debug Mode

Enable debug logging to see what the plugin is doing:

```javascript
targetFilesPlugin({
  allTargets: ['react', 'vue', 'svelte'],
  debug: true
})
```

Output:
```
[TargetFiles] Renamed: flow-shim.vue.ts → flow-shim.ts
[TargetFiles] Deleted: flow-shim.vue.ts
[TargetFiles] Deleted: flow-shim.vue.ts
```

## How It Works

The plugin uses the `build.post` hook which provides a list of all non-component files that Mitosis has copied to each target package:

```typescript
build: {
  post: (targetContext, files) => {
    // files.nonComponentFiles contains all copied files
    // We filter for *.[target].* patterns and:
    // - Rename files matching current target
    // - Delete files matching other targets
  }
}
```

This approach is efficient because:
- No directory scanning needed
- No separate cleanup script needed
- Uses information Mitosis already provides

## Example: Vue Flow Shim

**Problem:** Vue Flow splits components across packages while React Flow doesn't.

**Solution:** Create a Vue-specific shim:

```typescript
// src/adapters/flow-shim.vue.ts
/**
 * Vue Flow Unified Shim
 *
 * Vue Flow splits components across multiple packages, unlike React Flow.
 * This shim re-exports everything from the correct packages.
 */

// Core components
export { VueFlow as Flow, Panel } from '@vue-flow/core';

// Additional packages
export { Background } from '@vue-flow/background';
export { Controls } from '@vue-flow/controls';

// Re-export all types
export type * from '@vue-flow/core';
```

Then configure your magic imports:

```javascript
// mitosis.config.js
magicImportsPlugin({
  '@myapp/flow': {
    defaultPackage: 'reactflow',
    mapping: {
      react: 'reactflow',
      svelte: '@xyflow/svelte',
      vue: '../adapters/flow-shim'  // Points to your shim!
    }
  }
})
```

**Result:**
- React components import from `reactflow`
- Svelte components import from `@xyflow/svelte`
- Vue components import from `../adapters/flow-shim` (your unified shim)

## Supported Targets

The plugin works with any Mitosis target:
- `react`
- `vue`
- `svelte`
- `angular`
- `solid`
- `qwik`
- And any future targets!

## Best Practices

### 1. Keep target-specific files minimal

Target-specific files indicate framework differences. Try to minimize them:

```typescript
// ✅ Good: Unavoidable framework difference
src/adapters/flow-shim.vue.ts

// ❌ Bad: Logic that should be in Mitosis
src/utils/formatting.react.ts
```

### 2. Document why files are target-specific

```typescript
// src/adapters/flow-shim.vue.ts
/**
 * Vue Flow Unified Shim
 *
 * Why this exists:
 * - Vue Flow splits components across @vue-flow/core, @vue-flow/background, etc.
 * - React Flow provides everything from a single 'reactflow' package
 * - This shim unifies the imports for Vue to match React's interface
 */
```

### 3. Use TypeScript

Target-specific files should be `.ts` or `.tsx` to benefit from type checking:

```typescript
// ✅ Good
flow-shim.vue.ts

// ❌ Avoid
flow-shim.vue.js
```

## Troubleshooting

### Files not being processed

**Check:**
1. Plugin is registered in `mitosis.config.js`
2. `allTargets` includes all your targets
3. Filename matches `*.[target].*` pattern exactly

```javascript
// Enable debug mode to see what's happening:
targetFilesPlugin({
  allTargets: ['react', 'vue', 'svelte'],
  debug: true
})
```

### Import errors in generated code

**Check:**
1. Stripped filename matches your imports
2. Magic imports point to correct path

```typescript
// Source: flow-shim.vue.ts
// Output: flow-shim.ts
// Import: '../adapters/flow-shim' ✅

// NOT: '../adapters/flow-shim.vue' ❌
```

## Related Plugins

- **[Index Generator](../index-generator/README.md)** - Generates index files for cleaner imports
- **[Story Generator](../story-generator/README.md)** - Automatically generates Storybook stories for your components
- **[Rich Types](../rich-types/README.md)** - Adds TypeScript type hints to generated code
- **[CSS Modules](../css-modules/README.md)** - Injects CSS modules into component styles

## License

MIT
