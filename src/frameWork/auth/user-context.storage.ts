import { AsyncLocalStorage } from "async_hooks";

export const userContextStorage = new AsyncLocalStorage<{ userId: string | null }>();