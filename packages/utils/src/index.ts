
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

import { clsx, type ClassValue } from "clsx";

import { twMerge } from "tailwind-merge";

/* ====================================================== */
/* ENV */
/* ====================================================== */

const env = (
  import.meta as ImportMeta & {
    env?: Record<
      string,
      string
    >;
  }
).env;

/* ====================================================== */
/* TOKEN KEYS */
/* ====================================================== */

export const ACCESS_TOKEN_KEY =
  env?.VITE_AUTH_TOKEN_KEY ??
  "access_token";

export const REFRESH_TOKEN_KEY =
  env?.VITE_AUTH_REFRESH_TOKEN_KEY ??
  "refresh_token";

const LEGACY_ACCESS_TOKEN_KEY =
  "ams.accessToken";

const LEGACY_REFRESH_TOKEN_KEY =
  "ams.refreshToken";

/* ====================================================== */
/* API URL */
/* ====================================================== */

const API_BASE_URL =
  env?.VITE_API_BASE_URL ??
  "http://localhost:4444/v1";

/* ====================================================== */
/* CLASSNAME */
/* ====================================================== */

export function cn(
  ...inputs: ClassValue[]
): string {

  return twMerge(
    clsx(inputs)
  );
}

/* ====================================================== */
/* TOKEN HELPERS */
/* ====================================================== */

export function getAccessToken():
  | string
  | null {

  return (
    localStorage.getItem(
      ACCESS_TOKEN_KEY
    ) ??
    localStorage.getItem(
      LEGACY_ACCESS_TOKEN_KEY
    ) ??
    localStorage.getItem(
      "token"
    )
  );
}

export function getRefreshToken():
  | string
  | null {

  return (
    localStorage.getItem(
      REFRESH_TOKEN_KEY
    ) ??
    localStorage.getItem(
      LEGACY_REFRESH_TOKEN_KEY
    )
  );
}

export function setTokens(
  accessToken: string,
  refreshToken: string
): void {

  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken
  );

  localStorage.setItem(
    REFRESH_TOKEN_KEY,
    refreshToken
  );

  /* legacy */

  localStorage.setItem(
    "token",
    accessToken
  );

  localStorage.removeItem(
    LEGACY_ACCESS_TOKEN_KEY
  );

  localStorage.removeItem(
    LEGACY_REFRESH_TOKEN_KEY
  );
}

export function clearTokens(): void {

  localStorage.removeItem(
    ACCESS_TOKEN_KEY
  );

  localStorage.removeItem(
    REFRESH_TOKEN_KEY
  );

  localStorage.removeItem(
    LEGACY_ACCESS_TOKEN_KEY
  );

  localStorage.removeItem(
    LEGACY_REFRESH_TOKEN_KEY
  );

  localStorage.removeItem(
    "token"
  );
}

/* ====================================================== */
/* AXIOS */
/* ====================================================== */

export const http =
  axios.create({

    baseURL:
      API_BASE_URL,

    timeout: 30000,

    withCredentials:
      false,

    headers: {
      "Content-Type":
        "application/json",
    },
  });

/* ====================================================== */
/* REQUEST */
/* ====================================================== */

http.interceptors.request.use(

  (
    config:
      InternalAxiosRequestConfig
  ) => {

    const token =
      getAccessToken();

    if (
      token &&
      config.headers
    ) {

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

/* ====================================================== */
/* REFRESH STATE */
/* ====================================================== */

let isRefreshing =
  false;

let failedQueue: Array<{
  resolve: (
    token: string
  ) => void;

  reject: (
    error: unknown
  ) => void;
}> = [];

/* ====================================================== */
/* QUEUE */
/* ====================================================== */

function processQueue(
  error: unknown,
  token?: string
) {

  failedQueue.forEach(
    (promise) => {

      if (error) {

        promise.reject(
          error
        );

      } else {

        promise.resolve(
          token || ""
        );
      }
    }
  );

  failedQueue = [];
}

/* ====================================================== */
/* RESPONSE */
/* ====================================================== */

http.interceptors.response.use(

  (response) => response,

  async (
    error: AxiosError
  ) => {

    const originalRequest =
      error.config as
        | (InternalAxiosRequestConfig & {
            _retry?: boolean;
          })
        | undefined;

    const status =
      error.response
        ?.status;

    console.error(
      "API ERROR:",
      status,
      error.response?.data
    );

    /* skip invalid */

    if (
      !originalRequest
    ) {

      return Promise.reject(
        error
      );
    }

    /* ignore auth endpoints */

    const isAuthRequest =
      originalRequest.url?.includes(
        "/auth/login"
      ) ||
      originalRequest.url?.includes(
        "/auth/refresh"
      );

    if (isAuthRequest) {

      return Promise.reject(
        error
      );
    }

    /* ignore non-401 */

    if (
      status !== 401
    ) {

      return Promise.reject(
        error
      );
    }

    /* already retried */

    if (
      originalRequest._retry
    ) {

      clearTokens();

      if (
        typeof window !==
        "undefined"
      ) {

        window.location.href =
          "/login";
      }

      return Promise.reject(
        error
      );
    }

    /* queue */

    if (isRefreshing) {

      return new Promise(
        (
          resolve,
          reject
        ) => {

          failedQueue.push({
            resolve,
            reject,
          });
        }
      ).then(
        (token) => {

          if (
            originalRequest.headers
          ) {

            originalRequest.headers.Authorization =
              `Bearer ${token}`;
          }

          return http(
            originalRequest
          );
        }
      );
    }

    originalRequest._retry =
      true;

    isRefreshing = true;

    const refreshToken =
      getRefreshToken();

    if (
      !refreshToken
    ) {

      clearTokens();

      isRefreshing =
        false;

      return Promise.reject(
        error
      );
    }

    try {

      const response =
        await axios.post<{
          access_token: string;
          refresh_token: string;
        }>(
          `${API_BASE_URL}/auth/refresh`,
          {
            refresh_token:
              refreshToken,
          }
        );

      const {
        access_token,
        refresh_token,
      } = response.data;

      setTokens(
        access_token,
        refresh_token
      );

      processQueue(
        null,
        access_token
      );

      if (
        originalRequest.headers
      ) {

        originalRequest.headers.Authorization =
          `Bearer ${access_token}`;
      }

      return http(
        originalRequest
      );

    } catch (
      refreshError
    ) {

      processQueue(
        refreshError
      );

      clearTokens();

      if (
        typeof window !==
        "undefined"
      ) {

        window.location.href =
          "/login";
      }

      return Promise.reject(
        refreshError
      );

    } finally {

      isRefreshing =
        false;
    }
  }
);

/* ====================================================== */
/* NORMALIZERS */
/* ====================================================== */

const DOMAIN_KEYS = [

  "residents",
  "visitors",
  "units",
  "complaints",
  "invoices",
  "expenses",
  "staff",
  "blocks",
  "passes",
  "deliveries",
  "alerts",
  "vehicles",
  "pets",
  "leases",

] as const;

export function normalizeList<T>(
  response: unknown
): T[] {

  if (!response)
    return [];

  if (
    Array.isArray(
      response
    )
  ) {

    return response as T[];
  }

  if (
    typeof response !==
    "object"
  ) {

    return [];
  }

  const record =
    response as Record<
      string,
      unknown
    >;

  if (
    Array.isArray(
      record.data
    )
  ) {

    return record.data as T[];
  }

  if (
    Array.isArray(
      record.items
    )
  ) {

    return record.items as T[];
  }

  for (const key of DOMAIN_KEYS) {

    if (
      Array.isArray(
        record[key]
      )
    ) {

      return record[
        key
      ] as T[];
    }
  }

  return [];
}

export function normalizeTotal(
  response: unknown
): number {

  if (!response)
    return 0;

  if (
    Array.isArray(
      response
    )
  ) {

    return response.length;
  }

  const record =
    response as Record<
      string,
      unknown
    >;

  return Number(

    record.total ??

      (
        record.pagination as
          | Record<
              string,
              unknown
            >
          | undefined
      )?.total ??

      normalizeList(
        response
      ).length
  );
}

export function extractData<T>(
  response: unknown
): T[] {

  return normalizeList<T>(
    response
  );
}

/* ====================================================== */
/* LABELS */
/* ====================================================== */

export function getRecordLabel(
  record: Record<
    string,
    unknown
  >
): string {

  return String(

    record.full_name ??

      record.name ??

      record.title ??

      record.asset_name ??

      record.visitor_name ??

      record.invoice_number ??

      record.unit_number ??

      record.block_name ??

      record.id ??

      "Record"
  );
}

/* ====================================================== */
/* FORMATTERS */
/* ====================================================== */

export function formatCurrency(
  value?: number
): string {

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(
    value ?? 0
  );
}
