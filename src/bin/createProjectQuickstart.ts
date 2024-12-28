import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { LIBNAME, ProjectData } from '@/bin/index.ts';

export type FileContentReplacement = {
  path: string;
  searchValue: RegExp;
  replaceValue: string;
};

export async function copyDirectoryWithReplacement(
  source: string,
  destination: string,
  fileContentReplacements: FileContentReplacement[],
) {
  await fs.mkdir(destination, { recursive: true });

  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryWithReplacement(
        srcPath,
        destPath,
        fileContentReplacements,
      );
    } else {
      let content = await fs.readFile(srcPath, 'utf8');

      fileContentReplacements.forEach((replacement) => {
        if (srcPath.endsWith(replacement.path)) {
          const newContent = content.replace(
            replacement.searchValue,
            replacement.replaceValue,
          );

          content = newContent;
        }
      });

      await fs.writeFile(destPath, content);
    }
  }
}

export async function createProjectQuickstart(projectData: ProjectData) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const replacements = [
    {
      path: 'index.html',
      searchValue: new RegExp(`${LIBNAME} - App`, 'g'),
      replaceValue: `${LIBNAME} - ${projectData.name}`,
    },
    {
      path: 'package.json',
      searchValue: /"name": "app-project"/g,
      replaceValue: `"name": "${projectData.name}"`,
    },
    {
      path: 'index.ts',
      searchValue: new RegExp(`${LIBNAME} is running!`, 'g'),
      replaceValue: `${projectData.name} is running!`,
    },
  ];

  const boilerPlateFolder = path.join(__dirname, 'quickstart_app');
  await copyDirectoryWithReplacement(
    boilerPlateFolder,
    projectData.projectPath,
    replacements,
  );
}
