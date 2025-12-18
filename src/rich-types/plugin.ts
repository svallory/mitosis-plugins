import { MitosisComponent, MitosisPlugin } from '@builder.io/mitosis';

/**
 * Configuration for a single type fix pattern.
 */
export interface TypeFixPattern {
    /**
     * Regular expression pattern to match in the generated code.
     * Use capture groups to extract parts for replacement.
     */
    pattern: RegExp;

    /**
     * Replacement string or function.
     * If a string, can use `$1`, `$2`, etc. for capture group references.
     * If a function, receives the match and capture groups.
     */
    replacement: string | ((...args: string[]) => string);

    /**
     * Optional description for debugging.
     */
    description?: string;
}

/**
 * Configuration for the rich types plugin.
 */
export interface RichTypesOptions {
    /**
     * Enable/disable the plugin.
     * @default true
     */
    enabled?: boolean;

    /**
     * Only apply to specific targets.
     * @default undefined (all targets)
     */
    targets?: string[];

    /**
     * Enable debug logging.
     * @default false
     */
    debug?: boolean;

    /**
     * Custom type fix patterns to apply to the generated code.
     * These are applied in order after the built-in fixes.
     */
    patterns?: TypeFixPattern[];

    /**
     * React-specific options.
     */
    react?: {
        /**
         * Type hint for dynamic components (e.g., icon refs).
         * @default "React.ComponentType<any>"
         */
        componentTypeHint?: string;

        /**
         * Enable the built-in useState type inference fix.
         * Adds type parameters to useState calls with null initializers.
         * @default true
         */
        useStateTypeFix?: boolean;

        /**
         * Default type to use for useState with null initializers.
         * @default "string | null"
         */
        useStateDefaultType?: string;

        /**
         * Custom useState type mappings.
         * Maps variable names to their types.
         *
         * @example
         * ```ts
         * { 'selectedItem': 'Item | null', 'count': 'number' }
         * ```
         */
        useStateTypes?: Record<string, string>;

        /**
         * Enable the built-in component ref type cast fix.
         * Adds type casts to dynamic component references.
         * @default true
         */
        componentRefTypeFix?: boolean;

        /**
         * Pattern to match component ref variable names.
         * @default /Ref$/
         */
        componentRefPattern?: RegExp;
    };
}

/**
 * Rich Types Plugin for Mitosis.
 *
 * Enriches generated code with TypeScript type information that Mitosis
 * doesn't infer automatically. This plugin helps fix common type errors
 * in the generated framework-specific code.
 *
 * @param options - Plugin configuration
 * @returns Mitosis plugin factory
 *
 * @example
 * Basic usage with defaults:
 * ```ts
 * import { richTypesPlugin } from 'mitosis-plugins';
 *
 * export default {
 *   options: {
 *     react: {
 *       plugins: [richTypesPlugin()]
 *     }
 *   }
 * };
 * ```
 *
 * @example
 * Custom useState type mappings:
 * ```ts
 * richTypesPlugin({
 *   react: {
 *     useStateTypes: {
 *       'selectedItem': 'Item | null',
 *       'currentUser': 'User | null'
 *     }
 *   }
 * })
 * ```
 *
 * @example
 * Custom patterns for other frameworks:
 * ```ts
 * richTypesPlugin({
 *   patterns: [
 *     {
 *       pattern: /const (\w+) = ref\(null\)/g,
 *       replacement: 'const $1 = ref<string | null>(null)',
 *       description: 'Add type to Vue ref with null'
 *     }
 *   ]
 * })
 * ```
 */
export function richTypesPlugin(options: RichTypesOptions = {}): MitosisPlugin {
    const {
        enabled = true,
        targets,
        debug = false,
        patterns = [],
        react = {}
    } = options;

    const {
        componentTypeHint = 'React.ComponentType<any>',
        useStateTypeFix = true,
        useStateDefaultType = 'string | null',
        useStateTypes = {},
        componentRefTypeFix = true,
        componentRefPattern = /Ref$/
    } = react;

    if (!enabled) {
        return () => ({});
    }

    return () => ({
        name: 'rich-types',

        json: {
            post: (json: MitosisComponent) => {
                const target = json.pluginData?.target;

                // Check if we should process this target
                if (targets && target && !targets.includes(target)) {
                    return json;
                }

                // Fix: Extract type parameters from state initialization with type assertions
                // e.g., "null as string | null" -> typeParameter: "string | null"
                if (json.state) {
                    for (const [key, stateProp] of Object.entries(json.state)) {
                        if (
                            stateProp?.type === 'property' &&
                            stateProp.code &&
                            !stateProp.typeParameter
                        ) {
                            // Match "as Type" at the end of the code string
                            // Using a simple regex that handles basic type assertions
                            const match = stateProp.code.match(/\s+as\s+([^;]+)$/);
                            if (match) {
                                stateProp.typeParameter = match[1].trim();
                            }
                        }
                    }
                }

                return json;
            }
        },

        code: {
            post: (code: string, json: MitosisComponent) => {
                const target = json.pluginData?.target;

                // Check if we should process this target
                if (targets && target && !targets.includes(target)) {
                    return code;
                }

                let newCode = code;
                let modifications = 0;

                // React-specific fixes
                if (target === 'react') {
                    // Fix 1: Add type parameters to useState with null initializers
                    if (useStateTypeFix) {
                        // First, apply specific type mappings
                        for (const [varName, typeName] of Object.entries(useStateTypes)) {
                            const pattern = new RegExp(
                                `const \\[${varName}, (set\\w+)\\] = useState\\(\\(\\) => null\\);`,
                                'g'
                            );
                            newCode = newCode.replace(pattern, (match, setter) => {
                                modifications++;
                                return `const [${varName}, ${setter}] = useState<${typeName}>(() => null);`;
                            });
                        }

                        // Then, apply default type to remaining useState with null
                        newCode = newCode.replace(
                            /const \[(\w+), (set\w+)\] = useState\(\(\) => null\);/g,
                            (match, varName, setter) => {
                                // Skip if already processed by specific mapping
                                if (useStateTypes[varName]) return match;
                                modifications++;
                                return `const [${varName}, ${setter}] = useState<${useStateDefaultType}>(() => null);`;
                            }
                        );
                    }

                    // Fix 2: Component type casts for dynamic components
                    if (componentRefTypeFix) {
                        newCode = newCode.replace(
                            /const (\w+) = (\w+)\(\);/g,
                            (match, refName, fnName) => {
                                // Only apply to names matching the pattern
                                if (!componentRefPattern.test(refName)) return match;
                                modifications++;
                                return `const ${refName} = ${fnName}() as ${componentTypeHint};`;
                            }
                        );
                    }
                }

                // Apply custom patterns (all targets)
                for (const { pattern, replacement, description } of patterns) {
                    const before = newCode;
                    if (typeof replacement === 'function') {
                        newCode = newCode.replace(pattern, replacement);
                    } else {
                        newCode = newCode.replace(pattern, replacement);
                    }
                    if (before !== newCode) {
                        modifications++;
                        if (debug && description) {
                            console.log(`[RichTypes] Applied: ${description}`);
                        }
                    }
                }

                if (debug && modifications > 0) {
                    console.log(
                        `[RichTypes] Applied ${modifications} type fix(es) to ${json.name} (${target})`
                    );
                }

                return newCode;
            }
        }
    });
}

// Also export as default for backwards compatibility
export default richTypesPlugin;
