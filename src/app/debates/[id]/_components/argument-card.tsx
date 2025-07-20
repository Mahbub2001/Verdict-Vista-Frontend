"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { Argument } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, ThumbsDown, Trash2, Pencil, Check, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { dataService } from "@/lib/data-service";

const EDIT_WINDOW_MS = 5 * 60 * 1000;

export default function ArgumentCard({
  argument,
  isDebateOver,
  onDeleteArgument,
  onUpdateArgumentText,
  onVote,
}: {
  argument: Argument;
  isDebateOver: boolean;
  onDeleteArgument: (argumentId: string) => void;
  onUpdateArgumentText: (argumentId: string, newText: string) => void;
  onVote?: () => void;
}) {
  const author =
    typeof argument.authorId === "object" && argument.authorId
      ? argument.authorId
      : {
          id: typeof argument.authorId === "string" ? argument.authorId : "",
          name: "Unknown",
          avatarUrl: "",
        };

  const [upvotes, setUpvotes] = useState(argument.upvotes || 0);
  const [downvotes, setDownvotes] = useState(argument.downvotes || 0);
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(
    argument.userVote || null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(argument.text);

  useEffect(() => {
    setUpvotes(argument.upvotes || 0);
    setDownvotes(argument.downvotes || 0);
    setUserVote(argument.userVote || null);
  }, [argument.upvotes, argument.downvotes, argument.userVote]);

  const isEditable =
    new Date().getTime() - new Date(argument.createdAt).getTime() <
    EDIT_WINDOW_MS;
  const postedAt = formatDistanceToNow(new Date(argument.createdAt), {
    addSuffix: true,
  });

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (isDebateOver) return;

    try {
      const success = await dataService.voteOnArgument(argument.id, voteType);
      if (success) {
        if (voteType === "upvote") {
          if (userVote === "upvote") {
            setUpvotes(upvotes - 1);
            setUserVote(null);
          } else if (userVote === "downvote") {
            setDownvotes(downvotes - 1);
            setUpvotes(upvotes + 1);
            setUserVote("upvote");
          } else {
            setUpvotes(upvotes + 1);
            setUserVote("upvote");
          }
        } else {
          if (userVote === "downvote") {
            setDownvotes(downvotes - 1);
            setUserVote(null);
          } else if (userVote === "upvote") {
            setUpvotes(upvotes - 1);
            setDownvotes(downvotes + 1);
            setUserVote("downvote");
          } else {
            setDownvotes(downvotes + 1);
            setUserVote("downvote");
          }
        }

        if (onVote) {
          onVote();
        }
      } else {
        console.error("Failed to vote on argument");
      }
    } catch (error) {
      console.error("Error voting on argument:", error);
    }
  };

  const handleSaveEdit = () => {
    onUpdateArgumentText(argument.id, editedText);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDeleteArgument(argument.id);
  };

  if (!author) return null;

  return (
    <Card className="bg-card/50">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-3">
        <Avatar>
          <AvatarImage src={author.avatarUrl} />
          <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <p className="font-semibold">{author.name}</p>
          <p className="text-xs text-muted-foreground">{postedAt}</p>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={3}
          />
        ) : (
          <p className="text-foreground/90">{argument.text}</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant={userVote === "upvote" ? "default" : "outline"}
            size="sm"
            onClick={() => handleVote("upvote")}
            disabled={isDebateOver}
            className={
              userVote === "upvote" ? "bg-green-500 hover:bg-green-600" : ""
            }
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            {upvotes}
          </Button>
          <Button
            variant={userVote === "downvote" ? "default" : "outline"}
            size="sm"
            onClick={() => handleVote("downvote")}
            disabled={isDebateOver}
            className={
              userVote === "downvote" ? "bg-red-500 hover:bg-red-600" : ""
            }
          >
            <ThumbsDown className="mr-2 h-4 w-4" />
            {downvotes}
          </Button>
        </div>
        {isEditable && !isDebateOver && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="ghost" size="icon" onClick={handleSaveEdit}>
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
