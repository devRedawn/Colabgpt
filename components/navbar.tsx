import Link from "next/link";
import { buttonVariants } from "./ui/button";
import ToggleTheme from "./toggle";
import { NamedLogoWithLink } from "./logo";
import Profile from "./profile";
import { SquarePen, Settings } from "lucide-react";
import { isAdmin } from "@/lib/auth";

const btnVariant = buttonVariants({
  variant: "link",
  className: "text-base flex flex-row item-center",
  size: "sm",
});

export default async function Navbar() {
  const userIsAdmin = await isAdmin();

  return (
    <nav className="w-full flex flex-row items-center justify-between h-24 sm:mb-7 mmb-2 top-0 sticky bg-background">
      <NamedLogoWithLink />
      <div className="flex-row items-center flex">
        <ToggleTheme />
        <div className="sm:ml-3 flex flex-row items-center">
          <Link href="/chat" className={btnVariant}>
            <SquarePen className="w-5 h-5 sm:hidden flex" />
            <span className="sm:flex hidden">New chat</span>
          </Link>
          {userIsAdmin && (
            <Link href="/admin" className={btnVariant}>
              <Settings className="w-5 h-5 sm:hidden flex" />
              <span className="sm:flex hidden">Admin</span>
            </Link>
          )}
          <Profile />
        </div>
      </div>
    </nav>
  );
}
