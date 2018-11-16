import { promisify } from "util";
import * as glob from "glob";
import * as fs from "fs";
import * as child_process from "child_process";
import split = require('split');
import { Readable } from "stream";


export interface IoEffect {
    stat(path: fs.PathLike): Promise<fs.Stats>;
    readFile(path: fs.PathLike): Promise<string>;
    writeFile(path: fs.PathLike, content: string): Promise<void>;
    exec(command: string, options?: child_process.ExecOptions): Promise<ExecReturn>;
    execStream(command: string, options?: child_process.ExecOptions): Promise<ExecStreamReturn>;
    globSync(pattern: string, options?: glob.IOptions): string[]
}

const stat = promisify(fs.stat)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const exec = promisify(child_process.exec)
type ExecReturn = { stdout: string, stderr: string };
type ExecStreamReturn = { stdout: Readable, stderr: Readable, finish: Promise<number> };

export class RealIoEffect implements IoEffect {
    stat(path: fs.PathLike): Promise<fs.Stats> {
        return stat(path);
    }

    readFile(path: fs.PathLike): Promise<string> {
        return readFile(path, { encoding: 'utf8' });
    }

    writeFile(path: fs.PathLike, content: string): Promise<void> {
        return writeFile(path, content);
    }

    exec(command: string, options?: child_process.ExecOptions): Promise<ExecReturn> {
        return exec(command, options);
    }

    async execStream(command: string, options?: child_process.ExecOptions): Promise<ExecStreamReturn> {
        const process = child_process.exec(command, options);
        return {
            stdout: process.stdout.pipe(split(undefined, null, { trailing: false } as any)),
            stderr: process.stderr.pipe(split(undefined, null, { trailing: false } as any)),
            finish: new Promise<number>(resolve => process.on('close', code => resolve(code))),
        };
    }

    globSync(pattern: string, options?: glob.IOptions): string[] {
        options = Object.assign({ cwd: '.' }, options);
        return glob.sync(pattern, options);
    }
}
