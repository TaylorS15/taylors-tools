import { ToolRequestTemplate } from "@/components/templates/tool-request";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { requestInput } = await request.json();

  try {
    const validatedInput = z.string().min(5).max(250).parse(requestInput);

    const { data, error } = await resend.emails.send({
      from: "Taylors-Tools <request@taylorstools.com>",
      to: ["tsvec15@yahoo.com"],
      subject: "Tool Request",
      react: ToolRequestTemplate({ request: validatedInput }),
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
