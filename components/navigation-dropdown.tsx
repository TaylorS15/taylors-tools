"use client";
import { toolSchema } from "@/lib/schemas";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

export default function NavigationDropdown({
  tools,
}: {
  tools: z.infer<typeof toolSchema>[];
}) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="group relative flex h-full cursor-pointer items-center gap-1"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <p className="group-hover:text-blue-500">Tools</p>
      <motion.div
        animate={{ rotate: isHovering ? 180 : 0 }}
        transition={{ duration: 0.1 }}
      >
        <ChevronDown className="h-4 w-4 text-zinc-700" />
      </motion.div>
      <AnimatePresence>
        {isHovering && (
          <motion.div
            initial={{ opacity: 0, y: -10, x: "-45%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.1 }}
            className="absolute top-12 grid max-h-96 w-96 cursor-pointer grid-flow-row grid-cols-1 overflow-y-scroll rounded-lg border border-zinc-200 bg-zinc-50 p-2 shadow-lg sm:w-[30rem] sm:grid-cols-2 md:w-[36rem]"
          >
            {tools.map((tool) => (
              <Link
                href={`../tool/${tool.url}`}
                key={tool.name}
                className="w-full cursor-pointer gap-4 overflow-hidden rounded-lg p-1 transition hover:bg-zinc-100"
              >
                <p className="text-sm font-medium">{tool.name}</p>
                <p className="max-h-12 text-xs text-zinc-500">
                  {tool.description}
                </p>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
