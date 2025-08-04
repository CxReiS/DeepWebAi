export declare const scrypt: (password: Uint8Array, salt: Uint8Array, options: ScryptOptions) => Promise<Uint8Array>;
type ScryptOptions = {
    N: number;
    r: number;
    p: number;
    dkLen?: number;
    maxmem?: number;
};
export {};
