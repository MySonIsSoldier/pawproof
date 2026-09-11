/** Ephemeral UI feedback. Never part of a saved trip or a policy result. */
export type ActionNotification = {
  kind: "success" | "info" | "error";
  title: string;
};
