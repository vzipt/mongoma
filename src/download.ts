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


async function getProjectRoot(): Promise<string> {

  const nodeModulesPath = await findUp('node_modules', { type: 'directory' });

  if (!nodeModulesPath) {
    throw new Error('Cannot find node_modules directory in the project.');
  }

  const packageName = 'mongoma';
  const packagePath = path.join(nodeModulesPath, packageName);

  if (fs.existsSync(packagePath)) {
    return path.dirname(nodeModulesPath);
  } else {
    const workspaceRoot = path.dirname(path.dirname(nodeModulesPath));
    const packageJsonPath = await findUp('package.json', { cwd: workspaceRoot });

    if (!packageJsonPath) {
      return process.cwd()
    }

    return path.dirname(packageJsonPath);
  }
}

export async function downloadAndExtractMongoDB(version: string, url: string, extension: string): Promise<void> {
  // @ts-ignore
  const packagePath = path.dirname(require.main.filename);
  const projectPath = await getProjectRoot();
  const outputPath = path.join(projectPath, 'mongo');

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
