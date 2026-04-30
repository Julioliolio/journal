import "server-only";

const ENV_KEY = "AUTHOR_LINK_TOKEN";

export class AuthorTokenMissingError extends Error {
  constructor() {
    super(
      `${ENV_KEY} is not set. Configure it in your environment to enable the authoring URL.`,
    );
  }
}

export class InvalidAuthorTokenError extends Error {
  constructor() {
    super("That sign-in link isn't valid.");
  }
}

function expected(): string {
  const value = process.env[ENV_KEY];
  if (!value) throw new AuthorTokenMissingError();
  return value;
}

export function isValidAuthorToken(candidate: unknown): boolean {
  if (typeof candidate !== "string") return false;
  return candidate.length > 0 && candidate === expected();
}

export function assertAuthorToken(candidate: unknown): void {
  if (!isValidAuthorToken(candidate)) throw new InvalidAuthorTokenError();
}
