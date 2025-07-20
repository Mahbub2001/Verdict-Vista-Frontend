"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Search, Timer } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import type { Debate, Argument } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { dataService } from "@/lib/data-service";
import { isValidObjectId } from "@/lib/utils";

export default function Home() {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [debateVotes, setDebateVotes] = useState<Record<string, number>>({});
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const getRemainingTimeText = (debate: Debate) => {
    const endTime = new Date(
      new Date(debate.createdAt).getTime() + (debate.duration || 0) * 1000
    );
    const remainingMs = endTime.getTime() - currentTime.getTime();

    if (remainingMs <= 0) {
      return "Ended";
    }

    const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
    if (remainingHours < 1) {
      const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
      return `${remainingMinutes}m left`;
    }
    return `${remainingHours}h left`;
  };

  useEffect(() => {
    const fetchDebates = async () => {
      try {
        setIsLoading(true);
        const debatesData = await dataService.getDebates();
        setDebates(debatesData);

        if (debatesData.length > 0 && debatesData.length <= 10) {
          const votesPromises = debatesData
            .filter((d) => d.id && isValidObjectId(d.id))
            .map(async (d: Debate) => {
              try {
                const args = await dataService.getArgumentsForDebate(d.id);
                return {
                  id: d.id,
                  votes: args.reduce((sum, arg) => sum + ((arg.upvotes || 0) - (arg.downvotes || 0)), 0),
                };
              } catch (error) {
                console.warn(
                  `Failed to fetch arguments for debate ${d.id}:`,
                  error
                );
                return { id: d.id, votes: 0 };
              }
            });

          if (votesPromises.length > 0) {
            const votesResults = await Promise.all(votesPromises);
            const votesMap = votesResults.reduce((acc, curr) => {
              acc[curr.id] = curr.votes;
              return acc;
            }, {} as Record<string, number>);
            setDebateVotes(votesMap);
          }
        }
      } catch (error) {
        console.error("Failed to fetch debates", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDebates();
  }, []);

  const filteredAndSortedDebates = useMemo(() => {
    let filteredDebates = debates;

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filteredDebates = debates.filter(
        (debate) =>
          debate.title.toLowerCase().includes(lowercasedQuery) ||
          debate.tags.some((tag) =>
            tag.toLowerCase().includes(lowercasedQuery)
          ) ||
          debate.category.toLowerCase().includes(lowercasedQuery)
      );
    }

    const getRemainingTime = (debate: Debate) => {
      const endTime = new Date(
        new Date(debate.createdAt).getTime() + (debate.duration || 0) * 1000
      );
      return endTime.getTime() - currentTime.getTime();
    };

    switch (sortOption) {
      case "newest":
        return [...filteredDebates].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "most-voted":
        return [...filteredDebates].sort(
          (a, b) => (debateVotes[b.id] ?? 0) - (debateVotes[a.id] ?? 0)
        );
      case "ending-soon":
        return [...filteredDebates].sort(
          (a, b) => getRemainingTime(a) - getRemainingTime(b)
        );
      default:
        return filteredDebates;
    }
  }, [debates, searchQuery, sortOption, debateVotes, currentTime]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-bold font-headline text-center md:text-left">
          Community Debates
        </h1>
        <Link href="/debates/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Debate
          </Button>
        </Link>
      </div>

      <div className="mb-8 md:mb-12 p-4 md:p-6 bg-card rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search debates by title, tag, or category..."
                className="pl-10 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-full text-base">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="most-voted">Most Voted</SelectItem>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="flex flex-col h-full">
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <div className="p-4 md:p-6 flex flex-col flex-grow">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-1" />
                <div className="p-0 pt-4 flex justify-between items-center text-sm">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredAndSortedDebates.map((debate) => (
            <Link
              href={`/debates/${debate.id}`}
              key={debate.id}
              className="block"
            >
              <Card className="flex flex-col h-full hover:shadow-accent/20 hover:shadow-lg transition-shadow duration-300 ease-in-out border-2 border-transparent hover:border-primary/50">
                <CardHeader className="p-0">
                  {debate.imageUrl && debate.imageUrl.trim() !== "" ? (
                    <Image
                      src={debate.imageUrl}
                      alt={debate.title || "Debate topic"}
                      width={600}
                      height={400}
                      className="rounded-t-lg object-cover aspect-video"
                      data-ai-hint="debate topic"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                      <div className="text-muted-foreground text-center">
                        <Timer className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No image</p>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <div className="p-4 md:p-6 flex flex-col flex-grow">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(debate.tags || []).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="font-headline text-xl mb-2">
                    {debate.title || "Untitled Debate"}
                  </CardTitle>
                  <CardContent className="p-0 text-muted-foreground flex-grow">
                    <p className="line-clamp-3">
                      {debate.description || "No description available"}
                    </p>
                  </CardContent>
                  <CardFooter className="p-0 pt-4 flex justify-between items-center text-sm">
                    <Badge variant="outline">
                      {debate.category || "Uncategorized"}
                    </Badge>
                    <span className="text-muted-foreground">
                      {getRemainingTimeText(debate)}
                    </span>
                  </CardFooter>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
