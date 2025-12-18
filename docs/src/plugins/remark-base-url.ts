import { visit } from 'unist-util-visit';
import type { Root, Link, Image } from 'mdast';
import type { VFile } from 'vfile';

interface RemarkBaseUrlOptions {
    /**
     * The base URL to prepend to root-relative links.
     * Usually taken from Astro's `config.base`.
     */
    base?: string;
}

/**
 * Remark plugin to automatically prepend the Astro base URL to root-relative links in Markdown/MDX.
 *
 * ### Why?
 * Astro's `base` path configuration affects compiled assets but doesn't automatically rewrite
 * links inside Markdown content. This plugin ensures that links like `[Label](/guides/...)`
 * work correctly even when your site is served from a subpath (e.g., GitHub Pages).
 *
 * ### Integration in Astro
 * This plugin is integrated in `astro.config.ts` within the `markdown.remarkPlugins` array:
 * ```js
 * const base = '/my-subpath';
 * export default defineConfig({
 *   base,
 *   markdown: {
 *     remarkPlugins: [[remarkBaseUrl, { base }]],
 *   }
 * });
 * ```
 */
export function remarkBaseUrl(options: RemarkBaseUrlOptions) {
    const { base } = options;
    if (!base || base === '/') return () => { };
    const normalizedBase = base.replace(/\/$/, '');

    return (tree: Root, file: VFile) => {
        // 1. Process standard Markdown links and images
        visit(tree, 'link', (node: Link) => {
            if (node.url && node.url.startsWith('/') && !node.url.startsWith('//')) {
                node.url = `${normalizedBase}${node.url}`;
            }
        });

        visit(tree, 'image', (node: Image) => {
            if (node.url && node.url.startsWith('/') && !node.url.startsWith('//')) {
                node.url = `${normalizedBase}${node.url}`;
            }
        });

        // 2. Process Starlight hero actions in frontmatter
        // This handles the 'link' property in the 'hero' section of Starlight page frontmatter
        const frontmatter = (file.data as any).astro?.frontmatter;
        if (frontmatter?.hero?.actions) {
            frontmatter.hero.actions.forEach((action: { link?: string }) => {
                if (action.link && action.link.startsWith('/') && !action.link.startsWith('//')) {
                    action.link = `${normalizedBase}${action.link}`;
                }
            });
        }
    };
}
