import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const env = (
  import.meta as ImportMeta & {
    env?: Record<string, string>;
  }
).env;

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

const API_BASE_URL =
  env?.VITE_API_BASE_URL ??
  "http://localhost:4444/v1";

export function cn(
  ...inputs: ClassValue[]
): string {
  return twMerge(clsx(inputs));
}

export const http = axios.create({
  baseURL: API_BASE_URL,

  headers: {
    "Content-Type":
      "application/json",
  },
});

http.interceptors.request.use(
  (config) => {

    const token =
      localStorage.getItem(
        ACCESS_TOKEN_KEY
      ) ??
      localStorage.getItem(
        LEGACY_ACCESS_TOKEN_KEY
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

let isRefreshing = false;

let failedQueue: Array<{
  resolve: (
    token: string
  ) => void;

  reject: (
    err: unknown
  ) => void;
}> = [];

function processQueue(
  error: unknown,
  token?: string
) {

  for (const prom of failedQueue) {

    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  }

  failedQueue = [];
}

http.interceptors.response.use(

  (response) => response,

  async (error) => {

    const original =
      error.config as typeof error.config & {
        _retry?: boolean;
      };

    if (
      error.response?.status !== 401 ||
      original._retry
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {

      return new Promise(
        (resolve, reject) => {

          failedQueue.push({
            resolve,
            reject,
          });
        }
      ).then((token) => {

        original.headers.Authorization =
          `Bearer ${token}`;

        return http(original);
      });
    }

    original._retry = true;

    isRefreshing = true;

    const refreshToken =
      localStorage.getItem(
        REFRESH_TOKEN_KEY
      ) ??
      localStorage.getItem(
        LEGACY_REFRESH_TOKEN_KEY
      );

    if (!refreshToken) {

      clearTokens();

      isRefreshing = false;

      if (
        typeof window !==
        "undefined"
      ) {
        window.location.href =
          "/login";
      }

      return Promise.reject(error);
    }

    try {

      const { data } =
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

      setTokens(
        data.access_token,
        data.refresh_token
      );

      processQueue(
        null,
        data.access_token
      );

      original.headers.Authorization =
        `Bearer ${data.access_token}`;

      return http(original);

    } catch (refreshError) {

      processQueue(refreshError);

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

      isRefreshing = false;
    }
  }
);

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
}

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
  ).format(value ?? 0);
}

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

  if (!response) {
    return [];
  }

  // direct array
  if (Array.isArray(response)) {
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

  // axios response
  if (
    Array.isArray(record.data)
  ) {
    return record.data as T[];
  }

  // items wrapper
  if (
    Array.isArray(record.items)
  ) {
    return record.items as T[];
  }

  // domain arrays
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

  // nested wrappers
  if (
    record.data &&
    typeof record.data ===
      "object"
  ) {

    const nested =
      record.data as Record<
        string,
        unknown
      >;

    // nested data
    if (
      Array.isArray(
        nested.data
      )
    ) {

      return nested.data as T[];
    }

    // nested items
    if (
      Array.isArray(
        nested.items
      )
    ) {

      return nested.items as T[];
    }

    // nested domain arrays
    for (const key of DOMAIN_KEYS) {

      if (
        Array.isArray(
          nested[key]
        )
      ) {

        return nested[
          key
        ] as T[];
      }
    }
  }

  return [];
}

export function normalizeTotal(
  response: unknown
): number {

  if (!response) {
    return 0;
  }

  if (Array.isArray(response)) {
    return response.length;
  }

  if (
    typeof response !==
    "object"
  ) {
    return 0;
  }

  const record =
    response as Record<
      string,
      unknown
    >;

  const meta =
    record.meta as
      | Record<
          string,
          unknown
        >
      | undefined;

  const pagination =
    (record.pagination ??
      meta?.pagination) as
      | Record<
          string,
          unknown
        >
      | undefined;

  const nestedData =
    record.data as
      | Record<
          string,
          unknown
        >
      | undefined;

  const nestedPagination =
    (nestedData?.pagination ??
      (
        nestedData?.meta as
          | Record<
              string,
              unknown
            >
          | undefined
      )?.pagination) as
      | Record<
          string,
          unknown
        >
      | undefined;

  return Number(

    record.total ??
    record.count ??
    pagination?.total ??
    nestedPagination?.total ??
    normalizeList(response)
      .length ??
    0
  );
}

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