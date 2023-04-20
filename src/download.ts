import https from 'https';
import fs from 'fs';
import tar from 'tar';
import unzipper from 'unzipper';
import ProgressBar from 'progress';
import findUp from 'find-up';
import path from 'path';
import {IncomingMessage} from 'http';
import {displayExtractedFiles} from "./utils";

import config from './config.json'
import * as process from "process";


// async function getProjectRoot(): Promise<string> {
//   const packageName = 'mongoma';
//   const maxAttempts = 1000;
//   const delayBetweenAttempts = 1000;
//
//   function hasDependency(packageJsonPath: string): boolean {
//     if (!fs.existsSync(packageJsonPath)) {
//       return false;
//     }
//
//     const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
//     return !!(packageJson.dependencies && packageJson.dependencies[packageName]);
//   }
//
//   function findProjectRoot(startDir: string): string | null {
//     const packageJsonPath = path.join(startDir, 'package.json');
//
//     if (hasDependency(packageJsonPath)) {
//       return startDir;
//     }
//
//     const subdirs = fs.readdirSync(startDir).filter((subdir) => {
//       const subdirPath = path.join(startDir, subdir);
//       return fs.statSync(subdirPath).isDirectory() && subdir !== 'node_modules';
//     });
//
//     for (const subdir of subdirs) {
//       const subdirPath = path.join(startDir, subdir);
//       const foundProjectRoot = findProjectRoot(subdirPath);
//       if (foundProjectRoot) {
//         return foundProjectRoot;
//       }
//     }
//
//     return null;
//   }
//
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     const projectRoot = findProjectRoot(process.cwd());
//
//     if (projectRoot) {
//       return projectRoot;
//     }
//
//     // Wait for a while before the next attempt
//     await new Promise((resolve) => setTimeout(resolve, delayBetweenAttempts));
//   }
//
//   throw new Error(`Cannot find a package.json with the '${packageName}' dependency after ${maxAttempts} attempts. 3`);
// }


// function getProjectRoot(): string {
//   const mongomaPath = require.resolve('mongoma');
//   const nodeModulesPath = mongomaPath.split('/node_modules/')[0] + '/node_modules/';
//   const projectRoot = path.resolve(nodeModulesPath, '..');
//
//   // Check if the subproject's node_modules directory exists
//   const subprojectNodeModules = path.resolve(projectRoot, 'node_modules');
//   if (fs.existsSync(subprojectNodeModules)) {
//     // The subproject's node_modules directory exists, return its project root
//     return projectRoot;
//   } else {
//     // The subproject's node_modules directory does not exist, find the parent project root
//     const parentProjectRoot = path.resolve(projectRoot, '..');
//     return parentProjectRoot;
//   }
// }

async function getProjectRoot(): Promise<string> {
  const packageJsonPath = await findUp('package.json', {cwd: path.join(process.cwd(), '..')});

  if (packageJsonPath) {
    return path.dirname(packageJsonPath);
  }


  if (packageJsonPath === null) {
    throw new Error('Unable to find the project root.');
  }

  return ''
}

async function getMongoServerRoot(): Promise<string> {
  const projectRoot = await getProjectRoot();

  const configFilePath = path.join(projectRoot, '.mongomarc');

  if (fs.existsSync(configFilePath)) {
    const configFileContent = fs.readFileSync(configFilePath, 'utf-8');
    const configFileJSON = JSON.parse(configFileContent);

    if (configFileJSON.mongoServerRoot) {
      return path.join(projectRoot, configFileJSON.mongoServerRoot);
    }
  }

  return projectRoot;
}

export async function downloadAndExtractMongoDB(version: string, url: string, extension: string): Promise<void> {
  // @ts-ignore
  const packagePath = path.dirname(require.main.filename);
  // const projectPath = await getProjectRoot();
  const mongoPath = await getMongoServerRoot();
  const outputPath = path.join(mongoPath, 'mongo');

  if (fs.existsSync(outputPath)) {
    console.log(`MongoDB version ${version} already installed.`);
    return;
  }

  fs.mkdirSync(outputPath, {recursive: true});

  console.log(`Downloading ${version}...`);

  const response = await httpsGetAsync(url);
  const contentLength = parseInt(response.headers['content-length'] as string, 10);
  const progressBar = new ProgressBar('[:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: contentLength,
  });

  response.on('data', (chunk: Buffer) => {
    progressBar.tick(chunk.length);
  });

  if (extension === 'tgz') {
    response.pipe(tar.x({cwd: outputPath}))
      .on('finish', async () => {
        console.log(`Installed ${version}`);
        // @ts-ignore
        config.mongoDir = await displayExtractedFiles(outputPath)
        fs.writeFileSync(path.join(packagePath, './config.json'), JSON.stringify(config))
      })
      .on('error', (err: Error) => {
        console.error(`Error installing ${version}: ${err}`);
      });
  } else if (extension === 'zip') {
    response.pipe(unzipper.Extract({path: outputPath}))
      .on('finish', async () => {
        console.log(`Installed ${version}`);
        // @ts-ignore
        config.mongoDir = await displayExtractedFiles(outputPath)
        fs.writeFileSync(path.join(packagePath, './config.json'), JSON.stringify(config))

      })
      .on('error', (err: Error) => {
        console.error(`Error installing ${version}: ${err}`);
      });
  }
}

function httpsGetAsync(url: string): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusMessage}`));
      }
      resolve(response);
    });
  });
}

export default downloadAndExtractMongoDB;
