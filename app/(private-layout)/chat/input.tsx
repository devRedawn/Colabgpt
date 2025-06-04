"use client";

import Submit from "@/components/submit";
import { Input } from "@/components/ui/input";
import { newChat } from "@/actions/chat";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export default function ChatInput() {
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(formData: FormData) {
    const message = formData.get("message") as string;
    if (!message) return;
    
    const result = await newChat({
      message,
    });
    
    if (result && "message" in result) {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-row items-center gap-2 sm:pr-5"
    >
      <Input
        autoComplete="off"
        name="message"
        placeholder="Ask me something..."
        className="h-12"
      />
      <Submit />
    </form>
  );
}
