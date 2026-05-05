import { redirect } from "next/navigation";

import { setupPartnersAction } from "@/app/actions/partners";
import { LoginGate } from "@/components/LoginGate";
import { LoginNameForm } from "@/components/LoginNameForm";
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
      <main className="login-shell">
        <div className="login-card">
          <h1>
            <span className="login-stamp" aria-hidden />
            <span className="login-greet">not configured</span>
          </h1>
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
      <main className="login-shell">
        <div className="login-card">
          <h1>
            <span className="login-stamp" aria-hidden />
            <span className="login-greet">invalid link</span>
          </h1>
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
      <LoginNameForm
        mode="setup"
        authToken={token}
        action={setupPartnersAction}
        defaultPrompt="journal"
        subtitle="pick your name. share the link to invite your partner."
        submitLabel="start"
        pendingLabel="starting…"
      />
    );
  }

  return <LoginGate partners={partners} authToken={token} />;
}
