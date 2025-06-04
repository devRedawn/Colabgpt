import Navbar from "@/components/navbar";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";

export default async function PrivateLayout({ children }: PropsWithChildren) {
  const session = await getUser();
  
  // Only redirect if there's definitely no session
  if (!session?.id) {
    redirect("/login");
  }

  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
}
