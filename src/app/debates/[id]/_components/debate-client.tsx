"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  Users,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Frown,
  Plus,
  Timer,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Debate, Argument, User } from "@/lib/types";
import CountdownTimer from "./countdown-timer";
import ArgumentCard from "./argument-card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { moderateArgumentText, generateDebateSummary } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { dataService } from "@/lib/data-service";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

const REPLY_WINDOW_MS = 5 * 60 * 1000;

type Side = "support" | "oppose";

export default function DebateClient({
  debate,
  initialArguments,
  currentUser,
}: {
  debate: Debate;
  initialArguments: Argument[];
  currentUser: User;
}) {
  const { toast } = useToast();

  if (!debate || !initialArguments || !currentUser) {
    return <div>Loading...</div>;
  }

  const [userSide, setUserSide] = useState<Side | null>(null);
  const [argumentsList, setArgumentsList] = useState(initialArguments);
  const [isDebateOver, setIsDebateOver] = useState(false);
  const [newArgument, setNewArgument] = useState("");
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debateSummary, setDebateSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [replyDeadline, setReplyDeadline] = useState<Date | null>(null);
  const [replyTimeLeft, setReplyTimeLeft] = useState("");
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    side: Side | null;
    title: string;
    description: string;
  }>({
    isOpen: false,
    side: null,
    title: "",
    description: "",
  });

  const refreshArguments = useCallback(async () => {
    try {
      const updatedArguments = await dataService.getArgumentsForDebate(
        debate.id
      );
      setArgumentsList(updatedArguments);
    } catch (error) {
      console.error("Failed to refresh arguments:", error);
    }
  }, [debate.id]);

  const userHasPosted = useMemo(() => {
    if (!userSide) return false;
    return argumentsList.some(
      (arg) => arg.authorId === currentUser.id && arg.side === userSide
    );
  }, [argumentsList, currentUser.id, userSide]);

  const endTime = useMemo(
    () =>
      new Date(new Date(debate.createdAt).getTime() + debate.duration * 1000),
    [debate.createdAt, debate.duration]
  );

  useEffect(() => {
    if (new Date() > endTime) {
      setIsDebateOver(true);
    }
  }, [endTime]);

  useEffect(() => {
    const checkUserSide = async () => {
      try {
        const backendSide = await dataService.getUserSide(debate.id);
        if (backendSide) {
          setUserSide(backendSide as Side);
          return;
        }

        const userArgument = argumentsList.find(
          (arg) => arg.authorId === currentUser.id
        );
        if (userArgument) {
          setUserSide(userArgument.side);
          await dataService.joinSide(debate.id, userArgument.side);
          return;
        }
      } catch (error) {
        console.error("Error checking user side:", error);
        const userArgument = argumentsList.find(
          (arg) => arg.authorId === currentUser.id
        );
        if (userArgument) {
          setUserSide(userArgument.side);
        }
      }
    };

    checkUserSide();
  }, [argumentsList, currentUser.id, debate.id]);

  useEffect(() => {
    if (isDebateOver) return;

    const interval = setInterval(() => {
      refreshArguments();
    }, 30000);

    return () => clearInterval(interval);
  }, [isDebateOver, refreshArguments]);

  useEffect(() => {
    if (!replyDeadline || userHasPosted) {
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +replyDeadline - +new Date();
      if (difference > 0) {
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        return `${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`;
      }
      return null;
    };

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      if (newTimeLeft) {
        setReplyTimeLeft(newTimeLeft);
      } else {
        clearInterval(timer);
        setReplyDeadline(null);
        setReplyTimeLeft("");
        toast({
          variant: "destructive",
          title: "Time is up!",
          description:
            "You didn't post your first argument in time, but you're still on the " +
            userSide +
            " side.",
        });
      }
    }, 1000);

    setReplyTimeLeft(calculateTimeLeft() ?? "");

    return () => clearInterval(timer);
  }, [replyDeadline, userHasPosted, userSide, toast]);

  const supportArgs = argumentsList.filter((a) => a.side === "support");
  const opposeArgs = argumentsList.filter((a) => a.side === "oppose");

  const supportVotes = supportArgs.reduce(
    (sum, arg) => sum + (arg.upvotes || 0) - (arg.downvotes || 0),
    0
  );
  const opposeVotes = opposeArgs.reduce(
    (sum, arg) => sum + (arg.upvotes || 0) - (arg.downvotes || 0),
    0
  );
  const winner: Side | "tie" | null = isDebateOver
    ? supportVotes > opposeVotes
      ? "support"
      : opposeVotes > supportVotes
      ? "oppose"
      : "tie"
    : null;

  const handleJoin = (side: Side) => {
    if (userSide && userSide !== side) {
      toast({
        variant: "destructive",
        title: "Cannot switch sides",
        description: `You have already joined the ${userSide} side. You cannot switch sides or join both sides in the same debate.`,
      });
      return;
    }

    if (userSide === side) {
      return;
    }

    setConfirmationModal({
      isOpen: true,
      side,
      title: `Join ${side} side?`,
      description: `Are you sure you want to join the ${side} side of this debate? Once confirmed, you cannot switch to the opposite side.`,
    });
  };

  const handleConfirmJoin = async () => {
    const side = confirmationModal.side;
    if (!side) return;

    try {
      const success = await dataService.joinSide(debate.id, side);

      if (!success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to join side. Please try again.",
        });
        return;
      }

      setUserSide(side);
      setReplyDeadline(new Date(Date.now() + REPLY_WINDOW_MS));

      setConfirmationModal({
        isOpen: false,
        side: null,
        title: "",
        description: "",
      });

      toast({
        title: `You've joined the ${side} side!`,
        description: "You have 5 minutes to post your first argument.",
      });
    } catch (error) {
      console.error("Error joining side:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join side. Please try again.",
      });
    }
  };

  const handleCloseModal = () => {
    setConfirmationModal({
      isOpen: false,
      side: null,
      title: "",
      description: "",
    });
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast({
          title: "Link Copied!",
          description: "Debate URL copied to your clipboard.",
        });
      });
    }
  };

  const handleSubmitArgument = async () => {
    if (!newArgument.trim() || !userSide) return;

    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to submit arguments.",
      });
      return;
    }

    setIsSubmitting(true);
    setModerationError(null);

    const moderationResult = await moderateArgumentText({ text: newArgument });

    if (!moderationResult.isSafe) {
      setModerationError(moderationResult.reason);
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("Submitting argument for debate:", debate.id);
      const newArg = await dataService.createArgument(debate.id, {
        text: newArgument,
        side: userSide,
      });

      if (newArg) {
        await refreshArguments();
        setNewArgument("");
        toast({ title: "Argument posted!" });
      } else {
        throw new Error("Failed to create argument");
      }
    } catch (error) {
      console.error("Error submitting argument:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Could not post your argument. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!winner || winner === "tie") return;
    setIsSummaryLoading(true);
    try {
      const summaryResult = await generateDebateSummary({
        topic: debate.title,
        supportArguments: supportArgs.map((a) => a.text),
        opposeArguments: opposeArgs.map((a) => a.text),
        winningSide: winner,
      });
      setDebateSummary(summaryResult.summary);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error generating summary",
        description: "Could not generate a summary at this time.",
      });
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleDeleteArgument = async (argumentId: string) => {
    try {
      const success = await dataService.deleteArgument(argumentId);

      if (!success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete argument. Please try again.",
        });
        return;
      }

      setArgumentsList((prev) => prev.filter((arg) => arg.id !== argumentId));
      toast({
        title: "Argument Deleted",
        description: "Your argument has been successfully removed.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete your argument. Please try again.",
      });
    }
  };

  const handleUpdateArgumentText = async (
    argumentId: string,
    newText: string
  ) => {
    try {
      const success = await dataService.updateArgument(argumentId, newText);

      if (!success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update argument. Please try again.",
        });
        return;
      }

      setArgumentsList((prev) =>
        prev.map((arg) =>
          arg.id === argumentId ? { ...arg, text: newText } : arg
        )
      );
      toast({
        title: "Argument Updated",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update your argument. Please try again.",
      });
    }
  };

  const renderArgumentColumn = (
    title: string,
    side: Side,
    args: Argument[]
  ) => (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-bold font-headline flex items-center gap-2">
          {side === "support" ? (
            <ThumbsUp className="text-green-500" />
          ) : (
            <ThumbsDown className="text-red-500" />
          )}
          {title}
        </h2>
        {!isDebateOver &&
          (userSide === side ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              You joined this side
            </Badge>
          ) : userSide && userSide !== side ? (
            <Badge
              variant="outline"
              className="bg-gray-100 text-gray-500 cursor-not-allowed"
            >
              Cannot join (you're on {userSide} side)
            </Badge>
          ) : (
            <Button onClick={() => handleJoin(side)} size="sm">
              Join {title}
            </Button>
          ))}
      </div>
      <div className="space-y-4">
        {args.length > 0 ? (
          args.map((arg) => (
            <ArgumentCard
              key={arg.id}
              argument={arg}
              isDebateOver={isDebateOver}
              onDeleteArgument={handleDeleteArgument}
              onUpdateArgumentText={handleUpdateArgumentText}
              onVote={refreshArguments}
            />
          ))
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No arguments yet.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8 overflow-hidden">
        <div className="relative h-48 md:h-64">
          {debate.imageUrl && debate.imageUrl.trim() !== "" ? (
            <Image
              src={debate.imageUrl}
              alt={debate.title || "Debate topic"}
              layout="fill"
              objectFit="cover"
              className="bg-muted"
              data-ai-hint="debate topic"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-muted-foreground text-center">
                <Timer className="h-16 w-16 mx-auto mb-2 opacity-50" />
                <p>No image available</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4 md:p-6">
            <h1 className="text-2xl md:text-4xl font-bold font-headline text-white shadow-lg">
              {debate.title || "Untitled Debate"}
            </h1>
          </div>
        </div>
        <CardContent className="p-4 md:p-6">
          <p className="text-muted-foreground mb-4">
            {debate.description || "No description available"}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>
                Created by{" "}
                {typeof debate.creatorId === "object" && debate.creatorId?.name
                  ? debate.creatorId.name
                  : "Unknown"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <CountdownTimer
                endTime={endTime}
                setDebateOver={setIsDebateOver}
              />
            </div>
            <div className="flex items-center gap-x-2">
              {(debate.tags || []).map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {isDebateOver && winner && (
        <Card className="mb-8 bg-primary/10 border-primary">
          <CardHeader className="text-center p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold font-headline text-primary">
              Debate Over!
            </h2>
            <p className="text-lg">
              The winning side is:{" "}
              <span className="font-bold capitalize">{winner}</span>
            </p>
            {!debateSummary && (
              <Button
                onClick={handleGenerateSummary}
                disabled={isSummaryLoading || winner === "tie"}
                className="mt-4 mx-auto"
              >
                {isSummaryLoading ? "Generating..." : "Generate AI Summary"}
              </Button>
            )}
          </CardHeader>
          {debateSummary && (
            <CardContent className="p-4 md:p-6 pt-0">
              <Alert>
                <AlertTitle className="font-headline">
                  AI Generated Summary
                </AlertTitle>
                <AlertDescription>{debateSummary}</AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {renderArgumentColumn("Support", "support", supportArgs)}
        {renderArgumentColumn("Oppose", "oppose", opposeArgs)}
      </div>

      {userSide && !isDebateOver && (
        <Card className="mt-8 md:mt-12">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <h3 className="text-lg md:text-xl font-bold font-headline flex items-center gap-2">
                {userSide === "support" ? (
                  <ThumbsUp className="text-green-500 h-5 w-5" />
                ) : (
                  <ThumbsDown className="text-red-500 h-5 w-5" />
                )}
                Post your argument for '{userSide}'
              </h3>
              {!userHasPosted && replyTimeLeft && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-2 text-base self-start sm:self-center"
                >
                  <Timer className="h-4 w-4" />
                  <span>{replyTimeLeft}</span>
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={newArgument}
                onChange={(e) => setNewArgument(e.target.value)}
                placeholder="Make your point clearly and respectfully..."
                rows={5}
                disabled={isSubmitting}
              />
              {moderationError && (
                <Alert variant="destructive">
                  <Frown className="h-4 w-4" />
                  <AlertTitle>Moderation Warning</AlertTitle>
                  <AlertDescription>{moderationError}</AlertDescription>
                </Alert>
              )}
              <Button
                onClick={handleSubmitArgument}
                disabled={isSubmitting || !newArgument.trim()}
              >
                <Plus className="mr-2 h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Submit Argument"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmJoin}
        title={confirmationModal.title}
        description={confirmationModal.description}
        confirmText="Join Side"
        cancelText="Cancel"
      />
    </div>
  );
}
