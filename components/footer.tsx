import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flex h-16 w-full items-center justify-between bg-zinc-100 px-6 md:px-[10vw]">
      <p className="text-sm">Copyright © 2023 Taylors Tools</p>
      <Link href="/terms" className="text-sm hover:underline">
        Terms of Service
      </Link>
    </footer>
  );
}
