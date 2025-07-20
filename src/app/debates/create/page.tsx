"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { dataService } from "@/lib/data-service";

const debateFormSchema = z.object({
  title: z
    .string()
    .min(10, { message: "Title must be at least 10 characters." })
    .max(120, { message: "Title must not be longer than 120 characters." }),
  description: z
    .string()
    .min(20, { message: "Description must be at least 20 characters." }),
  tags: z.string().min(1, { message: "Please add at least one tag." }),
  category: z.string({ required_error: "Please select a category." }),
  imageUrl: z
    .string()
    .min(1, { message: "Please upload an image for the debate." }),
  duration: z.string({ required_error: "Please select a duration." }),
});

type DebateFormValues = z.infer<typeof debateFormSchema>;

export default function CreateDebatePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        variant: "destructive",
        title: "Unauthorized",
        description: "You must be logged in to create a debate.",
      });
      router.push("/login");
    }
  }, [user, isLoading, router, toast]);

  const form = useForm<DebateFormValues>({
    resolver: zodResolver(debateFormSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "",
      category: "",
      imageUrl: "",
      duration: "",
    },
  });

  async function onSubmit(data: DebateFormValues) {
    setIsSubmitting(true);
    try {
      const formattedData = {
        ...data,
        tags: data.tags.split(",").map((tag) => tag.trim()),
        duration: parseInt(data.duration, 10),
      };

      console.log("Submitting debate data:", formattedData);

      const newDebate = await dataService.createDebate(formattedData);

      if (newDebate) {
        console.log("Created debate:", newDebate);
        toast({
          title: "Debate Created!",
          description: "Your new debate is now live.",
        });
        setTimeout(() => {
          router.push(`/debates/${newDebate.id}`);
        }, 100);
      } else {
        throw new Error("Failed to create debate");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create the debate. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-headline">
            Start a New Debate
          </CardTitle>
          <CardDescription>
            Fill out the details below to get the conversation started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 md:space-y-8"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Debate Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Should AI be regulated?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a brief, neutral overview of the debate topic."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Image</FormLabel>
                    <FormControl>
                      <ImageUpload
                        currentImageUrl={field.value}
                        onUploadComplete={(url) => {
                          field.onChange(url);
                        }}
                        onUploadError={(error) => {
                          toast({
                            variant: "destructive",
                            title: "Upload Error",
                            description: error,
                          });
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a high-quality, relevant image for the debate
                      banner. Images are hosted on ImgBB.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="tech, ethics, future" {...field} />
                      </FormControl>
                      <FormDescription>Comma-separated tags.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Politics">Politics</SelectItem>
                          <SelectItem value="Science">Science</SelectItem>
                          <SelectItem value="Social">Social</SelectItem>
                          <SelectItem value="Economics">Economics</SelectItem>
                          <SelectItem value="Environment">
                            Environment
                          </SelectItem>
                          <SelectItem value="Sports">Sports</SelectItem>
                          <SelectItem value="Entertainment">
                            Entertainment
                          </SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Debate Duration</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select how long the debate will last" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="3600">1 Hour</SelectItem>
                        <SelectItem value="43200">12 Hours</SelectItem>
                        <SelectItem value="86400">24 Hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Debate"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
