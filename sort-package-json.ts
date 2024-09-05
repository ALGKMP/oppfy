import fs from 'fs/promises';
import path from 'path';

type PackageJson = {
  [key: string]: any;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const sortObjectKeys = <T extends Record<string, any>>(obj: T): T => {
  return Object.keys(obj).sort().reduce((result, key) => {
    (result as Record<string, any>)[key] = obj[key];
    return result;
  }, {} as T);
};

const sortPackageJson = async (filePath: string): Promise<void> => {
  const content = await fs.readFile(filePath, 'utf-8');
  const packageJson: PackageJson = JSON.parse(content);

  // Sort top-level keys
  const sortedPackageJson = sortObjectKeys(packageJson);

  // Sort nested objects
  ['scripts', 'dependencies', 'devDependencies', 'peerDependencies'].forEach((key) => {
    if (sortedPackageJson[key]) {
      sortedPackageJson[key] = sortObjectKeys(sortedPackageJson[key]);
    }
  });

  await fs.writeFile(filePath, JSON.stringify(sortedPackageJson, null, 2) + '\n');
  console.log(`Sorted: ${filePath}`);
};

const findPackageJsonFiles = async (dir: string): Promise<string[]> => {
  const files = await fs.readdir(dir, { withFileTypes: true });
  const packageJsonFiles: string[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      packageJsonFiles.push(...await findPackageJsonFiles(fullPath));
    } else if (file.name === 'package.json') {
      packageJsonFiles.push(fullPath);
    }
  }

  return packageJsonFiles;
};

const sortAllPackageJsonFiles = async (): Promise<void> => {
  const rootDir = process.cwd();
  const packageJsonFiles = await findPackageJsonFiles(rootDir);

  for (const file of packageJsonFiles) {
    await sortPackageJson(file);
  }

  console.log('All package.json files have been sorted.');
};

sortAllPackageJsonFiles().catch(console.error);