"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User } from "@/lib/types";
import { Trophy, Award, Hash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { dataService } from "@/lib/data-service";

type Period = "weekly" | "monthly" | "all-time";

export default function ScoreboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState<Period>("all-time");

  const fetchLeaderboard = async (period: Period) => {
    try {
      setIsLoading(true);
      const data = await dataService.getLeaderboard(period);
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch leaderboard", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(currentPeriod);
  }, [currentPeriod]);

  const handleTabChange = (value: string) => {
    const period = value as Period;
    setCurrentPeriod(period);
  };

  const renderLeaderboard = (userList: User[]) => {
    if (isLoading) {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  <Hash className="h-5 w-5 mx-auto" />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-center">Debates</TableHead>
                <TableHead className="text-right">Total Votes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="text-center">
                    <Skeleton className="h-6 w-6 rounded-full mx-auto" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-5 w-10 mx-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-5 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (userList.length === 0) {
      return (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No rankings available
          </h3>
          <p className="text-muted-foreground">
            {currentPeriod === "weekly"
              ? "No users have received votes in the last 7 days."
              : currentPeriod === "monthly"
              ? "No users have received votes in the last 30 days."
              : "No users have participated in debates yet."}
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">
                <Hash className="h-5 w-5 mx-auto" />
              </TableHead>
              <TableHead className="min-w-[150px]">User</TableHead>
              <TableHead className="text-center">Debates</TableHead>
              <TableHead className="text-right">
                {currentPeriod === "all-time"
                  ? "Total Votes"
                  : currentPeriod === "weekly"
                  ? "Votes (7 days)"
                  : "Votes (30 days)"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userList.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell className="text-center">
                  <div className="flex justify-center items-center">
                    {index < 3 ? (
                      <Trophy
                        className={`h-6 w-6 ${
                          index === 0
                            ? "text-yellow-500"
                            : index === 1
                            ? "text-gray-400"
                            : "text-orange-400"
                        }`}
                      />
                    ) : (
                      <span className="font-bold text-lg">{index + 1}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{user.debatesParticipated}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-bold text-primary flex items-center justify-end gap-2">
                    <Award className="h-5 w-5" />
                    <span>{user.totalVotes}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-5xl font-bold font-headline">
          Scoreboard
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          See who is leading the conversation.
        </p>
      </div>

      <Tabs
        defaultValue="all-time"
        className="w-full"
        onValueChange={handleTabChange}
      >
        <div className="flex justify-center mb-8">
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="all-time">All-Time</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="all-time">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">
                All-Time Rankings
              </CardTitle>
              <CardDescription>
                The most influential voices in the arena since the beginning.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderLeaderboard(users)}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">
                Weekly Rankings
              </CardTitle>
              <CardDescription>
                Top performers in the last 7 days based on votes received.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderLeaderboard(users)}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">
                Monthly Rankings
              </CardTitle>
              <CardDescription>
                Top performers in the last 30 days based on votes received.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderLeaderboard(users)}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
