import { turso } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    await turso.execute({
      sql: "UPDATE users SET total_operations = total_operations + 1 WHERE user_id = ?",
      args: [userId],
    });

    return NextResponse.json(
      {
        success: true,
        result: undefined,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user. Please try again.",
      },
      { status: 500 },
    );
  }
}
