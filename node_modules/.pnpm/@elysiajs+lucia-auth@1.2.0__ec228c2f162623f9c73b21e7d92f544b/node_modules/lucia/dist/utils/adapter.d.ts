import type { Adapter, InitializeAdapter, SessionAdapter, UserAdapter } from "../index.js";
export declare const joinAdapters: (baseAdapter: InitializeAdapter<Adapter | SessionAdapter | UserAdapter>, ...adapters: Array<Partial<Adapter> | InitializeAdapter<Adapter | SessionAdapter | UserAdapter>>) => InitializeAdapter<Adapter>;
