import { createServer } from "node:http";
import { connect, type Socket } from "node:net";
import type { AddressInfo } from "node:net";

/** Local-only fixture: real SW update requests cannot be mocked with page.route. */
export async function startPwaUpdateProxy(upstream: string) {
  let release = "test-old";
  const sockets = new Set<Socket>();
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", upstream);
      const received = await fetch(url, { redirect: "manual" });
      const headers = Object.fromEntries(received.headers);
      delete headers["content-encoding"];
      delete headers["content-length"];
      delete headers["transfer-encoding"];
      const body = url.pathname.endsWith("/sw.js")
        ? (await received.text()).replace(
            /^const RELEASE = .*;$/m,
            `const RELEASE = "${release}";`,
          )
        : Buffer.from(await received.arrayBuffer());
      response.writeHead(received.status, headers);
      response.end(body);
    } catch {
      response.writeHead(502);
      response.end("Test proxy unavailable");
    }
  });
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  // Next dev establishes HMR before hydration; proxy the actual handshake too.
  server.on("upgrade", (request, socket, head) => {
    const target = new URL(upstream);
    const remote = connect(Number(target.port), target.hostname, () => {
      // The fixture terminates at a second local origin. code-server checks both.
      const headers = {
        ...request.headers,
        host: target.host,
        origin: target.origin,
      };
      remote.write(
        `${request.method} ${request.url} HTTP/1.1\r\n${Object.entries(headers)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\r\n")}\r\n\r\n`,
      );
      if (head.length) remote.write(head);
      socket.pipe(remote).pipe(socket);
    });
    remote.on("error", () => socket.destroy());
    socket.on("error", () => remote.destroy());
    socket.on("close", () => remote.destroy());
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    url: origin + new URL(upstream).pathname,
    releaseNext: () => {
      release = "test-new";
    },
    close: async () => {
      for (const socket of sockets) socket.destroy();
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}
