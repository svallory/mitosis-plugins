---
title: CSS Modules Plugin
description: Inject CSS from .module.css files into Mitosis components
---

# CSS Modules Plugin for Mitosis


A Mitosis plugin that reads CSS from `.module.css` files and injects it into the component's `json.style`, enabling CSS to be processed by Mitosis's built-in style handling.

## Features

- ✅ Reads CSS from `.module.css` files alongside components
- ✅ Injects CSS into `json.style` (like `useStyle` does)
- ✅ Works with all Mitosis targets (React, Vue, Svelte, Solid)
- ✅ Respects target's `stylesType` configuration
- ✅ Supports caching for better performance
- ✅ Debug mode for development

## How It Works

1. **Find CSS Module**: Looks for a `.module.css` file alongside each Mitosis component (e.g., `Button.module.css` next to `Button.lite.tsx`)
2. **Read CSS**: Reads the CSS content from the file
3. **Inject into json.style**: Injects the CSS into the component's `json.style` property (exactly like `useStyle` does)
4. **Mitosis handles output**: Mitosis's built-in style handling generates framework-specific output based on `stylesType` configuration

## Installation

```bash
bun add mitosis-plugins
```

## Usage

Add the plugin to your `mitosis.config.cjs`:

```javascript
const { cssModulesPlugin } = require('mitosis-plugins');

module.exports = {
  targets: ['react', 'vue', 'svelte'],
  options: {
    react: {
      stylesType: 'style-tag', // Mitosis will generate <style> tags
      plugins: [
        cssModulesPlugin()
      ]
    },
    vue: {
      plugins: [
        cssModulesPlugin()
      ]
    },
    svelte: {
      plugins: [
        cssModulesPlugin()
      ]
    }
  }
};
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable the plugin |
| `targets` | `string[]` | `undefined` | Only apply to specific targets |
| `debug` | `boolean` | `false` | Enable debug logging |
| `fileExtension` | `string` | `'.module.css'` | File extension to look for |

## Example

### File Structure

```
src/components/Button/
  Button.lite.tsx      # Mitosis component
  Button.module.css    # CSS module (read by plugin)
```

### Input: Button.lite.tsx

```tsx
export default function Button(props: { label: string }) {
  return <button className="button">{props.label}</button>;
}
```

### Input: Button.module.css

```css
.button {
  background: blue;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
}

.button:hover {
  background: darkblue;
}
```

### Output: React (with stylesType: 'style-tag')

```jsx
export default function Button(props) {
  return (
    <>
      <button className="button">{props.label}</button>
      <style>{`
        .button {
          background: blue;
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
        }

        .button:hover {
          background: darkblue;
        }
      `}</style>
    </>
  );
}
```

### Output: Svelte

```svelte
<script lang="ts">
  export let label: string;
</script>

<button class="button">{label}</button>

<style>
  .button {
    background: blue;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
  }

  .button:hover {
    background: darkblue;
  }
</style>
```

### Output: Vue

```vue
<template>
  <button class="button">{{ label }}</button>
</template>

<script setup lang="ts">
const props = defineProps<{ label: string }>();
</script>

<style scoped>
.button {
  background: blue;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
}

.button:hover {
  background: darkblue;
}
</style>
```

## Debug Mode

Enable debug mode to see detailed logs:

```bash
DEBUG_MITOSIS_CSS_MODULES=true bun run build
```

Debug output includes:
- Component paths being processed
- CSS module file paths being searched
- Bytes read from CSS files
- Injection confirmations

## Framework Compatibility

The plugin works with all Mitosis targets. The output format depends on the target's `stylesType` configuration:

- **React**: `<style>` tags or CSS-in-JS based on `stylesType`
- **Vue**: `<style scoped>` blocks
- **Svelte**: `<style>` blocks (auto-scoped by Svelte)
- **Solid**: `<style>` tags based on `stylesType`

## Combining with useStyle

The plugin appends CSS to any existing `json.style` content, so it works alongside `useStyle`:

```tsx
import { useStyle } from '@builder.io/mitosis';

export default function Button(props) {
  // Additional styles via useStyle
  useStyle(`
    .button-extra {
      margin: 10px;
    }
  `);

  // Button.module.css styles will be appended
  return <button className="button button-extra">{props.label}</button>;
}
```

## Notes

- The plugin runs in the `json.pre` hook, before Mitosis processes styles
- CSS is read once and cached for better performance across multiple targets
- If no `.module.css` file exists, the component is passed through unchanged
- The plugin does NOT scope class names - it simply injects CSS for Mitosis to handle

## Related Plugins

- **[Index Generator](../index-generator/README.md)** - Generates index files for cleaner imports
- **[Story Generator](../story-generator/README.md)** - Automatically generates Storybook stories for your components
- **[Rich Types](../rich-types/README.md)** - Adds TypeScript type hints to generated code
- **[Target Files](../target-files/README.md)** - Enables target-specific files using naming conventions

## License

MIT
