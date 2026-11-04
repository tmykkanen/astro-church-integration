export type Ok<T> = { ok: true } & T;
export type Err<E = string> = { ok: false; error: E };
