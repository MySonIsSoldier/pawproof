/* eslint-disable @typescript-eslint/no-require-imports -- Reproduce the server's CommonJS dependency loader. */
const assert = require("node:assert/strict");
const { generateKeyPairSync, sign, verify } = require("node:crypto");
const { createRequire } = require("node:module");

async function main() {
  // Vercel disables require(ESM); loading Auth must still work before any request.
  assert.equal(process.features.require_module, false);
  const { getAuth } = require("firebase-admin/auth");
  const { getFirestore } = require("firebase-admin/firestore");
  assert.equal(typeof getAuth, "function");
  assert.equal(typeof getFirestore, "function");

  const adminRequire = createRequire(require.resolve("firebase-admin/app"));
  const { JwksClient, passportJwtSecret } = adminRequire("jwks-rsa");
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const options = {
    jwksUri: "https://fixture.invalid/jwks",
    fetcher: async () => ({
      keys: [
        {
          ...publicKey.export({ format: "jwk" }),
          kid: "fixture",
          alg: "RS256",
          use: "sig",
        },
      ],
    }),
  };
  const client = new JwksClient(options);
  const key = await client.getSigningKey("fixture");
  const message = Buffer.from("local signing-key fixture");
  const signature = sign("RSA-SHA256", message, privateKey);
  assert.equal(
    verify("RSA-SHA256", message, key.getPublicKey(), signature),
    true,
  );
  assert.equal(
    verify(
      "RSA-SHA256",
      Buffer.from("modified"),
      key.getPublicKey(),
      signature,
    ),
    false,
  );
  await assert.rejects(client.getSigningKey("missing"), {
    name: "SigningKeyNotFoundError",
  });

  const provider = passportJwtSecret(options);
  const encoded = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = `${encoded({ alg: "RS256", kid: "fixture" })}.${encoded({ sub: "fixture" })}.fixture`;
  const resolveKey = (jwt) =>
    new Promise((resolve, reject) => {
      provider({}, jwt, (error, value) =>
        error ? reject(error) : resolve(value),
      );
    });
  assert.equal(await resolveKey(token), key.getPublicKey());
  assert.equal(await resolveKey("invalid"), null);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
