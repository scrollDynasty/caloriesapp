"use client";

import { useEffect, useState } from "react";

export interface SectionColor {
  id: string;
  color: string;
}

export function useScrollColorTransition(sections: SectionColor[]) {
  const [currentColor, setCurrentColor] = useState(
    sections[0]?.color || "#FFFFF0",
  );

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -20% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute("data-section-id");
          const section = sections.find((s) => s.id === sectionId);
          if (section) {
            setCurrentColor(section.color);
          }
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    sections.forEach((section) => {
      const element = document.querySelector(
        `[data-section-id="${section.id}"]`,
      );
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sections]);

  return currentColor;
}
