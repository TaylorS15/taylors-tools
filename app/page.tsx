import { AVAILABLE_TOOLS } from "@/app/schemas";
import ToolCard from "@/components/ToolCard";

export default function Home() {
  return (
    <main className="flex w-full flex-col items-center gap-24 px-4 pb-24 pt-24 md:px-[10vw]">
      <div className="grid grid-flow-row grid-cols-1 gap-4 sm:justify-items-center sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex h-80 flex-col items-center justify-center text-zinc-900 md:col-start-1 md:row-span-1 md:row-start-1 lg:col-span-2 lg:col-start-2 lg:row-start-1 xl:col-start-2 xl:row-start-1">
          <p className="text-xl font-semibold drop-shadow-md lg:text-2xl">
            Welcome to
          </p>
          <h1 className="bg-gradient-to-br from-blue-500 from-10% via-cyan-500 to-blue-500 to-90% bg-clip-text text-center text-6xl font-bold text-transparent drop-shadow-md sm:text-7xl">
            Taylors Tools
          </h1>
          <h2 className="mt-2 max-w-lg text-center text-2xl font-medium drop-shadow-md lg:text-3xl">
            Just some simple, easy-to-use, and cost efficient software tools for
            daily or one-time use.
          </h2>
        </div>

        {AVAILABLE_TOOLS.map((tool) => (
          <ToolCard key={tool.name} {...tool} />
        ))}
      </div>

      <div className="flex w-full flex-col justify-center gap-6">
        <h3 className="text-left text-xl font-semibold text-blue-500 drop-shadow-md lg:text-2xl">
          Pricing
        </h3>
        <p className="max-w-xl text-left text-3xl font-medium drop-shadow-md md:text-4xl">
          Simple and cost effective pricing.
        </p>
        <p className="-mt-5 max-w-xl text-left text-3xl font-medium drop-shadow-md md:text-4xl">
          With or without an account.
        </p>
        <p className="max-w-xl text-left text-base text-zinc-600 drop-shadow-md lg:text-lg">
          You can use any tool with or without an account, and every tool has a
          fixed cost. Although you can create an account and add credits for
          cheaper use, single use for any tool is available and you're charged
          after you've previewed the final output.
        </p>
        <div className="mx-auto mt-6 flex w-full flex-col rounded-md border-2 shadow-lg md:max-w-3xl">
          <div className="flex w-full gap-8 border-b p-2">
            <p className="flex-1">Tool</p>
            <p className="w-16 text-center text-zinc-600 md:w-28">
              One time use
            </p>
            <p className="w-16 text-center text-zinc-600 md:w-44">
              Credits ($1 = 10 credits)
            </p>
          </div>

          {AVAILABLE_TOOLS.map((tool) => {
            return (
              <div key={tool.name} className="flex w-full gap-8 border-b p-2">
                <p className="w-max flex-1">{tool.name}</p>
                <p className="w-16 text-center text-zinc-600 md:w-28">
                  ${tool.pricing.single}
                </p>
                <p className="w-16 text-center text-zinc-600 md:w-44">
                  {tool.pricing.credits}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex w-full flex-col justify-center gap-6">
        <h3 className="text-left text-xl font-semibold text-blue-500 drop-shadow-md lg:text-2xl">
          Requests
        </h3>
        <p className="max-w-xl text-left text-3xl font-medium drop-shadow-md md:text-4xl">
          Need another tool?
        </p>
        <p className="-mt-5 max-w-xl text-left text-3xl font-medium drop-shadow-md md:text-4xl">
          Send a request below!
        </p>
      </div>
    </main>
  );
}
