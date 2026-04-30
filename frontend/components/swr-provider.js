"use client";

import { SWRConfig } from "swr";
import { toast } from "sonner";
import { getSessionToken } from "@/lib/api";

export function SWRProvider({ children }) {
  return (
    <SWRConfig
      value={{
        fetcher: async (resource, init) => {
          const token = typeof window !== "undefined" ? getSessionToken() : null;
          const headers = {
            ...(token ? { Authorization: `Token ${token}` } : {}),
            ...(init?.headers || {}),
          };

          if (!(init?.body instanceof FormData)) {
            headers["Content-Type"] = headers["Content-Type"] || "application/json";
          }

          const res = await fetch(resource, { ...init, headers });

          if (!res.ok) {
            const errorInfo = await res.json().catch(() => ({}));
            const error = new Error(errorInfo.detail || "Si è verificato un errore durante la richiesta");
            error.info = errorInfo;
            error.status = res.status;
            throw error;
          }

          return res.status === 204 ? null : res.json();
        },
        onError: (error) => {
          if (error?.status !== 403 && error?.status !== 404) {
            toast.error(error.message || "Errore di connessione al server");
          }
        },
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
