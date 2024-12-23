"use server";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { turso } from "@/lib/db";
import { z } from "zod";
import { toolSchema } from "@/app/schemas";

export const getTools: () => Promise<z.infer<typeof toolSchema>[]> = cache(
  unstable_cache(
    async () => {
      try {
        const response = await turso.execute("SELECT * FROM tools");
        console.log(Date.now(), "getTools");
        const validatedTools = response.rows.map((row) =>
          toolSchema.parse(row),
        );
        return validatedTools;
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    ["tools"],
    { revalidate: 3600, tags: ["tools"] },
  ),
);

export const getToolData = async (toolName: string) => {
  try {
    const response = await turso.execute({
      sql: "SELECT * FROM tools WHERE url = ?",
      args: [toolName],
    });
    const validatedTool = toolSchema.parse(response.rows[0]);
    return validatedTool;
  } catch (error) {
    console.error(error);
    return null;
  }
};
