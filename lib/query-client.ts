import { fetch } from "expo/fetch";
import { QueryClient, QueryFunction } from "@tanstack/react-query";

export function getApiUrl(): string {
  let host = process.env.EXPO_PUBLIC_DOMAIN;

  if (!host) {
    throw new Error("EXPO_PUBLIC_DOMAIN is not set");
  }

  let url = new URL(`https://${host}`);

  return url.href;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

type DebugLogFn = (entry: Record<string, unknown>) => void;
let _debugLogFn: DebugLogFn | null = null;

export function setDebugLogFn(fn: DebugLogFn | null) {
  _debugLogFn = fn;
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);
  const start = Date.now();

  try {
    const res = await fetch(url.toString(), {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    const latency = Date.now() - start;

    if (_debugLogFn) {
      _debugLogFn({
        type: "api",
        method: method.toUpperCase(),
        endpoint: route,
        status: res.status,
        latency,
        request: data,
      });
    }

    await throwIfResNotOk(res);
    return res;
  } catch (err) {
    const latency = Date.now() - start;
    if (_debugLogFn) {
      _debugLogFn({
        type: "api",
        method: method.toUpperCase(),
        endpoint: route,
        status: 0,
        latency,
        message: err instanceof Error ? err.message : String(err),
        request: data,
      });
    }
    throw err;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);
    const route = queryKey.join("/");
    const start = Date.now();

    const res = await fetch(url.toString(), {
      credentials: "include",
    });

    const latency = Date.now() - start;

    if (_debugLogFn) {
      _debugLogFn({
        type: "api",
        method: "GET",
        endpoint: route,
        status: res.status,
        latency,
      });
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
