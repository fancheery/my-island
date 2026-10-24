import { Suspense } from "react";
import { TabBar } from "@/components/TabBar";
import { TodayApp } from "@/components/TodayApp";

export default function Home() {
  return (
    <>
      <Suspense
        fallback={
          <div className="mx-auto flex w-full max-w-[560px] flex-1 items-center justify-center px-6">
            <span className="block h-[3px] w-[3px] rounded-full bg-accent" />
          </div>
        }
      >
        <TodayApp />
      </Suspense>
      <TabBar />
    </>
  );
}
