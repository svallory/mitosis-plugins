---
title: Story Generator Plugin
description: Auto-generate Storybook stories from Mitosis components
---

# Mitosis Story Generator Plugin


Automatically generates framework-specific Storybook stories from Mitosis components using customizable Handlebars templates.

## Features

- ✨ **Automatic story generation** - Creates Storybook stories during Mitosis compilation
- 🎨 **Template-based** - Uses Handlebars templates for full customization
- 🔧 **Framework support** - Built-in templates for React, Vue, and Svelte
- 🎯 **Custom templates** - Override default templates or add new frameworks
- 📦 **Zero config** - Works out of the box with sensible defaults

## Installation

```bash
bun add mitosis-plugins
```

The plugin requires Handlebars as a peer dependency:

```bash
bun add handlebars
```

## Usage

### Basic Setup

Add the plugin to your `mitosis.config.cjs`:

```js
const { storyGeneratorPlugin } = require('mitosis-plugins');

module.exports = {
  targets: ['react', 'vue', 'svelte'],
  options: {
    react: {
      plugins: [storyGeneratorPlugin()]
    },
    vue: {
      plugins: [storyGeneratorPlugin()]
    },
    svelte: {
      plugins: [storyGeneratorPlugin()]
    }
  }
};
```

### Component Metadata

Add Storybook metadata to your Mitosis components:

```tsx
import { useMetadata } from '@builder.io/mitosis';

useMetadata({
  storybook: {
    enabled: true,
    title: 'Components/MyComponent',
    defaultStory: {
      args: {
        title: 'Hello World',
        variant: 'primary',
      },
    },
    stories: [
      {
        name: 'Secondary',
        description: 'Component with secondary variant',
        args: {
          title: 'Secondary Example',
          variant: 'secondary',
        },
      },
    ],
    argTypes: {
      variant: {
        control: 'select',
        options: ['primary', 'secondary'],
      },
    },
    parameters: {
      layout: 'centered',
    },
    tags: ['autodocs'],
  },
});
```

### Custom Component Paths

Configure custom component path resolution:

```js
storyGeneratorPlugin({
  getComponentPath: (name, componentJson) => {
    if (name.startsWith('Form')) return 'components/forms';
    if (name.startsWith('Layout')) return 'components/layouts';
    return 'components';
  }
})
```

### Custom Output Paths

Override where story files are written:

```js
const path = require('path');

storyGeneratorPlugin({
  getStoryOutputPath: (name, framework, projectRoot) => {
    return path.join(projectRoot, 'src', 'stories', `${name}.stories.tsx`);
  }
})
```

### Custom Templates

Override default templates or add support for new frameworks:

```js
storyGeneratorPlugin({
  storyTemplates: {
    react: './custom-templates/react.hbs',
    angular: './custom-templates/angular.hbs',
  },
})
```

## Template Variables

Your custom Handlebars templates have access to these variables:

| Variable        | Type                  | Description                           |
| --------------- | --------------------- | ------------------------------------- |
| `componentName` | `string`              | Name of the component                 |
| `componentPath` | `string`              | Relative path to component            |
| `title`         | `string`              | Storybook story title                 |
| `defaultArgs`   | `string`              | JSON string of default args           |
| `stories`       | `Array<Story>`        | Additional story configurations       |
| `argTypes`      | `object \| null`      | Storybook argTypes configuration      |
| `parameters`    | `object`              | Storybook parameters                  |
| `tags`          | `string[]`            | Storybook tags                        |
| `imports`       | `string[]`            | Import statements for external values |

### Story Object

Each story in the `stories` array has:

| Property      | Type              | Description                 |
| ------------- | ----------------- | --------------------------- |
| `name`        | `string`          | Story name (export name)    |
| `args`        | `string`          | JSON string of story args   |
| `description` | `string \| null`  | Story description (JSDoc)   |
| `parameters`  | `object \| null`  | Story-specific parameters   |

## Helpers

### `json` Helper

The `json` helper formats objects as JSON:

```handlebars
parameters: {{{json parameters}}},
```

## Built-in Templates

The plugin includes templates for:

- **React** (`templates/react.hbs`) - TypeScript with `satisfies Meta<typeof Component>`
- **Vue** (`templates/vue.hbs`) - Vue 3 with `satisfies Meta<typeof Component>`
- **Svelte** (`templates/svelte.hbs`) - Svelte with `@ts-nocheck` for .svelte imports

## Metadata Reference

### `StoryMetadata` Interface

```typescript
interface StoryMetadata {
  /** Enable/disable story generation (default: true) */
  enabled?: boolean;

  /** Storybook title (default: "Components/{ComponentName}") */
  title?: string;

  /** Default story configuration */
  defaultStory?: {
    args?: Record<string, any>;
  };

  /** Additional named stories */
  stories?: Array<{
    name: string;
    args?: Record<string, any>;
    description?: string;
    parameters?: any;
  }>;

  /** Storybook argTypes */
  argTypes?: Record<string, any>;

  /** Storybook parameters */
  parameters?: any;

  /** Storybook tags (default: ["autodocs"]) */
  tags?: string[];
}
```

## Advanced Usage

### Importing External Args

Reference external argument definitions:

```tsx
useMetadata({
  storybook: {
    defaultStory: {
      args: {
        import: '../../shared/story-data/args',
        value: 'myComponentArgs.default',
      },
    },
  },
});
```

This generates:

```typescript
import { myComponentArgs } from '../../shared/story-data/args';

export const Default: Story = {
  args: myComponentArgs.default,
};
```

### Disabling Story Generation

Skip story generation for specific components:

```tsx
useMetadata({
  storybook: {
    enabled: false,
  },
});
```

### Subcomponents

Components in `subcomponents/` directories are automatically skipped.

## Output

By default, stories are generated in:

```
packages/
  react/stories/{ComponentName}.stories.tsx
  vue/stories/{ComponentName}.stories.ts
  svelte/stories/{ComponentName}.stories.ts
```

## Example Template

Here's a minimal custom template:

```handlebars
import type { Meta, StoryObj } from '@storybook/react';
import {{componentName}} from '../src/{{componentPath}}/{{componentName}}';

const meta: Meta<typeof {{componentName}}> = {
  title: '{{title}}',
  component: {{componentName}},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {{{defaultArgs}}},
};
```

## Troubleshooting

### Template Not Found

Ensure custom template paths are relative to `mitosis.config.cjs` or use absolute paths.

### Import Path Issues

The plugin uses relative imports (`../src/...`). Verify your component directory structure matches the generated paths, or provide a custom `getComponentPath` function.

### TypeScript Errors

For Vue/Svelte, the plugin adds `@ts-nocheck` or uses `satisfies` to handle framework-specific type issues.

## Related Plugins

- **[Index Generator](../index-generator/README.md)** - Generates index files for cleaner imports
- **[Rich Types](../rich-types/README.md)** - Adds TypeScript type hints to generated code
- **[Target Files](../target-files/README.md)** - Enables target-specific files using naming conventions
- **[CSS Modules](../css-modules/README.md)** - Injects CSS modules into component styles

## License

MIT
