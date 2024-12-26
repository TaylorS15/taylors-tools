"use client";
import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function NavigationAuthButton() {
  const { user } = useUser();

  if (user === undefined) {
    return (
      <p className="cursor-not-allowed bg-white/0 text-base  hover:text-blue-500">
        Login
      </p>
    );
  }

  if (!user) {
    return (
      <SignInButton>
        <p className="cursor-pointer bg-white/0 text-base  hover:text-blue-500">
          Login
        </p>
      </SignInButton>
    );
  }

  return (
    <Link href="/dashboard">
      <p className="bg-white/0 text-base  hover:text-blue-500">Profile</p>
    </Link>
  );
}
