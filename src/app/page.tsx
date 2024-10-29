import { ImageOff } from "lucide-react";
import Link from "next/link";
import ToolCard from "~/components/ToolCard";
import { AVAILABLE_TOOLS } from "~/schemas";

import { getServerAuthSession } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await getServerAuthSession();

  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
      <main className="flex w-full flex-col items-center gap-24 px-4 pb-24 pt-24 md:px-0 md:pt-36 lg:px-[10vw]">
        <div className="flex flex-col items-center">
          <p className="text-xl font-semibold lg:text-2xl">Welcome to</p>
          <h1 className="bg-gradient-to-br from-blue-500 from-10% via-cyan-500 to-blue-500 to-90% bg-clip-text text-6xl font-bold text-transparent lg:text-8xl">
            Taylors Tools
          </h1>
          <h2 className="mt-2 max-w-lg text-center text-2xl font-medium lg:text-3xl">
            Just some simple, easy-to-use, and cost efficient software tools for
            daily or one-time use.
          </h2>
        </div>

        <div className="flex w-full flex-col flex-wrap justify-start gap-6 md:flex-row lg:gap-12">
          {AVAILABLE_TOOLS.map((tool) => (
            <ToolCard
              name={tool.name}
              url={tool.url}
              color={tool.color}
              Logo={tool.Logo}
              description={tool.description}
            />
          ))}
        </div>
      </main>
    </HydrateClient>
  );
}
