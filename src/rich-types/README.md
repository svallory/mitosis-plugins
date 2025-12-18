---
title: Rich Types Plugin
description: Fix TypeScript type inference issues in Mitosis generated code
---

# Rich Types Plugin


Add TypeScript type hints to generated code that Mitosis doesn't infer automatically.

## Problem

Mitosis generates code that sometimes lacks proper TypeScript types:

```typescript
// Generated code with missing type
const [selectedItem, setSelectedItem] = useState(() => null);
// Error: Argument of type 'null' is not assignable to parameter of type 'never'

// What we need
const [selectedItem, setSelectedItem] = useState<Item | null>(() => null);
```

## Solution

This plugin applies configurable type fixes to the generated code:

```javascript
richTypesPlugin({
  react: {
    useStateTypes: {
      'selectedItem': 'Item | null'
    }
  }
})
```

## Installation

```bash
bun add mitosis-plugins
```

## Usage

### Basic Setup (React)

```javascript
const { richTypesPlugin } = require('mitosis-plugins');

module.exports = {
  options: {
    react: {
      plugins: [
        richTypesPlugin({
          react: {
            // Default type for useState with null initializer
            useStateDefaultType: 'string | null'
          }
        })
      ]
    }
  }
};
```

### Specific Type Mappings

Map specific state variable names to their types:

```javascript
richTypesPlugin({
  react: {
    useStateTypes: {
      'selectedItem': 'Item | null',
      'currentUser': 'User | null',
      'activeTab': 'TabId',
      'formData': 'FormState | null'
    }
  }
})
```

### Dynamic Component Types

Fix type errors for dynamic component references:

```javascript
richTypesPlugin({
  react: {
    componentTypeHint: 'React.ComponentType<any>',
    componentRefPattern: /Ref$/  // Matches variables ending in "Ref"
  }
})
```

This transforms:
```typescript
const IconRef = getIcon();  // Error: Type unknown
```

To:
```typescript
const IconRef = getIcon() as React.ComponentType<any>;
```

### Custom Patterns

For any framework, apply regex-based transformations:

```javascript
richTypesPlugin({
  patterns: [
    {
      pattern: /const (\w+) = ref\(null\)/g,
      replacement: 'const $1 = ref<string | null>(null)',
      description: 'Add type to Vue ref with null'
    },
    {
      pattern: /let (\w+): any = \$state\(null\)/g,
      replacement: 'let $1: string | null = $state(null)',
      description: 'Add type to Svelte 5 state'
    }
  ]
})
```

## Configuration Options

```typescript
interface RichTypesOptions {
  /**
   * Enable/disable the plugin.
   * @default true
   */
  enabled?: boolean;

  /**
   * Only apply to specific targets.
   * @default undefined (all targets)
   */
  targets?: string[];

  /**
   * Enable debug logging.
   * @default false
   */
  debug?: boolean;

  /**
   * Custom type fix patterns.
   */
  patterns?: TypeFixPattern[];

  /**
   * React-specific options.
   */
  react?: {
    /**
     * Type hint for dynamic components.
     * @default "React.ComponentType<any>"
     */
    componentTypeHint?: string;

    /**
     * Enable useState type inference fix.
     * @default true
     */
    useStateTypeFix?: boolean;

    /**
     * Default type for useState with null.
     * @default "string | null"
     */
    useStateDefaultType?: string;

    /**
     * Map variable names to types.
     */
    useStateTypes?: Record<string, string>;

    /**
     * Enable component ref type cast fix.
     * @default true
     */
    componentRefTypeFix?: boolean;

    /**
     * Pattern to match component ref names.
     * @default /Ref$/
     */
    componentRefPattern?: RegExp;
  };
}

interface TypeFixPattern {
  /**
   * Regex pattern to match.
   */
  pattern: RegExp;

  /**
   * Replacement string or function.
   */
  replacement: string | ((...args: string[]) => string);

  /**
   * Description for debugging.
   */
  description?: string;
}
```

## Built-in Fixes (React)

### 1. useState with null initializer

**Before:**
```typescript
const [value, setValue] = useState(() => null);
```

**After:**
```typescript
const [value, setValue] = useState<string | null>(() => null);
```

### 2. Dynamic component refs

**Before:**
```typescript
const IconRef = getIcon();
```

**After:**
```typescript
const IconRef = getIcon() as React.ComponentType<any>;
```

## Debugging

Enable debug mode to see what transformations are applied:

```javascript
richTypesPlugin({
  debug: true,
  react: {
    useStateTypes: { 'selectedItem': 'Item | null' }
  }
})
```

Output:
```
[RichTypes] Applied 2 type fix(es) to MyComponent (react)
```

## Best Practices

1. **Be specific with type mappings** - Use `useStateTypes` for known variable names rather than relying on the default type.

2. **Document your patterns** - Add descriptions to custom patterns for maintainability.

3. **Test generated code** - Run `tsc --noEmit` on generated packages to verify types are correct.

4. **Keep patterns simple** - Complex regex patterns are hard to maintain. Prefer multiple simple patterns.

## Related Plugins

- **[Index Generator](../index-generator/README.md)** - Generates index files for cleaner imports
- **[Story Generator](../story-generator/README.md)** - Automatically generates Storybook stories for your components
- **[Target Files](../target-files/README.md)** - Enables target-specific files using naming conventions
- **[CSS Modules](../css-modules/README.md)** - Injects CSS modules into component styles

## License

MIT
