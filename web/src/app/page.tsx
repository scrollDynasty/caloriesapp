"use client";

import { useEffect, useState } from "react";
import FeaturesSection from "../components/Landing/FeaturesSection";
import Hero from "../components/Landing/Hero";
import InfluencersSection from "../components/Landing/InfluencersSection";
import PhoneMockups from "../components/Landing/PhoneMockups";
import WhyChooseSection from "../components/Landing/WhyChooseSection";
import Header from "../components/Layout/Header";
import styles from "./page.module.css";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollPosition > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={styles.page}>
      <div 
        className={styles.headerWrapper}
        style={isScrolled ? {
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        } as React.CSSProperties : {}}
      >
        <div className={styles.headerContent}>
          <Header />
        </div>
      </div>
      <div className={styles.container}>
        <div className={styles.content}>
          <Hero />
          <PhoneMockups />
        </div>
      </div>
      <div className={styles.influencersWrapper}>
        <InfluencersSection />
      </div>
      <FeaturesSection />
      <WhyChooseSection />
    </div>
  );
}
