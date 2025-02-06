import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:center-start">
        <Image
          className="dark:invert"
          src="/cat.webp"
          alt="Next.js logo"
          width={250}
          height={250}
          priority
        />
        <ol className="text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Hello everyone, this is my first time on next.js :){" "}
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="https://www.instagram.com/sr4v3_/"
            target="_blank"
            rel="noopener noreferrer"
          >
            
            Mi ig :p
          </a>
        </div>
      </main>    </div>
  );
}
