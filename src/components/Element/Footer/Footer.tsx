import Link from "next/link";
import { Mail } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { FiGithub } from "react-icons/fi";
import Image from "next/image";

const footerLinks = {
  resources: [
    { name: "Documentation", href: "https://gelaps-mantle.gitbook.io/docs/" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

const socialLinks = [
  { name: "Twitter", href: "https://x.com/gelapmantle", icon: FaXTwitter },
  { name: "Github", href: "https://github.com", icon: FiGithub },
  {
    name: "Email",
    href: "mailto:gelapmantle@gmail.com",
    icon: Mail,
  },
  // { name: "Discord", href: "https://discord.com", icon: MessageCircle },
];

export function Footer() {
  return (
    <footer className="bg-black border-t border-stormy_teal-500/20">
      <div className="max-w-[75em] mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex gap-4 flex-row items-center h-12 mb-4">
              <Image
                src="/favicon/vector.webp"
                alt="Gelap Logo"
                width={48}
                height={48}
              />
              <h3 className="text-3xl font-bold text-white ">Gelap</h3>
            </div>

            <p className="text-white/60 text-lg mb-4">
              Confidential RWA Dark Pool on Mantle.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="text-white/40 hover:text-stormy_teal-500 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="h-8 w-8" />
                </Link>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div className="w-full max-lg:mt-4">
            <h4 className="text-white font-semibold mb-4 text-2xl lg:text-3xl lg:h-12">
              Resources
            </h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    target="_blank"
                    className="text-white/60 hover:text-stormy_teal-500 text-lg transition-colors"
                  >
                    {link.name}
                    <span className="inline-block ml-1 mb-2">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-stormy_teal-500/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-lg">
            © {new Date().getFullYear()} Gelap. All rights reserved.
          </p>
          <p className="text-white/40 text-lg">
            Trade In The Dark, Settle In The Light.
          </p>
        </div>
      </div>
    </footer>
  );
}
