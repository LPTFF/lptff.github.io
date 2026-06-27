export function getRequestGet(url: string, param?: unknown): Promise<unknown>;
export function getRequestPost(url: string, param?: unknown): Promise<unknown>;
export function getRequestHead(url: string, param?: unknown): Promise<unknown>;
export function isPC(): boolean;
export function gotoOutPage(url: string): void;
export function initEruda(): Promise<void>;
