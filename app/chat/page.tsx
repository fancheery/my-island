import { TabBar } from "@/components/TabBar";

export default function ChatPage() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-6">
        <div className="flex items-center justify-between pt-6">
          <h1 className="font-serif text-[20px] tracking-[0.06em] text-ink">聊聊</h1>
          <span className="text-[12.5px] tracking-[0.06em] text-sub">回声</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-[16px] leading-8 text-ink">回声还没上岛。</p>
          <p className="mt-1 text-[13px] leading-7 text-sub">
            它会在 v0.2 到来。现在，你的话先留在这里。
          </p>
        </div>
      </main>
      <TabBar />
    </>
  );
}
