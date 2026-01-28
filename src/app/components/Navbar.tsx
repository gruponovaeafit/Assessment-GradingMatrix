
import Image from "next/image";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/dashboardadmin", label: "Dashboard" },
  { href: "/final", label: "Final" },
  { href: "/graderPage", label: "Calificar" },
  { href: "/groupGeneration", label: "Grupos" },
];

export default function Navbar() {
  return (
    <nav className="w-full bg-[color:var(--color-surface)] border-b border-[color:var(--color-muted)]/40 shadow-sm px-4 sm:px-8 py-2 flex items-center justify-between z-40">
      <div className="flex items-center gap-3">
        <Image src="/logo.svg" alt="Logo" width={40} height={40} className="rounded" />
        <span className="font-bold text-lg text-[color:var(--color-accent)] tracking-wide">GradingMatrix</span>
      </div>
      <ul className="flex gap-4 sm:gap-6 items-center">
        {navLinks.map(link => (
          <li key={link.href}>
            <a
              href={link.href}
              className="text-[color:var(--color-text)] hover:text-[color:var(--color-accent)] font-medium px-2 py-1 rounded transition"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        {/* Placeholder for user avatar or actions */}
        <div className="w-9 h-9 rounded-full bg-[color:var(--color-muted)] flex items-center justify-center text-[color:var(--color-accent)] font-bold">
          <span>U</span>
        </div>
      </div>
    </nav>
  );
}
