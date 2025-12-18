import { MitosisComponent } from '@builder.io/mitosis';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import { StoryMetadata, StoryGeneratorOptions } from './types';
import { getComponentPath, getStoryOutputPath, processArgs } from './utils';

// Register JSON helper for Handlebars
Handlebars.registerHelper('json', function (context: any) {
    return JSON.stringify(context, null, 2);
});

/**
 * Template cache to avoid reading and compiling templates repeatedly.
 */
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

/**
 * Gets or compiles a Handlebars template for a given framework.
 *
 * @param framework - Target framework (react, vue, svelte)
 * @param customTemplatePath - Optional custom template path
 * @returns Compiled Handlebars template
 * @throws Error if template file is not found
 */
function getTemplate(framework: string, customTemplatePath?: string): HandlebarsTemplateDelegate {
    const cacheKey = customTemplatePath || framework;

    if (templateCache.has(cacheKey)) {
        return templateCache.get(cacheKey)!;
    }

    let templatePath: string;

    if (customTemplatePath) {
        // Use custom template if provided
        templatePath = path.resolve(customTemplatePath);
    } else {
        // Use built-in template
        templatePath = path.join(__dirname, 'templates', `${framework}.hbs`);
    }

    if (!fs.existsSync(templatePath)) {
        throw new Error(`Story template not found: ${templatePath}`);
    }

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);

    templateCache.set(cacheKey, template);
    return template;
}

/**
 * Generates the content of a story file for a given component.
 *
 * @param componentJson - Mitosis component JSON
 * @param metadata - Storybook metadata from component
 * @param framework - Target framework (react, vue, svelte)
 * @param options - Generator options
 * @returns Generated story file content
 */
export function generateStoryFile(
    componentJson: MitosisComponent,
    metadata: StoryMetadata,
    framework: string,
    options: StoryGeneratorOptions
): string {
    const componentName = componentJson.name;
    const componentPath = getComponentPath(componentJson, options);

    // Process default story args
    const imports = new Set<string>();
    const defaultArgs = processArgs(metadata.defaultStory?.args || {}, imports);

    // Process additional stories
    const processedStories = (metadata.stories || []).map((story) => ({
        name: story.name,
        args: processArgs(story.args || {}, imports),
        description: story.description,
        parameters: story.parameters
    }));

    // Get template (custom or built-in)
    const customTemplatePath = options.storyTemplates?.[framework];
    const template = getTemplate(framework, customTemplatePath);

    // Render template
    return template({
        componentName,
        componentPath,
        title: metadata.title || `Components/${componentName}`,
        defaultArgs,
        stories: processedStories,
        argTypes: Object.keys(metadata.argTypes || {}).length > 0 ? metadata.argTypes : null,
        parameters: metadata.parameters || { layout: 'centered' },
        tags: metadata.tags || ['autodocs'],
        imports: Array.from(imports)
    });
}

/**
 * Writes a story file to the appropriate location.
 *
 * @param componentName - Name of the component
 * @param framework - Target framework
 * @param content - Story file content
 * @param options - Generator options (for custom output paths)
 */
export function writeStoryFile(
    componentName: string,
    framework: string,
    content: string,
    options?: StoryGeneratorOptions
): void {
    const outputPath = getStoryOutputPath(componentName, framework, options);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, content, 'utf-8');

    if (options?.debug) {
        console.log(`[StoryGenerator] Generated: ${path.relative(process.cwd(), outputPath)}`);
    } else {
        console.log(`✨ Generated story: ${path.relative(process.cwd(), outputPath)}`);
    }
}
