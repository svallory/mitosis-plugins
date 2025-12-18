import { MitosisComponent, MitosisPlugin } from '@builder.io/mitosis';
import { StoryMetadata, StoryGeneratorOptions } from './types';
import { generateStoryFile, writeStoryFile } from './generator';

/**
 * Story generator plugin for Mitosis.
 * Generates framework-specific Storybook stories based on component metadata.
 *
 * @param options - Plugin configuration options
 * @returns Mitosis plugin factory
 *
 * @example
 * ```js
 * import storyGeneratorPlugin from './story-generator';
 *
 * export default {
 *   targets: ['react', 'vue', 'svelte'],
 *   plugins: [
 *     storyGeneratorPlugin({
 *       storyTemplates: {
 *         react: './custom-templates/react.hbs'
 *       }
 *     })
 *   ]
 * };
 * ```
 */
export function storyGeneratorPlugin(options: StoryGeneratorOptions = {}): MitosisPlugin {
    return () => ({
        name: 'story-generator',
        json: {
            post: (json: MitosisComponent) => {
                const framework = json.pluginData?.target;
                if (!framework) return json;

                const metadata = json.meta?.useMetadata?.['storybook'] as StoryMetadata | undefined;

                // Skip if storybook disabled or no metadata
                if (!metadata || metadata.enabled === false) {
                    return json;
                }

                // Skip subcomponents (components in subdirectories)
                // These are not meant to have standalone stories
                if (json.pluginData?.path?.includes('subcomponents')) {
                    return json;
                }

                try {
                    // Generate story file content
                    const storyContent = generateStoryFile(json, metadata, framework, options);

                    // Write story file to appropriate location
                    writeStoryFile(json.name, framework, storyContent, options);
                } catch (error) {
                    console.error(`[StoryGenerator] ❌ Failed to generate story for ${json.name}:`, error);
                }

                return json;
            }
        }
    });
}
