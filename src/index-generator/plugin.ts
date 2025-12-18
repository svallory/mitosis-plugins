import { MitosisComponent, MitosisPlugin } from '@builder.io/mitosis';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration options for the index generator plugin.
 */
export interface IndexGeneratorOptions {
    /**
     * Base output directory for generated files.
     * Defaults to `packages/{framework}/src` relative to the project root.
     */
    outputDir?: string;

    /**
     * Function to determine the component's base path within the output directory.
     * Receives the component name and should return the subdirectory path.
     *
     * @param componentName - The name of the component
     * @returns The base path (e.g., 'components', 'components/forms')
     *
     * @example
     * ```ts
     * // Place components starting with "Form" in components/forms
     * getComponentBasePath: (name) => {
     *   if (name.startsWith('Form')) return 'components/forms';
     *   return 'components';
     * }
     * ```
     */
    getComponentBasePath?: (componentName: string) => string;

    /**
     * Function to determine the full output path for the index file.
     * If provided, overrides the default path calculation.
     *
     * @param componentName - The name of the component
     * @param framework - The target framework
     * @param projectRoot - The resolved project root path
     * @returns The full absolute path for the index.ts file
     */
    getIndexOutputPath?: (componentName: string, framework: string, projectRoot: string) => string;

    /**
     * Function to generate custom index file content.
     *
     * @param componentName - The name of the component
     * @param framework - The target framework
     * @returns The content for the index.ts file
     */
    generateIndexContent?: (componentName: string, framework: string) => string;

    /**
     * Enable debug logging.
     * @default false
     */
    debug?: boolean;
}

/**
 * Index generator plugin for Mitosis.
 *
 * Generates `index.ts` files for each component to support folder-based import structures.
 * This allows for cleaner imports like `import Component from './components/Component'`
 * instead of `import Component from './components/Component/Component'`.
 *
 * @param options - Plugin configuration options
 * @returns The Mitosis plugin factory
 *
 * @example
 * Basic usage (uses sensible defaults):
 * ```ts
 * import { indexGeneratorPlugin } from 'mitosis-plugins';
 *
 * export default {
 *   targets: ['react', 'vue', 'svelte'],
 *   options: {
 *     react: {
 *       plugins: [indexGeneratorPlugin()]
 *     }
 *   }
 * };
 * ```
 *
 * @example
 * Custom component paths:
 * ```ts
 * indexGeneratorPlugin({
 *   getComponentBasePath: (name) => {
 *     if (name.startsWith('Form')) return 'components/forms';
 *     if (name.startsWith('Layout')) return 'components/layouts';
 *     return 'components';
 *   }
 * })
 * ```
 */
const indexGeneratorPlugin = (options: IndexGeneratorOptions = {}): MitosisPlugin => {
    const {
        outputDir,
        getComponentBasePath = defaultGetComponentBasePath,
        getIndexOutputPath: customGetIndexOutputPath,
        generateIndexContent: customGenerateIndexContent,
        debug = false
    } = options;

    return () => ({
        name: 'index-generator',
        json: {
            post: (json: MitosisComponent) => {
                const framework = json.pluginData?.target;
                if (!framework) return json;

                const componentName = json.name;

                // Skip subcomponents (components in subdirectories)
                // These are not meant to be exported as standalone components
                if (json.pluginData?.path?.includes('subcomponents')) {
                    return json;
                }

                // Find project root
                const projectRoot = findProjectRoot();

                // Calculate output path for the index file
                const indexOutputPath = customGetIndexOutputPath
                    ? customGetIndexOutputPath(componentName, framework, projectRoot)
                    : getDefaultIndexOutputPath(componentName, framework, projectRoot, outputDir, getComponentBasePath);

                // Generate index file content
                const indexContent = customGenerateIndexContent
                    ? customGenerateIndexContent(componentName, framework)
                    : defaultGenerateIndexContent(componentName, framework);

                // Write index file
                fs.mkdirSync(path.dirname(indexOutputPath), { recursive: true });
                fs.writeFileSync(indexOutputPath, indexContent, 'utf-8');

                if (debug) {
                    console.log(`[IndexGenerator] Generated: ${path.relative(process.cwd(), indexOutputPath)}`);
                }

                return json;
            }
        }
    });
};

/**
 * Default function to determine the component's base path.
 * Simply returns 'components' for all components.
 *
 * @param componentName - The name of the component
 * @returns The base path (always 'components')
 */
function defaultGetComponentBasePath(componentName: string): string {
    return 'components';
}

/**
 * Generates the default content for the index.ts file.
 *
 * @param componentName - The name of the component
 * @param framework - The target framework
 * @returns The content of the index.ts file
 */
function defaultGenerateIndexContent(componentName: string, framework: string): string {
    let importPath = `./${componentName}`;
    if (framework === 'vue') {
        importPath += '.vue';
    } else if (framework === 'svelte') {
        importPath += '.svelte';
    }

    return `export { default } from '${importPath}';\n`;
}

/**
 * Calculates the default output path for the index.ts file.
 *
 * @param componentName - The name of the component
 * @param framework - The target framework
 * @param projectRoot - The project root directory
 * @param outputDir - Optional custom output directory
 * @param getBasePath - Function to determine component base path
 * @returns The absolute path to the output index.ts file
 */
function getDefaultIndexOutputPath(
    componentName: string,
    framework: string,
    projectRoot: string,
    outputDir: string | undefined,
    getBasePath: (name: string) => string
): string {
    const baseDir = outputDir || path.join(projectRoot, 'packages', framework, 'src');

    return path.join(
        baseDir,
        getBasePath(componentName),
        componentName,
        'index.ts'
    );
}

/**
 * Finds the project root by looking for mitosis.config.cjs.
 *
 * @returns The absolute path to the project root
 */
function findProjectRoot(): string {
    const cwd = process.cwd();
    const configPath = path.join(cwd, 'mitosis.config.cjs');

    // If mitosis config exists in cwd, that's our project root
    if (fs.existsSync(configPath)) {
        return cwd;
    }

    // Otherwise, assume cwd is the project root (no fallback to hardcoded paths)
    return cwd;
}

export default indexGeneratorPlugin;
