#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

/**
 * Astro Types Generator
 * Iterates through a folder (recursively), finds all .astro files,
 * extracts `interface Props` and generates module declarations in components.d.ts
 */

const args = process.argv.slice(2);
const folderArg = args.find(a => !a.startsWith('--'));
const prefixArg = args.find(a => a.startsWith('--prefix='))?.split('=')[1] || '';

if (!folderArg) {
  console.error('Usage: astro-types <folder> [--prefix=<prefix>]');
  process.exit(1);
}

const targetFolder = path.resolve(folderArg);

function getAstroFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAstroFiles(fullPath));
    } else if (file.endsWith('.astro')) {
      results.push(fullPath);
    }
  });
  return results;
}

function extractInterfaceBody(content) {
  const match = content.match(/(?:export\s+)?interface\s+Props\s*{/);
  if (!match) return null;
  const startIdx = match.index + match[0].length;
  let braceCount = 1;
  let i = startIdx;
  while (braceCount > 0 && i < content.length) {
    if (content[i] === '{') braceCount++;
    else if (content[i] === '}') braceCount--;
    i++;
  }
  if (braceCount === 0) {
    return content.substring(startIdx, i - 1);
  }
  return null;
}

const astroFiles = getAstroFiles(targetFolder);

if (astroFiles.length === 0) {
  console.log('No .astro files found.');
  process.exit(0);
}

const allDeclarations = [];

for (const file of astroFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const frontmatterMatch = content.match(/---([\s\S]*?)---/);
  if (!frontmatterMatch) continue;

  const frontmatter = frontmatterMatch[1];
  const propsBody = extractInterfaceBody(frontmatter);
  if (propsBody === null) continue;

  const componentName = path.basename(file, '.astro');
  const relativePath = path.relative(targetFolder, file);
  const modulePath = `${prefixArg}${relativePath}`;
  
  const formattedBody = propsBody.split('\n').map(line => line.trim()).filter(Boolean).map(line => `    ${line}`).join('\n');

  allDeclarations.push(`declare module "${modulePath}" {
  interface ${componentName}Props {
${formattedBody}
  }

  export default function ${componentName}(props: ${componentName}Props): any;
}`);

}

const outputPath = path.join(targetFolder, 'components.d.ts');
const fileContent = allDeclarations.join('\n\n') + '\n';
fs.writeFileSync(outputPath, fileContent);
console.log(`Generated ${outputPath}`);

