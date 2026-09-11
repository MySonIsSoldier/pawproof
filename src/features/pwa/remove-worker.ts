/** Never unregister code-server's own worker or another app sharing its origin. */
export async function removeOwnWorker(scope: string, script: string) {
  const registration = await navigator.serviceWorker.getRegistration(scope);
  if (!registration || registration.scope !== scope) return;
  const workers = [
    registration.active,
    registration.waiting,
    registration.installing,
  ].filter(Boolean);
  if (!workers.length || workers.some((worker) => worker!.scriptURL !== script))
    return;
  await registration.unregister();
  const prefix = `pawproof-pwa:${scope}:`;
  await Promise.all(
    (await caches.keys())
      .filter((name) => name.startsWith(prefix))
      .map((name) => caches.delete(name)),
  );
}
