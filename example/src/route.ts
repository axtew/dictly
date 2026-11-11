import { useSyncExternalStore } from "react";

export const ROUTES = ["text", "formatters", "check"] as const;

export type Route = (typeof ROUTES)[number];

function readRoute(): Route {
  const path = window.location.hash.replace(/^#\/?/, "");

  return ROUTES.find((route) => route === path) ?? "text";
}

function subscribe(listener: () => void): () => void {
  window.addEventListener("hashchange", listener);

  return () => window.removeEventListener("hashchange", listener);
}

/** A three-screen demo needs no router: the screen is the URL hash. */
export function useRoute(): Route {
  return useSyncExternalStore(subscribe, readRoute, () => "text");
}
