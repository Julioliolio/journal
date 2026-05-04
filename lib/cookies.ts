import "server-only";
import { cookies } from "next/headers";

import { PERSON_KEYS, type PersonKey } from "./db/schema";

const COOKIE_NAME = "current_user";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function getCurrentUser(): Promise<PersonKey | null> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  return (PERSON_KEYS as readonly string[]).includes(value ?? "")
    ? (value as PersonKey)
    : null;
}

export async function setCurrentUser(key: PersonKey): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, key, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}

