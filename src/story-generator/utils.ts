import * as fs from 'fs';
import * as path from 'path';
import { MitosisComponent } from '@builder.io/mitosis';
import { StoryGeneratorOptions } from './types';

/**
 * Determines the component's import path for the generated story file.
 *
 * @param componentJson - The Mitosis component JSON
 * @param options - Generator options (may contain custom path resolver)
 * @returns Component path relative to the story file (e.g., 'components/MyButton')
 */
export function getComponentPath(componentJson: MitosisComponent, options: StoryGeneratorOptions): string {
    // Use custom resolver if provided
    if (options.getComponentPath) {
        return options.getComponentPath(componentJson.name, componentJson);
    }

    // Default: components directory
    return 'components';
}

/**
 * Processes story args, handling import references and inline values.
 *
 * @param args - Story arguments object
 * @param imports - Set to collect import statements (mutated)
 * @returns Processed args as a string (JSON or reference)
 */
export function processArgs(args: Record<string, any>, imports: Set<string>): string {
    if (!args) return '{}';

    // Handle import references: { import: 'path', value: 'varName.property' }
    if (args['import'] && args['value']) {
        const importName = extractImportName(args['value']);
        imports.add(`import { ${importName} } from '${args['import']}';`);
        return args['value'];
    }

    // Handle inline args
    return JSON.stringify(args, null, 2);
}

/**
 * Extracts the import name from a value reference.
 *
 * @param value - Value string (e.g., 'docPanelArgs.empty')
 * @returns Import name (e.g., 'docPanelArgs')
 *
 * @example
 * ```ts
 * extractImportName('myArgs.default') // returns 'myArgs'
 * extractImportName('singleVar') // returns 'singleVar'
 * ```
 */
export function extractImportName(value: string): string {
    return value.split('.')[0];
}

/**
 * Gets the output path for a story file.
 *
 * @param componentName - Name of the component
 * @param framework - Target framework (react, vue, svelte)
 * @param options - Optional generator options with custom output path
 * @returns Absolute path to the story file
 */
export function getStoryOutputPath(
    componentName: string,
    framework: string,
    options?: StoryGeneratorOptions
): string {
    // Use custom resolver if provided
    if (options?.getStoryOutputPath) {
        const projectRoot = findProjectRoot();
        return options.getStoryOutputPath(componentName, framework, projectRoot);
    }

    // Default behavior
    const projectRoot = findProjectRoot();
    const extension = getStoryExtension(framework);

    return path.join(
        projectRoot,
        'packages',
        framework,
        'stories',
        `${componentName}.stories.${extension}`
    );
}

/**
 * Gets the file extension for story files based on framework.
 *
 * @param framework - Target framework
 * @returns File extension (tsx, ts, etc.)
 */
export function getStoryExtension(framework: string): string {
    const extensions: Record<string, string> = {
        react: 'tsx',
        vue: 'ts',
        svelte: 'ts'
    };
    return extensions[framework] || 'ts';
}

/**
 * Finds the project root by looking for mitosis.config.cjs.
 *
 * @returns The absolute path to the project root
 */
export function findProjectRoot(): string {
    const cwd = process.cwd();
    const configPath = path.join(cwd, 'mitosis.config.cjs');

    // If mitosis config exists in cwd, that's our project root
    if (fs.existsSync(configPath)) {
        return cwd;
    }

    // Otherwise, assume cwd is the project root
    return cwd;
}
