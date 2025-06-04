import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { PanelLeftIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "./ui/button";
import { getUser } from "@/lib/auth";
import { ScrollArea } from "./ui/scroll-area";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { decryptMessage } from "@/lib/encryption";

export default function LeftPanel() {
  return (
    <Sheet>
      <SheetTrigger>
        <div className="flex flex-row items-center gap-2">
          <PanelLeftIcon className="w-5 h-5 mt-1" />
          <span className="mt-1 sm:hidden flex">Menu</span>
        </div>
      </SheetTrigger>
      <SheetContent side="left" className="min-w-[390px] px-0">
        <div>
          <h3 className="px-7 text-xl font-semibold">Conversations</h3>
          <Suspense
            fallback={
              <p className={buttonVariants({ variant: "link" })}>Loading...</p>
            }
          >
            <ConversationList />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  );
}

async function ConversationList() {
  const user = await getUser();
  if (!user) return null;
  
  // Query Firestore for conversations belonging to the current user
  const db = getAdminFirestore();
  const conversationsRef = db.collection("conversations");
  const querySnapshot = await conversationsRef
    .where("userId", "==", user.id)
    .orderBy("createdAt", "desc")
    .get();
  
  // Convert the query snapshot to an array of conversations
  const conversations = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  if (conversations.length === 0) {
    return (
      <div className="px-7 mt-4 text-muted-foreground">
        No conversations yet. Start a new chat!
      </div>
    );
  }
  
  return (
    <ScrollArea className="flex flex-col mt-7 items-start overflow-y-auto h-[90vh] pb-5">
      {conversations.map((cn: any) => (
        <SheetClose asChild key={cn.id}>
          <Link
            href={`/chat/${cn.id}`}
            className="w-full my-3 px-8 hover:underline underline-offset-2"
          >
            {(() => {
              const decryptedName = decryptMessage(cn.name);
              return decryptedName.length > 35 ? decryptedName.slice(0, 35) + "..." : decryptedName;
            })()}
          </Link>
        </SheetClose>
      ))}
    </ScrollArea>
  );
}
