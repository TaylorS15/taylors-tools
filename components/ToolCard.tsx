import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { toolSchema } from "~/schemas";

export default function ToolCard(props: z.infer<typeof toolSchema>) {
  return (
    <div
      className={`group flex max-h-96 min-h-80 w-full flex-col justify-between gap-4 rounded-md bg-zinc-200 p-0.5 shadow-lg transition-all hover:shadow-xl sm:min-w-64 sm:max-w-96`}
    >
      <div className="flex h-full w-full flex-col gap-4 rounded-[calc(0.5rem-4px)] bg-white p-4">
        <p className="h-14 w-max rounded-md bg-zinc-100 p-2 font-medium">
          {props.name}
        </p>
        <div className="flex w-full items-center justify-between gap-4">
          <props.Logo
            color={props.color}
            className="h-16 w-16"
            strokeWidth={1.5}
          />
          <p className="text-lg">{props.title}</p>
        </div>
        <p className="h-full w-full">{props.description}</p>
        <Link
          href={`/tool/${props.url}`}
          className="mt-auto w-full font-medium text-purple-600 transition-all hover:text-black hover:underline group-hover:scale-100 group-hover:opacity-100 md:scale-95 md:opacity-0"
        >
          <p className="flex justify-between">
            {props.cta}
            <ArrowRight />
          </p>
        </Link>
      </div>
    </div>
  );
}
