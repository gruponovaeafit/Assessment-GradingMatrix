import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-2 row-start-2 items-center sm:items-start">
        <Image
          src="/lucario.png"
          alt="lucario logo"
          width={360}
          height={74}
          priority
        />
        <ol className="text-sm text-center items-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li>Lucario Lover</li>
        </ol>
      </main>
    </div>
  );
}
