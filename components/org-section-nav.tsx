"use client";

import { MouseEvent, useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type SectionNavItem = {
  id: string;
  label: string;
};

export type OrgSectionNavProps = {
  sections: SectionNavItem[];
};

function visiblePixels(target: HTMLElement): number {
  const viewportTop = 0;
  const viewportBottom = window.innerHeight;
  const { top, bottom } = target.getBoundingClientRect();
  const visibleTop = Math.max(top, viewportTop);
  const visibleBottom = Math.min(bottom, viewportBottom);

  return Math.max(0, visibleBottom - visibleTop);
}

export function OrgSectionNav({ sections }: OrgSectionNavProps) {
  const [activeId, setActiveId] = useState(() => sections[0]?.id ?? "");

  useEffect(() => {
    if (!sections.length) {
      return;
    }
    setActiveId(sections[0].id);
  }, [sections]);

  const determineActive = useCallback(() => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return;
    }
    if (!sections.length) {
      return;
    }

    let nextActiveId = sections[0].id;
    let mostVisible = -1;

    for (const section of sections) {
      const target = document.getElementById(section.id);
      if (!target) {
        continue;
      }

      const visible = visiblePixels(target);
      if (visible > mostVisible) {
        mostVisible = visible;
        nextActiveId = section.id;
      }
    }

    setActiveId((previous) =>
      previous === nextActiveId ? previous : nextActiveId,
    );
  }, [sections]);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return;
    }
    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(() => {
      determineActive();
    });

    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((target): target is HTMLElement => target instanceof HTMLElement);

    targets.forEach((target) => observer.observe(target));

    const handleResize = () => determineActive();
    window.addEventListener("resize", handleResize);
    determineActive();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [determineActive, sections]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    setActiveId(id);

    const target = document.getElementById(id);
    if (!target) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    target.focus({ preventScroll: true });

    if (typeof window !== "undefined") {
      const hash = `#${id}`;
      if (window.location.hash !== hash) {
        const { pathname, search } = window.location;
        window.history.replaceState(null, "", `${pathname}${search}${hash}`);
      }
    }
  };

  if (!sections.length) {
    return null;
  }

  return (
    <nav aria-label="On this page" className="border-b border-gray-200">
      <div className="flex w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max items-center gap-8">
          {sections.map((section) => {
            const isActive = activeId === section.id;
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(event) => handleClick(event, section.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex items-center border-b pb-3 text-base font-semibold transition-colors",
                  isActive
                    ? "border-owl-purple text-owl-purple"
                    : "border-transparent text-gray-500 hover:text-gray-700",
                )}
              >
                {section.label}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
