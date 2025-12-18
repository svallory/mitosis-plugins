# Starlight Documentation Template

A reusable Astro and Starlight documentation template for GitHub.

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

## 🚀 Features

- **Starlight + Astro**: Fast, accessible, and easy to maintain.
- **Built-in Components**: Includes `TeamMemberCard` (Astro) and `JsonSchemaViewer` (React).
- **Modular Middleware**: Organized middleware features for serving JSON schemas and other headers.
- **Auto-prefixing Base Path**: Custom Remark plugin to automatically handle links when deploying to subpaths (like GitHub Pages).
- **LLM Ready**: Pre-configured `starlight-llms-txt` for AI-friendly documentation.
- **Link Validation**: `starlight-links-validator` included to prevent broken links.

## 📁 Project Structure

```
.
├── src/
│   ├── assets/             # Images and local assets
│   ├── components/         # Custom Astro & React components
│   ├── content/
│   │   ├── docs/          # MD/MDX documentation files
│   ├── middleware/        # Modular middleware features
│   ├── plugins/           # Custom Remark/Rehype plugins
│   └── middleware.ts      # Main middleware entrypoint
├── astro.config.mjs        # Site configuration
├── package.json
└── tsconfig.json
```

## 🛠 Usage

1. **Click "Use this template"** on GitHub to create your own repository.
2. **Install dependencies**: `npm install`
3. **Configure your site**: Update `site`, `title`, and `description` in `astro.config.mjs`.
4. **Add content**: Create `.md` or `.mdx` files in `src/content/docs/`.

## 🧞 Middleware

This template uses a modular middleware structure. You can find the features in `src/middleware/features/`.

- **Schema Headers**: Automatically serves `.schema.json` files with `application/schema+json` and CORS headers.

To add new middleware, create a new file in `src/middleware/` and add it to the `sequence` in `src/middleware.ts`.

## ⚡️ Auto-prefixing Base Path

When deploying to a subpath (e.g., `https://user.github.io/repo/`), normal root-relative links in Markdown like `[Home](/)` often break.

This template includes a **Remark plugin** (`src/plugins/remark-base-url.ts`) that automatically prepends your Astro `base` path to any root-relative link or image inside your Markdown/MDX content. You can write your content as if it's on the root, and it will "just work" everywhere.

## 🧞 Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local dev server at `localhost:4321` |
| `npm run build` | Build your production site to `./dist/` |
| `npm run preview` | Preview your build locally |
| `npm run astro ...` | Run Astro CLI commands |

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
