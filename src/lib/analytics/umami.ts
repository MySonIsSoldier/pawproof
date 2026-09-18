export type UmamiEventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track: (
        eventName: string,
        eventData?: UmamiEventData,
      ) => void | Promise<void>;
    };
  }
}

/** Track product behavior without sending names, addresses, emails, or pet details. */
export function trackUmami(eventName: string, eventData?: UmamiEventData) {
  if (typeof window === "undefined") return;
  try {
    const result = window.umami?.track(eventName, eventData);
    if (result instanceof Promise) void result.catch(() => undefined);
  } catch {
    // Analytics must never interrupt the travel flow.
  }
}
