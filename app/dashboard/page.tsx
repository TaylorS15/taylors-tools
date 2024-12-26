"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { deleteFile, getTools, getUserToolOperations } from "@/lib/server";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ChevronRight, Trash, X } from "lucide-react";
import Image from "next/image";
import { getS3FileUrl } from "@/lib/server";
import { z } from "zod";
import { userOperationsSchema } from "@/lib/schemas";

export default function Dashboard() {
  const { user } = useUser();
  const [selectedTool, setSelectedTool] = useState("");

  const toolsQuery = useQuery({
    queryKey: ["tools"],
    queryFn: async () => {
      const response = await getTools();
      if (!response.success) {
        throw new Error(response.error);
      }

      return response.result;
    },
    staleTime: 60 * 60 * 1000,
  });
  const tools = toolsQuery.data ?? [];

  const operationsQuery = useQuery({
    queryKey: ["operations", selectedTool, user?.id],
    queryFn: async () => {
      const response = await getUserToolOperations(
        user?.id ?? "",
        selectedTool,
      );
      if (!response.success) {
        throw new Error(response.error);
      }

      return response.result;
    },
  });
  const operations = operationsQuery.data ?? [];

  if (!user) {
    return (
      <main className="flex w-full flex-col items-center md:flex-row md:items-start">
        <div className="flex h-[calc(100dvh-14rem)] w-full max-w-xl flex-col gap-4 p-4 md:w-2/5">
          <h1 className="bg-gradient-to-br from-blue-700 from-10% via-cyan-400 to-blue-700 to-90% bg-clip-text text-2xl font-bold text-transparent drop-shadow-md sm:text-3xl lg:text-4xl">
            Dashboard
          </h1>
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>

        <Skeleton className="h-96 w-full rounded-lg md:h-full" />
      </main>
    );
  }

  return (
    <main className="flex w-full flex-col items-center gap-4 md:flex-row md:items-start">
      <div className="flex w-full max-w-xl flex-col gap-4 md:h-[calc(100dvh-14rem)] md:w-2/5">
        <h1 className="w-min bg-gradient-to-br from-blue-700 from-10% via-cyan-400 to-blue-700 to-90% bg-clip-text text-2xl font-bold text-transparent drop-shadow-md sm:text-3xl lg:text-4xl">
          Dashboard
        </h1>
        <div className="flex w-full flex-col gap-4 rounded-lg border border-zinc-200 p-2 text-sm">
          <div className="flex w-full flex-wrap items-center justify-between">
            <p>Signed in as</p>
            <p>{user.primaryEmailAddress?.emailAddress}</p>
          </div>

          <div className="flex w-full items-center justify-between">
            <p>Available credits</p>
            <p>{(user.publicMetadata.credits as string) ?? "0"}</p>
          </div>

          <div className="flex w-full items-center justify-between">
            <p>Total tool usage</p>
            <p>324 operations</p>
          </div>

          <div className="flex w-full items-center justify-between gap-2">
            <button className="h-8 w-max cursor-pointer rounded-lg bg-green-500 px-6 text-white transition hover:bg-green-400">
              Add credits
            </button>

            <SignOutButton>
              <button className="ml-auto h-8 w-max rounded-lg border border-zinc-300 px-2 transition hover:bg-zinc-100">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>

        <div className="flex h-72 w-full flex-col overflow-y-scroll rounded-lg border border-zinc-200 text-sm md:h-full">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className={`${selectedTool === tool.url ? "bg-blue-50" : "bg-zinc-50"} flex h-14 w-full cursor-pointer items-center gap-4 px-2 transition hover:bg-zinc-100`}
              onClick={() => setSelectedTool(tool.url)}
            >
              <Image alt="tool logo" src={tool.logo} width={25} height={25} />
              <p>{tool.name}</p>
              <ChevronRight className="ml-auto h-4 w-4 text-zinc-700" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex h-max w-full max-w-xl flex-col overflow-y-scroll rounded-lg border border-zinc-200 md:h-[calc(100dvh-14rem)] md:w-3/5 md:max-w-none">
        {operations.map((operation) => (
          <Operation
            key={operation.created_at}
            operation={operation}
            operationsQuery={operationsQuery}
          />
        ))}
      </div>
    </main>
  );
}

function Operation({
  operation,
  operationsQuery,
}: {
  operation: z.infer<typeof userOperationsSchema>;
  operationsQuery: UseQueryResult<
    z.infer<typeof userOperationsSchema>[],
    unknown
  >;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  return (
    <div
      key={operation.created_at}
      className="relative flex w-full gap-4 border-b border-zinc-200 p-2 text-sm"
    >
      <div className="max-w-36">
        <p className="truncate">{operation.name}</p>
        <p className="text-xs text-zinc-500">Name</p>
      </div>
      <div className="w-max">
        <p>{operation.created_at.split("T")[0]}</p>
        <p className="text-xs text-zinc-500">Created at</p>
      </div>
      <button
        onClick={async () => {
          const url = await getS3FileUrl(operation.name, operation.tool);
          if (url.success) window.open(url.result, "_blank");
        }}
        className="h-min text-blue-600 hover:underline"
      >
        View
      </button>
      {isDeleting ? (
        <div className="my-auto ml-auto flex items-center gap-2">
          <button
            className="h-8 w-max rounded-lg bg-red-500 px-2 text-white transition hover:bg-red-600"
            onClick={async () => {
              const response = await deleteFile(operation.name, operation.tool);
              if (!response.success) {
                throw new Error(response.error);
              }
              operationsQuery.refetch();
              setIsDeleting(false);
            }}
          >
            Confirm
          </button>
          <button
            onClick={() => setIsDeleting(false)}
            className="rounded-full p-1 transition hover:bg-zinc-100"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsDeleting(true)}
          className="my-auto ml-auto h-8 w-max rounded-lg border border-zinc-300 px-2 transition hover:bg-zinc-100"
        >
          <Trash className="h-5 w-5 text-zinc-500" />
        </button>
      )}
    </div>
  );
}
