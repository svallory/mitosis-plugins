<div align="center">
  <h1>starlight-theme-opendocs 🌈</h1>
  <p>A modern, vibrant Starlight theme for the OpenDocs brand.</p>
</div>

## Features

- **🌈 Vibrant Palette**: Built around the OpenDocs brand colors (Purple, Fuchsia, Yellow, Green).
- **📖 Readable Typography**: Optimized for long-form documentation using Bricolage Grotesque and Inter.
- **✨ Modern UI**: Inspired by shadcn/ui and Base UI with soft shadows and rounded corners.
- **🌓 Adaptive**: Seamless light and dark mode support.

## Getting Started

1. Install the theme in your Starlight project:

```bash
npm install starlight-theme-opendocs
```

2. Add the plugin to your `astro.config.mjs`:

```javascript
import starlight from '@astrojs/starlight';
import starlightThemeOpenDocs from 'starlight-theme-opendocs';

export default defineConfig({
  integrations: [
    starlight({
      plugins: [starlightThemeOpenDocs()],
    }),
  ],
});
```

## License

Licensed under the MIT License.
