import {ChildProcess} from 'child_process';
import path from 'path';
import config from './config.json'
import spawn from 'cross-spawn';
import fs from "fs";
import kill from 'kill-port'
import detect from 'detect-port'

import chalk from 'chalk';
import {displayExtractedFiles} from "./utils";

export default class MongoManager {
  port = 27017
  mongoDir = config.mongoDir
  mongod = path.join(config.mongoDir, 'bin', 'mongod')


  mongoProcess: ChildProcess | undefined

  kill = false
  constructor(options:{
    port: number
  } = {
    port: 27017
  }) {

    // (async () => {
    //   const mongoDir = await displayExtractedFiles(config.mongoDir)
    //
    //   if(mongoDir) {
    //     this.mongod = path.join(mongoDir, 'bin', 'mongod')
    //   }
    //
    //
    // })()

    this.port = options.port
  }

  async setup(option: {
    mongoDir?: string
  }) {
    if(option.mongoDir) {
      const mongoDir = await displayExtractedFiles(option.mongoDir)

      if(mongoDir == null) {
        throw new Error("Error: setup config mongoDir is not found")
      }

      this.mongod = path.join(mongoDir, 'bin', 'mongod')

      // @ts-ignore
      config.mongoDir = mongoDir

      this.mongoDir = mongoDir

      fs.writeFileSync(path.resolve(__dirname, './config.json'), JSON.stringify(config))
    }

  }


  async start() {
    const dbPath = path.join(this.mongoDir, 'data', 'db');
    const logPath = path.join(this.mongoDir, 'data', 'log', 'mongod.log');

    const port = await detect(this.port)
    if(this.port !== port) {
      await kill(this.port)
    }


    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    if (!fs.existsSync(path.dirname(logPath))) {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
    }

    const args = [`--port`, `${this.port}`, `--dbpath`, `${dbPath}`, `--logpath`, `${logPath}`];

    if (process.platform !== 'win32') {
      args.push('--fork');
    }

    const child = spawn(this.mongod, args, { stdio: 'inherit' });

    this.mongoProcess = child

    return new Promise<void>((resolve, reject) => {
      this.printServerStartInfo(this.port, dbPath, logPath)

      child.on('error', (error: Error) => {
        reject(new Error(`Failed to start MongoDB server: ${error.message}`));
      });

      child.on('exit', (code: number) => {
        if (code === 0) {
          resolve();
        } else {
          if (this.kill) {
            this.kill = false
            return
          }
          reject(new Error(`MongoDB server exited with code ${code}`));
        }
      });
    });
  }

  async stop() {
    this.kill = true
    this.mongoProcess?.kill()
    const port = await detect(this.port)
    if(this.port !== port) {
      await kill(this.port)
    }
  }

  printServerStartInfo(port: number, dbPath: string, logPath: string): void {
    console.log(chalk.green('==================================='));
    console.log(chalk.green(' MongoDB server started successfully '));
    console.log(chalk.green('==================================='));

    console.log(chalk.blue(`URL:       mongodb://localhost:${this.port}/`));
    console.log(chalk.blue(`Port:      ${port}`));
    console.log(chalk.blue(`DB Path:   ${dbPath}`));
    console.log(chalk.blue(`Log Path:  ${logPath}`));
    console.log(chalk.green('==================================='));
  }
}