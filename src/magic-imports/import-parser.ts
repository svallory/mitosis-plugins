import {
  ParsedImport,
  TransformedImport,
  TransformedImportData,
  TargetConfig,
  SymbolSource
} from './types';

const DEBUG = !!process.env['DEBUG_MITOSIS'];

/**
 * Parse a single import statement into structured data.
 *
 * Handles:
 * - Named imports: `import { A, B } from 'x'`
 * - Renamed imports: `import { A as B } from 'x'`
 * - Default imports: `import X from 'x'`
 * - Namespace imports: `import * as X from 'x'`
 * - Mixed: `import X, { A, B } from 'x'`
 * - Type-only: `import type { A } from 'x'`
 * - Inline type: `import { type A, B } from 'x'`
 */
export function parseImportStatement(importStatement: string): ParsedImport | null {
  // Match the full import statement
  const importMatch = importStatement.match(
    /^import\s+(type\s+)?(.+?)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/
  );

  if (!importMatch) return null;

  const [, typeKeyword, importClause, moduleSpecifier] = importMatch;
  const isTypeOnly = !!typeKeyword;

  const result: ParsedImport = {
    original: importStatement,
    namedImports: new Map(),
    typeImports: new Map(),
    moduleSpecifier,
    isTypeOnly
  };

  // Parse import clause - can be: default, { named }, * as ns, or combinations
  let remaining = importClause.trim();

  // Check for namespace import: * as X
  const nsMatch = remaining.match(/^\*\s+as\s+(\w+)(.*)$/);
  if (nsMatch) {
    result.namespaceImport = nsMatch[1];
    remaining = nsMatch[2].trim();
    if (remaining.startsWith(',')) {
      remaining = remaining.slice(1).trim();
    }
  }

  // Check for default import (identifier before { or at the end)
  const defaultMatch = remaining.match(/^(\w+)\s*,?\s*(.*)$/);
  if (defaultMatch && !remaining.startsWith('{')) {
    result.defaultImport = defaultMatch[1];
    remaining = defaultMatch[2].trim();
  }

  // Parse named imports: { A, B as C, type D }
  const namedMatch = remaining.match(/^\{([^}]*)\}(.*)$/);
  if (namedMatch) {
    const inner = namedMatch[1];
    const symbols = inner.split(',').map(s => s.trim()).filter(Boolean);

    for (const sym of symbols) {
      // Check for inline type import: type A or type A as B
      const isTypeSym = sym.startsWith('type ');
      const cleanSym = isTypeSym ? sym.slice(5).trim() : sym;

      // Parse: A or A as B
      const asMatch = cleanSym.match(/^(\w+)\s+as\s+(\w+)$/);
      if (asMatch) {
        const [, imported, local] = asMatch;
        if (isTypeSym) {
          result.typeImports.set(local, imported);
        } else {
          result.namedImports.set(local, imported);
        }
      } else {
        // Simple import: A (local and imported are the same)
        if (isTypeSym) {
          result.typeImports.set(cleanSym, cleanSym);
        } else {
          result.namedImports.set(cleanSym, cleanSym);
        }
      }
    }

    remaining = namedMatch[2].trim();
  }

  // If there's still content and it's an identifier, it might be a default import
  if (remaining && !result.defaultImport && /^\w+$/.test(remaining)) {
    result.defaultImport = remaining;
  }

  return result;
}

/**
 * Find all import statements for a specific module in code.
 * Handles both left-aligned and indented imports (e.g., in Svelte script tags).
 */
export function findImportsForModule(code: string, moduleSpecifier: string): ParsedImport[] {
  const escapedModule = moduleSpecifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match import statements for this specific module
  // Allow optional leading whitespace to handle indented imports (Svelte)
  const regex = new RegExp(
    `^([ \\t]*)(import\\s+(?:type\\s+)?[^;]+\\s+from\\s+['"]${escapedModule}['"]\\s*;?)\\s*$`,
    'gm'
  );

  const results: ParsedImport[] = [];
  let match;

  while ((match = regex.exec(code)) !== null) {
    const importStatement = match[2];
    const parsed = parseImportStatement(importStatement);
    if (parsed) {
      // Store the full original with indentation for accurate replacement
      parsed.original = match[0].trimEnd();
      results.push(parsed);
    }
  }

  return results;
}

/**
 * Normalize a symbol config value to a SymbolSource object.
 */
function normalizeSymbolSource(value: string | SymbolSource): SymbolSource {
  if (typeof value === 'string') {
    return { from: value };
  }
  return value;
}

/**
 * Transform parsed import based on target configuration.
 *
 * TargetConfig can be:
 * - string: All symbols from this module, no renaming
 * - object: Per-symbol routing with optional '*' catch-all
 */
export function transformImport(
  parsed: ParsedImport,
  targetConfig: TargetConfig
): TransformedImport {
  const result: TransformedImport = {
    imports: new Map()
  };

  // Simple string config - all symbols from one module, no renaming
  if (typeof targetConfig === 'string') {
    const data: TransformedImportData = {
      namedImports: Array.from(parsed.namedImports.entries()).map(([local, imported]) => ({
        imported,
        local
      })),
      defaultImport: parsed.defaultImport,
      namespaceImport: parsed.namespaceImport,
      isTypeOnly: parsed.isTypeOnly
    };

    // Add type imports as well
    for (const [local, imported] of parsed.typeImports) {
      data.namedImports.push({ imported, local });
    }

    result.imports.set(targetConfig, data);
    return result;
  }

  // Object config: per-symbol routing with optional '*' catch-all
  const symbolMap = targetConfig;
  const catchAll = symbolMap['*'];

  /**
   * Helper to add a named import to the result, grouping by target module.
   */
  function addNamedImport(
    targetModule: string,
    imported: string,
    local: string,
    isTypeOnly: boolean
  ) {
    if (!result.imports.has(targetModule)) {
      result.imports.set(targetModule, {
        namedImports: [],
        isTypeOnly
      });
    }

    result.imports.get(targetModule)!.namedImports.push({ imported, local });
  }

  /**
   * Resolve a symbol to its target module and names.
   * Returns null if symbol cannot be resolved.
   */
  function resolveSymbol(localName: string, importedName: string): {
    targetModule: string;
    finalImported: string;
    finalLocal: string;
  } | null {
    // Look up by the imported name (what's actually in the source)
    const symbolConfig = symbolMap[importedName];

    if (symbolConfig && symbolConfig !== '*' && typeof symbolConfig !== 'string') {
      // Explicit symbol config (SymbolSource object)
      const source = symbolConfig as SymbolSource;
      return {
        targetModule: source.from,
        finalImported: source.symbol || importedName,
        finalLocal: source.symbol ? importedName : localName
      };
    }

    if (typeof symbolConfig === 'string') {
      // Simple string: module path only
      return {
        targetModule: symbolConfig,
        finalImported: importedName,
        finalLocal: localName
      };
    }

    // No explicit config, try catch-all
    if (catchAll) {
      if (typeof catchAll === 'string') {
        return {
          targetModule: catchAll,
          finalImported: importedName,
          finalLocal: localName
        };
      }
      // catchAll is SymbolSource (unusual but possible)
      const source = catchAll as SymbolSource;
      return {
        targetModule: source.from,
        finalImported: importedName,
        finalLocal: localName
      };
    }

    // Symbol not found and no catch-all
    return null;
  }

  // Process each named import
  for (const [localName, importedName] of parsed.namedImports) {
    const resolved = resolveSymbol(localName, importedName);

    if (!resolved) {
      if (DEBUG) {
        console.warn(`[MagicImports] Symbol '${importedName}' not found in config and no '*' catch-all defined.`);
      }
      continue;
    }

    addNamedImport(resolved.targetModule, resolved.finalImported, resolved.finalLocal, parsed.isTypeOnly);
  }

  // Process type imports similarly
  for (const [localName, importedName] of parsed.typeImports) {
    const resolved = resolveSymbol(localName, importedName);

    if (!resolved) {
      if (DEBUG) {
        console.warn(`[MagicImports] Type symbol '${importedName}' not found in config and no '*' catch-all defined.`);
      }
      continue;
    }

    addNamedImport(resolved.targetModule, resolved.finalImported, resolved.finalLocal, true);
  }

  // Handle default and namespace imports with catch-all if available
  if (parsed.defaultImport) {
    if (catchAll) {
      const targetModule = typeof catchAll === 'string' ? catchAll : catchAll.from;
      if (!result.imports.has(targetModule)) {
        result.imports.set(targetModule, { namedImports: [], isTypeOnly: parsed.isTypeOnly });
      }
      result.imports.get(targetModule)!.defaultImport = parsed.defaultImport;
    } else if (DEBUG) {
      console.warn(`[MagicImports] Default import '${parsed.defaultImport}' cannot be routed without a '*' catch-all.`);
    }
  }

  if (parsed.namespaceImport) {
    if (catchAll) {
      const targetModule = typeof catchAll === 'string' ? catchAll : catchAll.from;
      if (!result.imports.has(targetModule)) {
        result.imports.set(targetModule, { namedImports: [], isTypeOnly: parsed.isTypeOnly });
      }
      result.imports.get(targetModule)!.namespaceImport = parsed.namespaceImport;
    } else if (DEBUG) {
      console.warn(`[MagicImports] Namespace import '* as ${parsed.namespaceImport}' cannot be routed without a '*' catch-all.`);
    }
  }

  return result;
}

/**
 * Generate import statement string from transformed import data.
 */
export function generateImportStatement(
  moduleSpecifier: string,
  data: TransformedImportData
): string {
  const parts: string[] = [];
  const typePrefix = data.isTypeOnly ? 'type ' : '';

  // Default import comes first
  if (data.defaultImport) {
    parts.push(data.defaultImport);
  }

  // Namespace import
  if (data.namespaceImport) {
    parts.push(`* as ${data.namespaceImport}`);
  }

  // Named imports
  if (data.namedImports.length > 0) {
    const namedParts = data.namedImports.map(({ imported, local }) => {
      if (imported === local) {
        return imported;
      }
      return `${imported} as ${local}`;
    });
    parts.push(`{ ${namedParts.join(', ')} }`);
  }

  if (parts.length === 0) return '';

  return `import ${typePrefix}${parts.join(', ')} from '${moduleSpecifier}';`;
}

/**
 * Generate multiple import statements from a TransformedImport result.
 */
export function generateImportStatements(transformed: TransformedImport): string[] {
  const statements: string[] = [];

  for (const [moduleSpecifier, data] of transformed.imports) {
    const stmt = generateImportStatement(moduleSpecifier, data);
    if (stmt) statements.push(stmt);
  }

  return statements;
}
