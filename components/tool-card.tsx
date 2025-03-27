import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { toolSchema } from "@/lib/schemas";
import Image from "next/image";

export default function ToolCard(props: z.infer<typeof toolSchema>) {
  return (
    <div
      className={`group flex max-h-96 min-h-80 w-full flex-col justify-between gap-4 rounded-lg bg-zinc-200 p-px transition-all duration-75 sm:min-w-64 sm:max-w-96`}
    >
      <div className="flex h-full w-full flex-col gap-4 rounded-[calc(0.7rem-4px)] bg-white p-4">
        <p className="h-14 w-max rounded-md bg-zinc-100 p-2 font-medium">
          {props.name}
        </p>
        <div className="flex w-full items-center gap-4">
          <Image
            alt="tool logo"
            src={props.logo}
            width={64}
            height={64}
            className={`${props.enabled ? "opacity-100" : "opacity-50"}`}
          />
          <p className="text-lg font-medium">{props.title}</p>
        </div>
        <p className="h-full max-w-96">{props.description}</p>{" "}
        {props.enabled ? (
          <Link
            href={`/tool/${props.url}
            w-full`}
            className="mt-auto w-full font-medium text-blue-600 transition-all hover:text-black hover:underline group-hover:scale-100 group-hover:opacity-100 md:scale-95 md:opacity-0"
          >
            <p className="flex justify-between">
              {props.cta}
              <ArrowRight />
            </p>
          </Link>
        ) : (
          <div className="mt-auto w-full font-medium text-blue-600/50 transition-all hover:text-black hover:underline group-hover:scale-100 group-hover:opacity-100 md:scale-95 md:opacity-0">
            <p className="flex justify-between">
              {props.cta}
              <ArrowRight />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
