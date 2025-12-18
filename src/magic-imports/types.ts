import { MitosisComponent, Targets } from '@builder.io/mitosis';

// ============================================================================
// Symbol Mapping Types
// ============================================================================

/**
 * Where a local symbol comes from in the target framework.
 */
export interface SymbolSource {
  /** Target module to import from */
  from: string;
  /**
   * The actual symbol name exported by the target module.
   * Use when the exported name differs from the local name.
   *
   * @example { from: '@xyflow/react', symbol: 'ReactFlow' }
   * // generates: import { ReactFlow as Flow } from '@xyflow/react'
   */
  symbol?: string;
}

/**
 * Target configuration: maps local symbol names to their sources.
 *
 * Can be:
 * - `string`: All symbols come from this module, no renaming
 * - `object`: Per-symbol routing with optional '*' catch-all
 *
 * @example Simple - all symbols from one module
 * ```ts
 * targets: {
 *   react: 'lucide-react'
 * }
 * ```
 *
 * @example Complex - per-symbol routing
 * ```ts
 * targets: {
 *   vue: {
 *     Flow: { from: '@vue-flow/core', symbol: 'VueFlow' },
 *     Background: '@vue-flow/background',
 *     '*': '@vue-flow/core'  // catch-all for unmapped symbols
 *   }
 * }
 * ```
 */
export type TargetConfig =
  | string  // all symbols from this module
  | Record<string, string | SymbolSource>;  // symbol map, '*' for catch-all

// ============================================================================
// Shim (Type Declaration) Types
// ============================================================================

/**
 * Configuration for a package in the shim (type declarations).
 */
export interface ShimPackageConfig {
  /**
   * Whether to generate `export * from "package"`.
   * @default false
   */
  reexportAll?: boolean;

  /**
   * Symbol aliases: localName -> exportedName.
   * Generates: `export { exportedName as localName } from "package"`
   *
   * @example
   * ```ts
   * aliases: { Flow: 'ReactFlow' }
   * // generates: export { ReactFlow as Flow } from "package";
   * ```
   */
  aliases?: Record<string, string>;
}

/**
 * Shim configuration for type declaration generation.
 *
 * Can be:
 * - `string`: Single package, export * from it
 * - `object`: Per-package configuration
 *
 * @example Simple - export * from one package
 * ```ts
 * shim: 'lucide-react'
 * // generates: export * from "lucide-react";
 * ```
 *
 * @example Complex - multiple packages with aliases
 * ```ts
 * shim: {
 *   '@xyflow/react': {
 *     reexportAll: true,
 *     aliases: { Flow: 'ReactFlow' }
 *   },
 *   '@xyflow/background': '*'  // shorthand for { reexportAll: true }
 * }
 * // generates:
 * // export { ReactFlow as Flow } from "@xyflow/react";
 * // export * from "@xyflow/react";
 * // export * from "@xyflow/background";
 * ```
 */
export type ShimConfig =
  | string  // single package, export * from it
  | Record<string, '*' | ShimPackageConfig>;  // per-package config

// ============================================================================
// Module Configuration
// ============================================================================

/**
 * Configuration for a single virtual module.
 */
export interface ModuleConfig {
  /**
   * Shim configuration for type declaration generation.
   * Controls what gets exported in the generated .d.ts file.
   */
  shim?: ShimConfig;

  /**
   * Target-specific mappings for runtime import transformation.
   * Key: Target framework name (react, vue, svelte, etc.)
   * Value: How to transform imports for that target
   */
  targets: Partial<Record<Targets, TargetConfig>>;
}

// ============================================================================
// Plugin Options
// ============================================================================

/**
 * Magic Imports plugin options.
 *
 * @example
 * ```ts
 * magicImportsPlugin({
 *   shimOutputFile: 'src/typings/magic-imports.d.ts',
 *   modules: {
 *     'lucide': {
 *       shim: 'lucide-react',
 *       targets: {
 *         react: 'lucide-react',
 *         vue: 'lucide-vue-next'
 *       }
 *     }
 *   }
 * })
 * ```
 */
export interface MagicImportsPluginOptions {
  /**
   * Path to write the generated type declarations, relative to cwd.
   * Set to `false` to disable shim generation.
   * @default 'src/typings/magic-imports.d.ts'
   */
  shimOutputFile?: string | false;

  /**
   * Virtual module configurations.
   * Key: Module name (with or without 'virtual:' prefix)
   */
  modules: Record<string, ModuleConfig>;
}

// ============================================================================
// Internal Types (for import parsing/transformation)
// ============================================================================

/**
 * Parsed import statement structure.
 */
export interface ParsedImport {
  /** Full original import statement */
  original: string;

  /**
   * Named imports: Map<localName, importedName>
   * For `import { A as B }`, stores: Map.set('B', 'A')
   */
  namedImports: Map<string, string>;

  /** Default import name if present */
  defaultImport?: string;

  /** Namespace import name if present (import * as X) */
  namespaceImport?: string;

  /** Type-only named imports */
  typeImports: Map<string, string>;

  /** The module specifier (e.g., 'virtual:flow') */
  moduleSpecifier: string;

  /** Whether this is a type-only import (import type {...}) */
  isTypeOnly: boolean;
}

/**
 * Data for a single transformed import statement.
 */
export interface TransformedImportData {
  /** Named imports: { imported: 'ReactFlow', local: 'Flow' } */
  namedImports: Array<{ imported: string; local: string }>;

  /** Default import name */
  defaultImport?: string;

  /** Namespace import name */
  namespaceImport?: string;

  /** Whether this is a type-only import */
  isTypeOnly: boolean;
}

/**
 * Result of transforming an import.
 * Maps target module specifier to import data.
 */
export interface TransformedImport {
  /** Map of module specifier to import details */
  imports: Map<string, TransformedImportData>;
}
