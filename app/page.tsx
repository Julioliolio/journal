import { Canvas } from "@/components/Canvas";
import { getCurrentUser } from "@/lib/cookies";
import {
  getAllCards,
  getAllReactions,
  getPartners,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [partners, currentUser, cards, reactions] = await Promise.all([
    getPartners(),
    getCurrentUser(),
    getAllCards(),
    getAllReactions(),
  ]);

  // Public landing for visitors who arrive before the journal exists yet.
  if (!partners) {
    return (
      <main className="setup-shell">
        <div className="setup-card">
          <h1>journal</h1>
          <p>this journal hasn&rsquo;t started yet. check back soon.</p>
        </div>
      </main>
    );
  }

  // Only authors get the secret invite URL embedded — they already know it.
  const token = process.env.AUTHOR_LINK_TOKEN;
  const inviteUrl =
    currentUser && token ? `/login/${encodeURIComponent(token)}` : null;

  return (
    <Canvas
      initialData={{
        partners,
        currentUser,
        cards,
        reactions,
      }}
      inviteUrl={inviteUrl}
    />
  );
}
