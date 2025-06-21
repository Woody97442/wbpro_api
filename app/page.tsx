import { searchItems } from "@/lib/paapiRequest";
import Link from "next/link";

export default function Home() {
  (async () => {
    const results = await searchItems("macbook air");
    console.log(JSON.stringify(results, null, 2));
  })();
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Link
        href="/api-docs"
        className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90">
        API Docs
      </Link>
    </div>
  );
}
