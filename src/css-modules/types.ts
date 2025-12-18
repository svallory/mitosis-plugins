/**
 * Configuration for the CSS Modules plugin.
 */
export interface CssModulesPluginOptions {
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
   * File extension for CSS module files to look for.
   * @default '.module.css'
   */
  fileExtension?: string;
}
