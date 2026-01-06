"use client";

import { Home, User, MessageCircle, FileText } from "lucide-react";
import { NavBar } from "./NavbarImplementation";

export function NavBarPage() {
  const navItems = [
    { name: "Home", url: "#", icon: Home, blank: false },
    { name: "About", url: "#about", icon: User, blank: false },
    {
      name: "Testimonies",
      url: "#testimonies",
      icon: MessageCircle,
      blank: false,
    },
    {
      name: "Documentation",
      url: "https://gelaps-mantle.gitbook.io/docs/",
      icon: FileText,
      blank: true,
    },
  ];

  return <NavBar items={navItems} />;
}
