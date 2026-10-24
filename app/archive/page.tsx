import { TabBar } from "@/components/TabBar";
import { ArchiveApp } from "@/components/ArchiveApp";

export default function ArchivePage() {
  return (
    <>
      <main className="mx-auto w-full max-w-[560px] flex-1 px-6 pb-6">
        <div className="flex items-center justify-between pt-6">
          <h1 className="font-serif text-[20px] tracking-[0.06em] text-ink">回看</h1>
          <span className="text-[12.5px] tracking-[0.06em] text-sub">海岸线</span>
        </div>
        <ArchiveApp />
      </main>
      <TabBar />
    </>
  );
}
