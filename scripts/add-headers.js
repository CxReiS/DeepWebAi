const fs = require('fs');
const path = require('path');

const root = process.cwd();
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const skipDirs = new Set([
  'node_modules',
  '.git',
  '.turbo',
  'playwright-report',
  'test-results',
  'dist',
  'build',
  'coverage',
  '.vscode',
  '.qodo',
  '.continue',
  '.cursor',
]);

const header = `/*
 * Copyright (c) 2025 [DeepWebXs]
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

`;

function shouldProcess(file) {
  return exts.has(path.extname(file));
}

function hasHeader(content) {
  const head = content.slice(0, 800);
  return (
    head.includes('Licensed under the Apache License, Version 2.0') ||
    head.includes('Copyright (c) 2025 [DeepWebXs]')
  );
}

function processFile(p) {
  try {
    let content = fs.readFileSync(p, 'utf8');
    if (hasHeader(content)) return false;

    if (content.startsWith('#!')) {
      const idx = content.indexOf('\n');
      if (idx !== -1) {
        content = content.slice(0, idx + 1) + header + content.slice(idx + 1);
      } else {
        content = content + '\n' + header;
      }
    } else {
      content = header + content;
    }
    fs.writeFileSync(p, content);
    return true;
  } catch (e) {
    console.error('skip (err):', p, e.message);
    return false;
  }
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.isFile() && shouldProcess(p)) {
      const changed = processFile(p);
      if (changed) console.log('header added', path.relative(root, p));
    }
  }
}

walk(root);
