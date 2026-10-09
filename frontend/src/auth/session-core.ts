import { ApiError, type RequestOptions } from "../api/client";
import { authSchema, type Auth } from "./schemas";
export interface TokenStorage {
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
  clear(): Promise<void>;
}
type Send = <T>(
  path: string,
  options?: RequestOptions,
  signal?: AbortSignal,
) => Promise<T>;
export class Session {
  private auth: Auth | null = null;
  private refreshToken: string | null = null;
  private flight: Promise<Auth> | null = null;
  private epoch = 0;
  private writes: Promise<void> = Promise.resolve();
  constructor(
    private storage: TokenStorage,
    private send: Send,
    private changed: (auth: Auth | null) => void,
  ) {}
  private persist(task: () => Promise<void>) {
    const result = this.writes.then(task, task);
    this.writes = result.catch(() => {});
    return result;
  }
  async accept(value: unknown, epoch = this.epoch) {
    const auth = authSchema.parse(value);
    if (epoch !== this.epoch) throw new Error("Session cancelled");
    await this.persist(() => this.storage.write(auth.refresh_token));
    if (epoch !== this.epoch) throw new Error("Session cancelled");
    this.refreshToken = auth.refresh_token;
    this.auth = auth;
    this.changed(auth);
    return auth;
  }
  async restore() {
    const epoch = this.epoch;
    const token = await this.storage.read();
    if (epoch !== this.epoch) return;
    this.refreshToken = token;
    if (token) await this.refresh();
  }
  async refresh(): Promise<Auth> {
    if (this.flight) return this.flight;
    if (!this.refreshToken) throw new ApiError(401, "Session expired");
    const token = this.refreshToken,
      epoch = this.epoch;
    const flight = (async () => {
      try {
        return await this.accept(
          await this.send("/api/auth/refresh", {
            method: "POST",
            body: { refresh_token: token },
          }),
          epoch,
        );
      } catch (error) {
        if (
          epoch === this.epoch &&
          error instanceof ApiError &&
          [401, 403].includes(error.status)
        )
          await this.clear();
        throw error;
      }
    })();
    this.flight = flight;
    try {
      return await flight;
    } finally {
      if (this.flight === flight) this.flight = null;
    }
  }
  async authenticated<T>(
    path: string,
    options: RequestOptions = {},
    signal?: AbortSignal,
  ): Promise<T> {
    const owner = options.ownerId ?? this.auth?.user.id;
    if (!this.auth) await this.refresh();
    if (!this.auth) throw new ApiError(401, "Session expired");
    if (owner && this.auth.user.id !== owner)
      throw new ApiError(401, "Account changed");
    const access = this.auth.access_token;
    try {
      return await this.send<T>(path, { ...options, token: access }, signal);
    } catch (error) {
      if (
        !(error instanceof ApiError) ||
        error.status !== 401 ||
        signal?.aborted
      )
        throw error;
      const auth =
        this.auth?.access_token !== access ? this.auth : await this.refresh();
      if (!auth) throw new ApiError(401, "Session expired");
      if (owner && auth.user.id !== owner)
        throw new ApiError(401, "Account changed");
      try {
        return await this.send<T>(
          path,
          { ...options, token: auth.access_token },
          signal,
        );
      } catch (retryError) {
        if (retryError instanceof ApiError && retryError.status === 401)
          await this.clear();
        throw retryError;
      }
    }
  }
  async clear() {
    this.epoch++;
    this.auth = null;
    this.refreshToken = null;
    this.changed(null);
    await this.persist(() => this.storage.clear());
  }
  async logout() {
    const token = this.refreshToken;
    await this.clear();
    if (token)
      await this.send("/api/auth/logout", {
        method: "POST",
        body: { refresh_token: token },
      });
  }
}
