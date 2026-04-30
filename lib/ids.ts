import { customAlphabet } from "nanoid";

// URL-safe alphabet, 16 chars → ~94 bits, plenty for our scale.
const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const newId = customAlphabet(alphabet, 16);
