"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./FeaturesSection.module.css";

interface Feature {
  id: string;
  title: string;
  description: string;
  image: string; 
}

const features: Feature[] = [
  {
    id: "track-food",
    title: "Track Your Food With Just a Picture",
    description: "Snap a photo with Yeb-Ich, and your phone's depth sensor calculates food volume. Our AI then analyzes and breaks down your meal to determine calories, protein, carbs, and fat.",
    image: "/food-demo.png",
  },
  {
    id: "search-database",
    title: "Search Our Database of over 1 million foods",
    description: "Quickly find and log foods from our extensive database. Search by name, brand, or scan barcodes for instant nutritional information.",
    image: "/food-demo.png",
  },
  {
    id: "progress-tracking",
    title: "Complete Progress Tracking and AI suggestions",
    description: "Monitor your weight, measurements, and nutrition goals. Get personalized AI suggestions to stay on track and optimize your diet.",
    image: "/food-demo.png",
  },
  {
    id: "water-exercise",
    title: "Keep track of your water and daily exercise",
    description: "Log your water intake and daily exercise effortlessly. Yeb-Ich helps you stay hydrated and active, integrating seamlessly with your fitness routine.",
    image: "/food-demo.png",
  },
];

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState<string>(features[0].id);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  const currentFeature = features.find((f) => f.id === activeFeature) || features[0];
  const displayFeature = hoveredFeature 
    ? features.find((f) => f.id === hoveredFeature) || currentFeature
    : currentFeature;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.heading}>What does Yeb-Ich include?</h2>
        
        <div className={styles.content}>
          <div className={styles.phoneWrapper}>
            <div className={styles.phoneFrame}>
              <div className={styles.phoneContent}>
                <Image
                  src={displayFeature.image}
                  alt={displayFeature.title}
                  fill
                  className={styles.phoneImage}
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              </div>
            </div>
          </div>

          <div className={styles.featuresList}>
            {features.map((feature) => {
              const isActive = activeFeature === feature.id;
              const isHovered = hoveredFeature === feature.id;
              
              return (
                <div
                  key={feature.id}
                  className={`${styles.featureCard} ${isActive ? styles.featureCardActive : ""}`}
                  onClick={() => setActiveFeature(feature.id)}
                  onMouseEnter={() => setHoveredFeature(feature.id)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureDescription}>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

