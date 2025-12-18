import { MitosisComponent } from '@builder.io/mitosis';

/**
 * Storybook metadata configuration for a Mitosis component.
 * This is used in the component's `useMetadata` hook.
 */
export interface StoryMetadata {
    /**
     * Whether Storybook story generation is enabled for this component.
     * @default true
     */
    enabled?: boolean;

    /**
     * Storybook title (defaults to "Components/{ComponentName}").
     *
     * @example 'Components/Forms/Button'
     */
    title?: string;

    /**
     * Default story configuration.
     */
    defaultStory?: {
        /** Default args for the component */
        args?: Record<string, any>;
    };

    /**
     * Additional named stories beyond the default.
     */
    stories?: Array<{
        /** Story name (becomes the export name) */
        name: string;
        /** Story-specific args */
        args?: Record<string, any>;
        /** Story description (becomes JSDoc comment) */
        description?: string;
        /** Story-specific parameters */
        parameters?: any;
    }>;

    /**
     * Storybook argTypes configuration for controls.
     *
     * @see https://storybook.js.org/docs/api/argtypes
     */
    argTypes?: Record<string, any>;

    /**
     * Storybook parameters for the component.
     *
     * @see https://storybook.js.org/docs/writing-stories/parameters
     */
    parameters?: any;

    /**
     * Storybook tags (e.g., ['autodocs']).
     *
     * @default ['autodocs']
     */
    tags?: string[];
}

/**
 * Parameters passed to story template functions.
 */
export interface StoryTemplateParams {
    /** Name of the component */
    componentName: string;
    /** Import path to the component */
    componentPath: string;
    /** Storybook title */
    title: string;
    /** Default story configuration */
    defaultStory: { args?: Record<string, any> };
    /** Additional stories */
    stories: Array<{
        name: string;
        args: string;
        description?: string;
        parameters?: any;
    }>;
    /** ArgTypes configuration */
    argTypes: Record<string, any>;
    /** Storybook parameters */
    parameters: any;
    /** Storybook tags */
    tags: string[];
}

/**
 * Function signature for framework-specific story generators.
 */
export type StoryTemplateFn = (params: StoryTemplateParams) => string;

/**
 * Options passed to the story generator plugin.
 */
export interface StoryGeneratorOptions {
    /**
     * Custom template paths for each framework.
     * Keys are framework names (react, vue, svelte), values are paths to .hbs template files.
     *
     * @example
     * ```ts
     * {
     *   storyTemplates: {
     *     react: './custom-templates/react.hbs',
     *     vue: './custom-templates/vue.hbs'
     *   }
     * }
     * ```
     */
    storyTemplates?: Record<string, string>;

    /**
     * Function to determine the component's import path in the generated story.
     * Receives the component name and component JSON, returns the path segment.
     *
     * @param componentName - The name of the component
     * @param componentJson - The full Mitosis component JSON
     * @returns The path segment (e.g., 'components/forms')
     *
     * @example
     * ```ts
     * getComponentPath: (name) => {
     *   if (name.startsWith('Form')) return 'components/forms';
     *   return 'components';
     * }
     * ```
     */
    getComponentPath?: (componentName: string, componentJson: MitosisComponent) => string;

    /**
     * Function to determine the full output path for the story file.
     * If provided, overrides the default path calculation.
     *
     * @param componentName - The name of the component
     * @param framework - The target framework
     * @param projectRoot - The resolved project root path
     * @returns The full absolute path for the story file
     *
     * @example
     * ```ts
     * getStoryOutputPath: (name, framework, root) => {
     *   return path.join(root, 'src', 'stories', `${name}.stories.tsx`);
     * }
     * ```
     */
    getStoryOutputPath?: (componentName: string, framework: string, projectRoot: string) => string;

    /**
     * Enable debug logging.
     * @default false
     */
    debug?: boolean;

    /**
     * Allow additional options for extensibility.
     */
    [key: string]: any;
}
