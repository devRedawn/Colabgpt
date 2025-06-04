import { getAdminFirestore } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import Chat from "./chat";
import { JsonMessagesArraySchema } from "@/types";
import { requireAuth } from "@/lib/auth";

type PageParams = {
  params: {
    id: string;
  };
};

export default async function ChatSpecificPage({ params: { id } }: PageParams) {
  // Ensure user is authenticated
  const user = await requireAuth();
  
  // Get the conversation document from Firestore
  const db = getAdminFirestore();
  const conversationRef = db.collection("conversations").doc(id);
  const conversationSnap = await conversationRef.get();
  
  if (!conversationSnap.exists) return notFound();
  
  const conversationData = conversationSnap.data();
  
  // Check if the conversation belongs to the current user
  if (conversationData.userId !== user.id) return notFound();
  
  const parseResult = JsonMessagesArraySchema.parse(conversationData.messages);
  
  return <Chat id={id} messages={parseResult} />;
}
