"use client";

import { useState, useEffect, use } from "react";
import { notFound } from "next/navigation";
import DebateClient from "./_components/debate-client";
import type { Debate, Argument, User } from "@/lib/types";
import { dataService } from "@/lib/data-service";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { isValidObjectId } from "@/lib/utils";

export default function DebatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [debate, setDebate] = useState<Debate | null>(null);
  const [arguments_, setArguments] = useState<Argument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        if (!isValidObjectId(id)) {
          console.error("Invalid debate ID format:", id);
          notFound();
          return;
        }

        console.log("Fetching debate with ID:", id);

        const [debateData, argumentsData] = await Promise.all([
          dataService.getDebateById(id),
          dataService.getArgumentsForDebate(id),
        ]);

        if (!debateData) {
          console.error("Debate not found for ID:", id);
          notFound();
          return;
        }

        setDebate(debateData);
        setArguments(argumentsData);
      } catch (error) {
        console.error("Error fetching debate data:", error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };

    if (id && id !== "undefined") {
      fetchData();
    } else if (id === "undefined") {
      console.error("Received undefined ID parameter");
      notFound();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!debate) {
    notFound();
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">
            Please log in to participate in debates
          </h2>
          <p className="text-muted-foreground">
            You need to be logged in to view and participate in debates.
          </p>
        </div>
      </div>
    );
  }

  if (!debate) {
    notFound();
  }

  return (
    <DebateClient
      debate={debate}
      initialArguments={arguments_ || []}
      currentUser={user}
    />
  );
}
