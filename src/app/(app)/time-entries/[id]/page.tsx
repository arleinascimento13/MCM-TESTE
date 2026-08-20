import { getSessionUser } from "@/lib/auth";
import { getTimeEntry } from "@/services/time-entries";
import { TimeEntryDetailDrawer } from "./time-entry-detail-drawer";

export default async function TimeEntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return null;
  const { id } = await params;
  const entry = await getTimeEntry(user, id);

  return (
    <TimeEntryDetailDrawer entry={entry as Parameters<typeof TimeEntryDetailDrawer>[0]["entry"]} />
  );
}
