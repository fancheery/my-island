import { TabBar } from "@/components/TabBar";
import { SettingsApp } from "@/components/SettingsApp";

export default function SettingsPage() {
  return (
    <>
      <main className="mx-auto w-full max-w-[560px] flex-1 px-6 pb-6">
        <div className="flex items-center justify-between pt-6">
          <h1 className="font-serif text-[20px] tracking-[0.06em] text-ink">设置</h1>
          <a href="/" className="text-[12.5px] tracking-[0.06em] text-sub">
            回今天
          </a>
        </div>
        <SettingsApp />
      </main>
      <TabBar />
    </>
  );
}
