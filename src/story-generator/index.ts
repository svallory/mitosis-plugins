/**
 * @packageDocumentation
 * Mitosis Story Generator Plugin
 *
 * Automatically generates framework-specific Storybook stories from Mitosis components.
 * Supports React, Vue, and Svelte with customizable Handlebars templates.
 */

export { storyGeneratorPlugin } from './plugin';
export type {
    StoryMetadata,
    StoryTemplateParams,
    StoryTemplateFn,
    StoryGeneratorOptions
} from './types';
export { generateStoryFile, writeStoryFile } from './generator';

// Default export for CommonJS compatibility
export { storyGeneratorPlugin as default } from './plugin';
