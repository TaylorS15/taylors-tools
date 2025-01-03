import Link from "next/link";
import { getTools } from "@/lib/server";
import NavigationAuthButton from "@/components/navigation-auth-button";
import NavigationDropdown from "@/components/navigation-dropdown";

export default async function Navigation() {
  const tools = await getTools();

  return (
    <div className="fixed left-1/2 z-50 mt-4 flex h-12 -translate-x-1/2 items-center gap-9 rounded-lg px-4 shadow-lg-center backdrop-blur-lg">
      <p className="-mr-2 w-max cursor-pointer bg-gradient-to-br from-blue-700 from-10% via-cyan-500 to-blue-700 to-90% bg-clip-text text-xl font-bold text-transparent drop-shadow-md">
        t<span className="text-base">-</span>t
      </p>
      <Link href="/" className="px-0 transition hover:text-blue-500">
        Home
      </Link>
      <NavigationDropdown tools={tools.success ? tools.result : []} />
      <NavigationAuthButton />
    </div>
  );
}
