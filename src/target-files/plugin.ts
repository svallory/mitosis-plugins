import { MitosisPlugin } from '@builder.io/mitosis';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration options for the target files plugin.
 */
export interface TargetFilesOptions {
    /**
     * List of all target names in your Mitosis config.
     * Required for cleanup of files belonging to other targets.
     *
     * @example ['react', 'vue', 'svelte']
     */
    allTargets: string[];

    /**
     * Enable debug logging.
     * @default false
     */
    debug?: boolean;
}

/**
 * Output file info from Mitosis build.
 */
interface OutputFile {
    outputDir: string;
    outputFilePath: string;
}

/**
 * Target Files Plugin for Mitosis.
 *
 * Supports two targeting strategies:
 *
 * **File-level**: Pattern `*.[target].*`
 * - Renames files matching the current target (strips `.[target]`)
 * - Deletes files matching other targets
 * - Example: `flow-shim.vue.ts` → only in Vue package
 *
 * **Folder-level**: Pattern `(target)/`
 * - Unwraps folders matching the current target (removes `(target)/` wrapper)
 * - Deletes folders matching other targets entirely
 * - Example: `(vue)/utils.ts` → only in Vue package as `utils.ts`
 *
 * This eliminates the need for a separate postbuild cleanup script.
 *
 * @param options - Plugin configuration
 * @returns Mitosis plugin factory
 *
 * @example
 * ```ts
 * import { targetFilesPlugin } from 'mitosis-plugins';
 *
 * export default {
 *   targets: ['react', 'vue', 'svelte'],
 *   commonOptions: {
 *     plugins: [
 *       targetFilesPlugin({
 *         allTargets: ['react', 'vue', 'svelte']
 *       })
 *     ]
 *   }
 * };
 * ```
 */
export function targetFilesPlugin(options: TargetFilesOptions): MitosisPlugin {
    const { allTargets, debug = false } = options;

    // Build patterns for all targets
    const targetPatterns = allTargets.map(t => ({
        target: t,
        pattern: new RegExp(`\\.${t}\\.`)
    }));

    return () => ({
        name: 'target-files',
        build: {
            post: (targetContext, files) => {
                const currentTarget = targetContext.target;

                if (!files?.nonComponentFiles) {
                    if (debug) {
                        console.log(`[TargetFiles] No nonComponentFiles for ${currentTarget}`);
                    }
                    return;
                }

                // Process each file (handles both folder and file-level targeting)
                for (const file of files.nonComponentFiles) {
                    processFile(file, currentTarget, targetPatterns, allTargets, debug);
                }

                // Cleanup empty (target) directories after processing all files
                const outputPath = files.nonComponentFiles[0]?.outputDir || '';
                if (outputPath) {
                    cleanupEmptyTargetDirs(outputPath, allTargets, debug);
                }
            }
        }
    });
}

/**
 * Process a single non-component file.
 *
 * @param file - The output file info
 * @param currentTarget - The current build target
 * @param targetPatterns - Patterns for all targets
 * @param allTargets - List of all target names
 * @param debug - Whether to log debug info
 */
function processFile(
    file: OutputFile,
    currentTarget: string,
    targetPatterns: Array<{ target: string; pattern: RegExp }>,
    allTargets: string[],
    debug: boolean
): void {
    // Construct full path from outputDir + relative outputFilePath
    const filePath = path.join(file.outputDir, file.outputFilePath);
    const fileName = path.basename(filePath);

    // FIRST: Check for folder-level target scoping
    const { target: folderTarget, unwrappedPath } = extractTargetFromPath(filePath, allTargets);

    if (folderTarget !== null) {
        // File is inside a (target) folder
        if (folderTarget === currentTarget) {
            // This is our target - move file to unwrapped path
            moveFileToUnwrappedPath(filePath, unwrappedPath, debug);
        } else {
            // Different target - delete file
            deleteFile(filePath, debug);
        }
        return; // Folder-level scoping handled
    }

    // SECOND: Check for file-level target suffix (existing logic)
    for (const { target, pattern } of targetPatterns) {
        if (pattern.test(fileName)) {
            if (target === currentTarget) {
                // This file is for the current target - rename it (strip the .[target])
                renameTargetFile(filePath, pattern, debug);
            } else {
                // This file is for a different target - delete it
                deleteFile(filePath, debug);
            }
            return; // File matched a pattern, we're done
        }
    }
    // File doesn't match any target pattern - leave it alone
}

/**
 * Rename a target-specific file by stripping the .[target] suffix.
 *
 * @param filePath - The file path
 * @param pattern - The pattern to strip
 * @param debug - Whether to log debug info
 */
function renameTargetFile(filePath: string, pattern: RegExp, debug: boolean): void {
    const dir = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const newFileName = fileName.replace(pattern, '.');
    const newPath = path.join(dir, newFileName);

    try {
        // Copy to new name, then delete original
        fs.copyFileSync(filePath, newPath);
        fs.unlinkSync(filePath);

        if (debug) {
            console.log(`[TargetFiles] Renamed: ${fileName} → ${newFileName}`);
        }
    } catch (err) {
        console.error(`[TargetFiles] Failed to rename ${filePath}:`, err);
    }
}

/**
 * Delete a file that belongs to a different target.
 *
 * @param filePath - The file path
 * @param debug - Whether to log debug info
 */
function deleteFile(filePath: string, debug: boolean): void {
    try {
        fs.unlinkSync(filePath);

        if (debug) {
            console.log(`[TargetFiles] Deleted: ${path.basename(filePath)}`);
        }
    } catch (err) {
        console.error(`[TargetFiles] Failed to delete ${filePath}:`, err);
    }
}

/**
 * Check if a file path contains a (target) folder and return the unwrapped path.
 *
 * @param filePath - The file path to check
 * @param allTargets - List of all target names
 * @returns Object with target name (if found) and unwrapped path
 */
function extractTargetFromPath(
    filePath: string,
    allTargets: string[]
): { target: string | null; unwrappedPath: string } {
    for (const target of allTargets) {
        const pattern = `(${target})`;
        if (filePath.includes(pattern)) {
            // Remove (target) from path and clean up double slashes
            const unwrappedPath = filePath.replace(pattern, '').replace(/\/\//g, '/');
            return { target, unwrappedPath };
        }
    }
    return { target: null, unwrappedPath: filePath };
}

/**
 * Move file from (target) folder to unwrapped path.
 *
 * @param originalPath - Original file path with (target) folder
 * @param unwrappedPath - Destination path without (target) folder
 * @param debug - Whether to log debug info
 */
function moveFileToUnwrappedPath(
    originalPath: string,
    unwrappedPath: string,
    debug: boolean
): void {
    try {
        // Ensure destination directory exists
        const destDir = path.dirname(unwrappedPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        // Move file to unwrapped path
        fs.renameSync(originalPath, unwrappedPath);

        if (debug) {
            console.log(`[TargetFiles] Unwrapped: ${path.basename(originalPath)} (from (target) folder)`);
        }
    } catch (err) {
        console.error(`[TargetFiles] Failed to unwrap ${originalPath}:`, err);
    }
}

/**
 * Clean up empty (target) directories after processing all files.
 *
 * @param outputPath - Root output directory
 * @param allTargets - List of all target names
 * @param debug - Whether to log debug info
 */
function cleanupEmptyTargetDirs(
    outputPath: string,
    allTargets: string[],
    debug: boolean
): void {
    const targetDirPatterns = allTargets.map(t => `(${t})`);

    function removeEmptyDirs(dir: string): void {
        if (!fs.existsSync(dir)) return;

        const entries = fs.readdirSync(dir, { withFileTypes: true });

        // Recurse into subdirectories first
        for (const entry of entries) {
            if (entry.isDirectory()) {
                removeEmptyDirs(path.join(dir, entry.name));
            }
        }

        // Check if this directory is now empty and is a (target) dir
        const currentEntries = fs.readdirSync(dir);
        if (currentEntries.length === 0) {
            const dirName = path.basename(dir);
            if (targetDirPatterns.some(p => dirName === p)) {
                fs.rmdirSync(dir);
                if (debug) {
                    console.log(`[TargetFiles] Cleaned up empty dir: ${dirName}`);
                }
            }
        }
    }

    removeEmptyDirs(outputPath);
}

// Also export as default for backwards compatibility
export default targetFilesPlugin;
