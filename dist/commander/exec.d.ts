export declare type ExecOptions = {
    cwd?: string;
    env?: string;
};
export default function exec(name: string, actions: string[], options?: ExecOptions): Promise<unknown>;
