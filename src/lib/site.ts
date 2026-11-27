export const site = {
  email: "cbna.reca@gmail.com",
  phones: ["+237 670 02 53 26", "+237 677 32 24 99", "+237 655 71 42 44"],
};

export const telHref = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;

export const navItems = [
  { href: "/", key: "home" },
  { href: "/about", key: "about" },
  { href: "/programs", key: "programs" },
  { href: "/presence", key: "presence" },
  { href: "/jobs", key: "jobs" },
  { href: "/membership", key: "membership" },
  { href: "/contact", key: "contact" },
] as const;
