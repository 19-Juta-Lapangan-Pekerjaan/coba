import { cn } from "@/src/lib/utils";
import { Marquee } from "@/src/components/ui/marquee";
import Image from "next/image";
import { memo } from "react";

const reviews = [
  {
    name: "Alex Chen",
    username: "@alexchen",
    body: "Finally, true privacy in crypto. Gelap made my transactions completely untraceable.",
    img: "https://avatar.vercel.sh/alex",
  },
  {
    name: "Sarah Kim",
    username: "@sarahk",
    body: "The ZK-proofs are incredible. I can prove my holdings without revealing amounts.",
    img: "https://avatar.vercel.sh/sarah",
  },
  {
    name: "Michael B",
    username: "@michaelb",
    body: "Privacy pools changed everything. My crypto is finally mine again.",
    img: "https://avatar.vercel.sh/michael",
  },
  {
    name: "Elena V",
    username: "@elenav",
    body: "Multi-chain privacy support is a game changer. Love using it on Mantle.",
    img: "https://avatar.vercel.sh/elena",
  },
  {
    name: "David R",
    username: "@davidr",
    body: "Best privacy solution in web3. Simple to use, powerful results.",
    img: "https://avatar.vercel.sh/david",
  },
  {
    name: "Lisa Wang",
    username: "@lisawang",
    body: "Dark transfers are seamless. No more wallet tracking worries.",
    img: "https://avatar.vercel.sh/lisa",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = memo(
  ({
    img,
    name,
    username,
    body,
  }: {
    img: string;
    name: string;
    username: string;
    body: string;
  }) => {
    return (
      <figure
        className={cn(
          "relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-6",
          "border-stormy_teal-500/20 bg-black/40 backdrop-blur-sm",
          "hover:bg-stormy_teal-500/10 hover:border-stormy_teal-500/40 transition-all"
        )}
      >
        <div className="flex flex-row items-center gap-2">
          <Image
            className="rounded-full"
            width={32}
            height={32}
            alt={`${name} avatar`}
            src={img}
            loading="lazy"
            unoptimized
          />
          <div className="flex flex-col">
            <figcaption className="text-sm font-medium text-white">
              {name}
            </figcaption>
            <p className="text-xs font-medium text-stormy_teal-500">
              {username}
            </p>
          </div>
        </div>
        <blockquote className="mt-2 text-sm text-white/70">{body}</blockquote>
      </figure>
    );
  }
);

ReviewCard.displayName = "ReviewCard";

export default function Testimonials() {
  return (
    <section
      id="testimonies"
      className="relative flex h-fit bg-radial-[at_50%_75%] from-dark_teal_3-400 to-black/10 w-full flex-col items-center justify-start overflow-hidden py-24"
    >
      {/* Header */}
      <div className="text-center z-10 mb-12">
        <h2 className="bg-gradient-to-br from-white via-white to-stormy_teal-900 bg-clip-text text-4xl font-bold tracking-tighter text-transparent sm:text-6xl">
          What they say about
          <br />
          Gelap?
        </h2>
      </div>

      {/* Marquee Container */}
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
        <Marquee pauseOnHover className="[--duration:30s] py-4">
          {firstRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:30s] py-4">
          {secondRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>

        {/* Gradient overlays */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-black via-black/40 to-transparent"></div>
      </div>

      {/* Top/Bottom Gradient overlays */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black to-transparent"></div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black to-transparent"></div>
    </section>
  );
}
