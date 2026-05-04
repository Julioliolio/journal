import { redirect } from "next/navigation";

import { setupPartnersAction } from "@/app/actions/partners";
import { JoinForm } from "@/components/JoinForm";
import { UserPicker } from "@/components/UserPicker";
import {
  AuthorTokenMissingError,
  isValidAuthorToken,
} from "@/lib/auth";
import { getCurrentUser } from "@/lib/cookies";
import { getPartners } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let valid = false;
  let configured = true;
  try {
    valid = isValidAuthorToken(token);
  } catch (err) {
    if (err instanceof AuthorTokenMissingError) configured = false;
    else throw err;
  }

  if (!configured) {
    return (
      <main className="setup-shell">
        <div className="setup-card">
          <h1>not configured</h1>
          <p>
            Set <code>AUTHOR_LINK_TOKEN</code> in your environment to enable
            this page.
          </p>
        </div>
      </main>
    );
  }

  if (!valid) {
    return (
      <main className="setup-shell">
        <div className="setup-card">
          <h1>invalid link</h1>
          <p>this sign-in link isn&rsquo;t valid.</p>
        </div>
      </main>
    );
  }

  // Already signed in on this device — straight to the canvas.
  const currentUser = await getCurrentUser();
  if (currentUser) redirect("/");

  const partners = await getPartners();

  if (!partners) {
    return (
      <main className="setup-shell">
        <div className="setup-card">
          <h1>journal</h1>
          <p>pick your name. share the link to invite your partner.</p>
          <form action={setupPartnersAction}>
            <input type="hidden" name="authToken" value={token} />
            <div className="setup-field">
              <label htmlFor="name">your name</label>
              <input
                id="name"
                name="name"
                required
                maxLength={40}
                autoFocus
                autoComplete="off"
              />
            </div>
            <div className="setup-actions">
              <button type="submit" className="pill pill-primary">
                start
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  const nextEmpty = !partners.name2
    ? "name2"
    : !partners.name3
      ? "name3"
      : !partners.name4
        ? "name4"
        : null;

  if (nextEmpty) {
    const knownNames = [
      partners.name1,
      partners.name2,
      partners.name3,
    ].filter((n): n is string => Boolean(n));
    return <JoinForm knownNames={knownNames} authToken={token} />;
  }

  return <UserPicker partners={partners} authToken={token} />;
}
