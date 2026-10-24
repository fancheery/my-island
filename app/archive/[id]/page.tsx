import { TabBar } from "@/components/TabBar";
import { EntryDetail } from "@/components/EntryDetail";

export default async function EntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return (
    <>
      <main className="mx-auto w-full max-w-[560px] flex-1 px-6 pb-6">
        <EntryDetail />
      </main>
      <TabBar />
    </>
  );
}
