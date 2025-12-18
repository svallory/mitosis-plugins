/**
 * @packageDocumentation
 * Mitosis Plugins - A collection of plugins for Mitosis to enhance cross-framework component development.
 *
 * @example
 * ```ts
 * import {
 *   magicImportsPlugin,
 *   indexGeneratorPlugin,
 *   storyGeneratorPlugin,
 *   richTypesPlugin,
 *   targetFilesPlugin
 * } from 'mitosis-plugins';
 *
 * export default {
 *   targets: ['react', 'vue', 'svelte'],
 *   options: {
 *     react: {
 *       plugins: [
 *         magicImportsPlugin({ ... }),
 *         indexGeneratorPlugin(),
 *         storyGeneratorPlugin(),
 *         richTypesPlugin(),
 *         targetFilesPlugin()
 *       ]
 *     }
 *   }
 * };
 * ```
 */

export * from './css-modules';
export * from './index-generator';
export * from './magic-imports';
export * from './story-generator';
export * from './target-files';
export * from './rich-types';