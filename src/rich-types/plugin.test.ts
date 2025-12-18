import { describe, it, expect } from 'vitest';
import { MitosisComponent } from '@builder.io/mitosis';
import richTypesPlugin from './plugin';

/**
 * Helper to create a minimal Mitosis component for testing
 */
function createMockComponent(overrides: Partial<MitosisComponent> = {}): MitosisComponent {
    return {
        '@type': '@builder.io/mitosis/component',
        name: 'TestComponent',
        imports: [],
        exports: {},
        meta: {},
        inputs: [],
        state: {},
        context: {
            get: {},
            set: {}
        },
        refs: {},
        hooks: {},
        children: [],
        subComponents: [],
        ...overrides
    } as MitosisComponent;
}

describe('richTypesPlugin', () => {
    describe('json.post hook - State Type Parameters', () => {
        it('should extract simple nullable type', () => {
            const component = createMockComponent({
                state: {
                    selectedClass: {
                        code: 'null as string | null',
                        type: 'property',
                        propertyType: 'normal'
                    }
                }
            });

            const plugin = richTypesPlugin();
            const hooks = plugin();
            const result = hooks.json!.post!(component);

            expect(result.state?.selectedClass?.typeParameter).toBe('string | null');
        });

        it('should extract complex nullable type', () => {
            const component = createMockComponent({
                state: {
                    selectedProperty: {
                        code: 'null as SelectedProperty | null',
                        type: 'property',
                        propertyType: 'normal'
                    }
                }
            });

            const plugin = richTypesPlugin();
            const hooks = plugin();
            const result = hooks.json!.post!(component);

            expect(result.state?.selectedProperty?.typeParameter).toBe('SelectedProperty | null');
        });

        it('should extract type from expression with assertion', () => {
            const component = createMockComponent({
                state: {
                    currentFeature: {
                        code: '(props.config?.defaultFeature || null) as string | null',
                        type: 'property',
                        propertyType: 'normal'
                    }
                }
            });

            const plugin = richTypesPlugin();
            const hooks = plugin();
            const result = hooks.json!.post!(component);

            expect(result.state?.currentFeature?.typeParameter).toBe('string | null');
        });

        it('should skip properties without type assertion', () => {
            const component = createMockComponent({
                state: {
                    simpleValue: {
                        code: '"hello"',
                        type: 'property',
                        propertyType: 'normal'
                    }
                }
            });

            const plugin = richTypesPlugin();
            const hooks = plugin();
            const result = hooks.json!.post!(component);

            expect(result.state?.simpleValue?.typeParameter).toBeUndefined();
        });

        it('should skip getters', () => {
            const component = createMockComponent({
                state: {
                    computed: {
                        code: 'return value as string',
                        type: 'getter',
                        propertyType: 'normal'
                    }
                }
            });

            const plugin = richTypesPlugin();
            const hooks = plugin();
            const result = hooks.json!.post!(component);

            expect(result.state?.computed?.typeParameter).toBeUndefined();
        });

        it('should skip methods', () => {
            const component = createMockComponent({
                state: {
                    handleClick: {
                        code: 'return null as string',
                        type: 'method',
                        propertyType: 'normal'
                    }
                }
            });

            const plugin = richTypesPlugin();
            const hooks = plugin();
            const result = hooks.json!.post!(component);

            expect(result.state?.handleClick?.typeParameter).toBeUndefined();
        });

        it('should preserve existing typeParameter', () => {
            const component = createMockComponent({
                state: {
                    value: {
                        code: 'null',
                        type: 'property',
                        propertyType: 'normal',
                        typeParameter: 'ExistingType'
                    }
                }
            });

            const plugin = richTypesPlugin();
            const hooks = plugin();
            const result = hooks.json!.post!(component);

            expect(result.state?.value?.typeParameter).toBe('ExistingType');
        });

        it('should process multiple state properties', () => {
            const component = createMockComponent({
                state: {
                    first: {
                        code: 'null as string | null',
                        type: 'property',
                        propertyType: 'normal'
                    },
                    second: {
                        code: 'null as number | null',
                        type: 'property',
                        propertyType: 'normal'
                    },
                    third: {
                        code: '"hello"',
                        type: 'property',
                        propertyType: 'normal'
                    }
                }
            });

            const plugin = richTypesPlugin();
            const hooks = plugin();
            const result = hooks.json!.post!(component);

            expect(result.state?.first?.typeParameter).toBe('string | null');
            expect(result.state?.second?.typeParameter).toBe('number | null');
            expect(result.state?.third?.typeParameter).toBeUndefined();
        });

        it('should respect target filtering', () => {
            const component = createMockComponent({
                pluginData: { target: 'vue' },
                state: {
                    value: {
                        code: 'null as string | null',
                        type: 'property',
                        propertyType: 'normal'
                    }
                }
            });

            const plugin = richTypesPlugin({ targets: ['react'] });
            const hooks = plugin();
            const result = hooks.json!.post!(component);

            // Should skip because target is 'vue' but we specified 'react' only
            expect(result.state?.value?.typeParameter).toBeUndefined();
        });

        it('should work when targets is not specified (all targets)', () => {
            const component = createMockComponent({
                pluginData: { target: 'svelte' },
                state: {
                    value: {
                        code: 'null as string | null',
                        type: 'property',
                        propertyType: 'normal'
                    }
                }
            });

            const plugin = richTypesPlugin();
            const hooks = plugin();
            const result = hooks.json!.post!(component);

            expect(result.state?.value?.typeParameter).toBe('string | null');
        });
    });

    describe('code.post hook - React Component Type Casts', () => {
        const mockComponent = createMockComponent({
            pluginData: { target: 'react' },
            name: 'TestComponent'
        });

        it('should add type cast to component ref', () => {
            const code = 'const HeaderIconRef = headerIcon();';

            const plugin = richTypesPlugin();
            const hooks = plugin();
            const result = hooks.code!.post!(code, mockComponent);

            expect(result).toBe('const HeaderIconRef = headerIcon() as React.ComponentType<any>;');
        });

        it('should handle multiple component refs', () => {
            const code = `
                const HeaderIconRef = headerIcon();
                const FooterIconRef = footerIcon();
            `;

            const plugin = richTypesPlugin();
            const hooks = plugin();
            const result = hooks.code!.post!(code, mockComponent);

            expect(result).toContain('headerIcon() as React.ComponentType<any>');
            expect(result).toContain('footerIcon() as React.ComponentType<any>');
        });

        it('should use custom component type hint', () => {
            const code = 'const HeaderIconRef = headerIcon();';

            const plugin = richTypesPlugin({
                react: { componentTypeHint: 'CustomComponentType' }
            });
            const hooks = plugin();
            const result = hooks.code!.post!(code, mockComponent);

            expect(result).toBe('const HeaderIconRef = headerIcon() as CustomComponentType;');
        });

        it('should only apply to React target', () => {
            const code = 'const HeaderIconRef = headerIcon();';
            const vueComponent = createMockComponent({
                pluginData: { target: 'vue' },
                name: 'TestComponent'
            });

            const plugin = richTypesPlugin();
            const hooks = plugin();
            const result = hooks.code!.post!(code, vueComponent);

            // Should not add type cast for non-React targets
            expect(result).toBe(code);
        });

        it('should respect target filtering for code hook', () => {
            const code = 'const HeaderIconRef = headerIcon();';

            const plugin = richTypesPlugin({ targets: ['vue'] });
            const hooks = plugin();
            const result = hooks.code!.post!(code, mockComponent);

            // Should skip because we specified vue only
            expect(result).toBe(code);
        });

        it('should not modify code without matching pattern', () => {
            const code = 'const value = getValue();';

            const plugin = richTypesPlugin();
            const hooks = plugin();
            const result = hooks.code!.post!(code, mockComponent);

            expect(result).toBe(code);
        });
    });

    describe('plugin configuration', () => {
        it('should return empty hooks when disabled', () => {
            const plugin = richTypesPlugin({ enabled: false });
            const hooks = plugin();

            expect(hooks).toEqual({});
        });

        it('should have correct plugin name', () => {
            const plugin = richTypesPlugin();
            const hooks = plugin();

            expect(hooks.name).toBe('rich-types');
        });
    });
});
