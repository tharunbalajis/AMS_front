
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import React from "react";

import { createRoot } from "react-dom/client";

import { BrowserRouter } from "react-router-dom";

import { Toaster } from "sonner";

import { App } from "./app/App";

import { AuthProvider } from "./app/auth/AuthProvider";

import "./styles.css";

/* ====================================================== */
/* QUERY CLIENT */
/* ====================================================== */

const queryClient =
  new QueryClient({

    defaultOptions: {

      queries: {

        retry: 1,

        staleTime: 0,

        gcTime: 0,

        refetchOnWindowFocus:
          false,

        refetchOnReconnect:
          true,

        refetchOnMount:
          true,

        networkMode:
          "online",
      },

      mutations: {

        retry: 0,

        networkMode:
          "online",
      },
    },
  });

/* ====================================================== */
/* ROOT */
/* ====================================================== */

const rootElement =
  document.getElementById(
    "root"
  );

if (!rootElement) {

  throw new Error(
    "Root element not found"
  );
}

createRoot(
  rootElement
).render(

  <QueryClientProvider
    client={queryClient}
  >

    <BrowserRouter>

      <AuthProvider>

        <App />

        <Toaster
          richColors
          closeButton
          position="top-right"
        />

      </AuthProvider>

    </BrowserRouter>

  </QueryClientProvider>
);
