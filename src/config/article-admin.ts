export const ARTICLE_ADMIN_EMAIL = "ohsong656565@gmail.com";
export const ARTICLE_ADMIN_SIGN_IN_PROVIDER = "google.com";

export function isArticleAdminIdentity(
  email: string | null | undefined,
  signInProvider: string | null | undefined,
  emailVerified: boolean,
) {
  return (
    emailVerified &&
    email?.trim().toLocaleLowerCase("en-US") === ARTICLE_ADMIN_EMAIL &&
    signInProvider === ARTICLE_ADMIN_SIGN_IN_PROVIDER
  );
}
