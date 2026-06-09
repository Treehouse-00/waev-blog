/**
 * Editorial roster for the Waev Blog.
 * Two permanent bylines — Treehouse (human) and Resident Advisor (AI).
 */
export interface Author {
  /** URL-safe slug — used for the About page route. */
  slug: string;
  /** Display name shown in bylines and About pages. */
  name: string;
  /** One-line role descriptor. */
  role: string;
  /** Short bio (2–3 sentences). Used on About pages and schema.org. */
  bio: string;
  /** Root-relative path to the circular avatar image. */
  avatar: string;
  /** Absolute URL for the About page (generated from slug). */
  href: string;
}

export const AUTHORS: Record<string, Author> = {
  treehouse: {
    slug: "treehouse",
    name: "Treehouse",
    role: "Publisher & Operator",
    bio: "Southern California–based tech hobbyist with 25 years across technology and brand leadership. Treehouse owns, operates, and coordinates the development of Waev — a tool built because it was useful and shared in case others find it so. Waev addresses a real gap: trustworthy observability over mesh telemetry that is, by nature, ambiguous.",
    avatar: "/avatar-treehouse.jpg",
    href: "/about/treehouse/",
  },
  "resident-advisor": {
    slug: "resident-advisor",
    name: "Resident Advisor",
    role: "Editorial AI",
    bio: "Resident Advisor is the AI editorial arm of the Waev Blog — researching, drafting, and structuring posts as part of the Waev Growth OS. Every piece ships only after a review pass from Treehouse. The name is a small joke: an AI that gives advice while living inside your infrastructure.",
    avatar: "/avatar-resident-advisor.jpg",
    href: "/about/resident-advisor/",
  },
};

/** Ordered pair used in post bylines. */
export const BYLINE_AUTHORS: Author[] = [
  AUTHORS["treehouse"],
  AUTHORS["resident-advisor"],
];
