import { MitosisComponent, MitosisPlugin } from '@builder.io/mitosis';
import { CssModulesPluginOptions } from './types';
import * as fs from 'fs';
import * as path from 'path';

const DEBUG = !!process.env['DEBUG_MITOSIS_CSS_MODULES'];

/**
 * CSS Modules Plugin - Reads CSS from .module.css files and injects into json.style.
 *
 * This plugin:
 * 1. Looks for a .module.css file alongside each Mitosis component
 * 2. Reads the CSS content from that file
 * 3. Injects the CSS into json.style (like useStyle does)
 * 4. Lets Mitosis's built-in style handling generate framework-specific output
 *
 * @example
 * ```
 * // Component: Button.lite.tsx
 * // CSS Module: Button.module.css (alongside the component)
 *
 * // In mitosis.config.cjs:
 * cssModulesPlugin()
 * ```
 */
export const cssModulesPlugin = (
  options: CssModulesPluginOptions = {}
): MitosisPlugin => {
  const {
    enabled = true,
    targets,
    debug = DEBUG,
    fileExtension = '.module.css'
  } = options;

  // Cache for loaded CSS modules to avoid re-reading files
  const cssModuleCache = new Map<string, string>();

  return () => ({
    name: 'css-modules',

    json: {
      pre: (json: MitosisComponent) => {
        if (!enabled) return json;

        const target = json.pluginData?.target;
        if (targets && target && !targets.includes(target)) {
          if (debug) {
            console.log(`[CSS Modules] Skipping ${json.name} for target ${target}`);
          }
          return json;
        }

        // Get the source file path from the component
        // Mitosis provides `path` property which is relative to cwd
        const componentPath = json.pluginData?.path;

        if (debug) {
          console.log(`[CSS Modules] Component path for ${json.name}: ${componentPath}`);
        }

        // Construct the CSS module path
        // The path is relative to cwd and includes 'src/', e.g., "src/components/TestCssModules/TestCssModules.lite.tsx"
        let cssModulePath: string;

        if (componentPath) {
          // Build path from pluginData.path (already includes 'src/' prefix)
          const sourceFilePath = path.join(process.cwd(), componentPath);
          const sourceDir = path.dirname(sourceFilePath);
          const sourceBasename = path.basename(sourceFilePath, '.lite.tsx');
          cssModulePath = path.join(sourceDir, `${sourceBasename}${fileExtension}`);
        } else {
          // Fallback: try to construct from component name
          // This handles components that may not have path set
          const componentName = json.name || 'Component';
          const srcDir = path.join(process.cwd(), 'src', 'components', componentName);
          cssModulePath = path.join(srcDir, `${componentName}${fileExtension}`);
        }

        if (debug) {
          console.log(`[CSS Modules] Looking for CSS module: ${cssModulePath}`);
        }

        // Check if the CSS module file exists
        if (!fs.existsSync(cssModulePath)) {
          if (debug) {
            console.log(`[CSS Modules] No CSS module found for ${json.name}`);
          }
          return json;
        }

        try {
          // Check cache first
          let cssContent = cssModuleCache.get(cssModulePath);

          if (!cssContent) {
            // Read the CSS module file
            cssContent = fs.readFileSync(cssModulePath, 'utf-8');
            cssModuleCache.set(cssModulePath, cssContent);

            if (debug) {
              console.log(`[CSS Modules] Read ${cssContent.length} bytes from ${cssModulePath}`);
            }
          }

          // Inject CSS into json.style (exactly like useStyle does)
          // If there's already style content, append to it
          if (json.style) {
            json.style = json.style + '\n' + cssContent;
          } else {
            json.style = cssContent;
          }

          if (debug) {
            console.log(`[CSS Modules] Injected CSS into json.style for ${json.name}`);
            console.log(`[CSS Modules] json.style length: ${json.style.length}`);
          }

        } catch (error) {
          console.error(`[CSS Modules] Error processing ${json.name}:`, error);
          // Don't fail the build, just skip processing
        }

        return json;
      }
    }
  });
};

export default cssModulesPlugin;
