"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";

const requestInputSchema = z.object({
  requestInput: z
    .string()
    .min(5, "Request has a minimum character limit of 5")
    .max(250, "Request has a maximum character limit of 250"),
});

type RequestInput = z.infer<typeof requestInputSchema>;

export default function RequestForm() {
  const [successfulRequest, setSuccessfulRequest] = useState(false);
  const [serverError, setServerError] = useState(false);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestInput>({
    resolver: zodResolver(requestInputSchema),
  });

  const onSubmit: SubmitHandler<RequestInput> = async (data) => {
    try {
      await fetch("/api/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      reset();
      setSuccessfulRequest(true);
    } catch (error) {
      setServerError(true);
      console.error(error);
    }
  };

  

  if (!successfulRequest) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-4">
        <div className="w-full max-w-xl">
          <input
            placeholder="Request Form"
            className="h-10 w-full rounded-md border bg-zinc-100 px-3 focus:outline-none disabled:cursor-wait disabled:bg-zinc-200"
            disabled={isSubmitting}
            {...register("requestInput")}
          />
          <p className="ml-2 mt-1 text-xs font-medium text-red-500">
            {errors.requestInput?.message}
          </p>
          <p className="ml-2 mt-1 text-xs font-medium text-red-500">
            {serverError
              ? "There was an error with your request. Please try again"
              : null}
          </p>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 rounded-md px-3 transition hover:bg-zinc-100 hover:text-blue-600 disabled:cursor-wait disabled:bg-zinc-100 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-inherit"
        >
          {isSubmitting ? "Loading..." : "Submit"}
        </button>
      </form>
    );
  }

  if (successfulRequest) {
    return (
      <div className="flex gap-4">
        <div className="flex h-10 w-full max-w-xl items-center rounded-md border bg-zinc-100 px-3">
          <p className="font-medium">Request submitted successfully!</p>
        </div>
      </div>
    );
  }
}
