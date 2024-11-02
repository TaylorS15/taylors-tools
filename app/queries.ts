import { z } from "zod";
import { unstable_cache } from "next/cache";
import { toolSchema } from "@/app/schemas";
import { turso } from "@/lib/db";

export const getTools: () => Promise<z.infer<typeof toolSchema>[]> =
  unstable_cache(
    async () => {
      try {
        const response = await turso.execute("SELECT * FROM tools");
        const validatedTools = response.rows.map((row) =>
          toolSchema.parse(row),
        );
        console.log(validatedTools);
        console.log("test");
        return validatedTools;
      } catch (error) {
        console.error(`Error fetching tools: ${error}`);
        return [];
      }
    },
    ["tools"],
    { revalidate: 3600, tags: ["tools"] },
  );
