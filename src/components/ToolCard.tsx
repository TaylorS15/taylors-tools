import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { toolSchema } from "~/schemas";

export default function ToolCard(props: z.infer<typeof toolSchema>) {
  const adjustColor = (hex: string, percent: number) => {
    let num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) * (1 + percent / 100));
    const g = Math.max(0, ((num >> 8) & 0xff) * (1 + percent / 100));
    const b = Math.max(0, ((num >> 0) & 0xff) * (1 + percent / 100));
    return `#${((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1)}`;
  };

  const gradient = `linear-gradient(to bottom right, ${adjustColor(props.color, -20)}, ${adjustColor(props.color, 40)}, ${adjustColor(props.color, -20)})`;

  return (
    <div
      // style={{ backgroundImage: gradient }}
      className={`tool-card group flex max-h-96 min-h-80 w-full flex-col justify-between gap-4 rounded-md bg-zinc-200 p-0.5 shadow-lg transition-all hover:shadow-xl sm:min-w-72 sm:max-w-96`}
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
