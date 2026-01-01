"use client";

import { useEffect, useState } from "react";
import FeaturesSection from "../components/Landing/FeaturesSection";
import Hero from "../components/Landing/Hero";
import InfluencersSection from "../components/Landing/InfluencersSection";
import LightModeSection from "../components/Landing/LightModeSection";
import PhoneMockups from "../components/Landing/PhoneMockups";
import TestimonialsSection from "../components/Landing/TestimonialsSection";
import WhyChooseSection from "../components/Landing/WhyChooseSection";
import Footer from "../components/Layout/Footer";
import Header from "../components/Layout/Header";
import { useScrollColorTransition } from "../hooks/useScrollColorTransition";
import styles from "./page.module.css";

const SECTION_COLORS = [
  { id: "hero", color: "#FFFFFF" }, // White
  { id: "influencers", color: "#FFFFF0" }, // Ivory
  { id: "features", color: "#FFFFF0" }, // Ivory
  { id: "why", color: "#FFFFF0" }, // Ivory
  { id: "light", color: "#FFFFF0" }, // Ivory
  { id: "testimonials", color: "#1E1A24" }, // Dark (Bastille)
  { id: "footer", color: "#FFFFF0" }, // Ivory
];

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const currentColor = useScrollColorTransition(SECTION_COLORS);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop;
      setIsScrolled(scrollPosition > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.backgroundColor = currentColor;
  }, [currentColor]);

  return (
    <div className={styles.page}>
      <div
        className={`${styles.headerWrapper} ${isScrolled ? styles.headerWrapperScrolled : ""}`}
      >
        <div className={styles.headerContent}>
          <Header />
        </div>
      </div>
      <div className={styles.container} data-section-id="hero">
        <div className={styles.content}>
          <Hero />
          <PhoneMockups />
        </div>
      </div>
      <div className={styles.influencersWrapper} data-section-id="influencers">
        <InfluencersSection />
      </div>
      <div data-section-id="features">
        <FeaturesSection />
      </div>
      <div data-section-id="why">
        <WhyChooseSection />
      </div>
      <div data-section-id="light">
        <LightModeSection />
      </div>
      <div data-section-id="testimonials">
        <TestimonialsSection />
      </div>
      <div data-section-id="footer">
        <Footer />
      </div>
    </div>
  );
}
