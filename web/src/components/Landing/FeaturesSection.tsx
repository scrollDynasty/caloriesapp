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
    description:
      "Snap a photo with Yeb-Ich, and your phone's depth sensor calculates food volume. Our AI then analyzes and breaks down your meal to determine calories, protein, carbs, and fat.",
    image: "/photo1.jpg",
  },
  {
    id: "search-database",
    title: "AI Goals and Nutrition",
    description:
      "Set personalized nutrition goals powered by AI. Get intelligent recommendations for your daily intake, track your progress, and optimize your diet based on your health objectives.",
    image: "/photo4.jpg",
  },
  {
    id: "progress-tracking",
    title: "Complete Progress Tracking and AI suggestions",
    description:
      "Monitor your weight, measurements, and nutrition goals. Get personalized AI suggestions to stay on track and optimize your diet.",
    image: "/photo2.png",
  },
  {
    id: "water-exercise",
    title: "Hydration & Fitness Tracking",
    description:
      "Stay on top of your wellness journey. Track your daily water intake, log workouts, and monitor your activity levels. Yeb-Ich seamlessly integrates with your fitness routine to help you achieve your health goals.",
    image: "/photo3.jpg",
  },
];

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState<string>(features[0].id);
  const [imageKey, setImageKey] = useState(0);

  const displayFeature =
    features.find((f) => f.id === activeFeature) || features[0];

  const handleFeatureClick = (featureId: string) => {
    setActiveFeature(featureId);
    setImageKey((prev) => prev + 1);
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.heading}>What does Yeb-Ich include?</h2>

        <div className={styles.content}>
          <div className={styles.phoneWrapper}>
            <div className={styles.phoneFrame}>
              <div className={styles.phoneContent}>
                <div className={styles.imageContainer}>
                  <Image
                    key={imageKey}
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
          </div>

          <div className={styles.featuresList}>
            {features.map((feature) => {
              const isActive = activeFeature === feature.id;

              return (
                <button
                  key={feature.id}
                  type="button"
                  className={`${styles.featureCard} ${isActive ? styles.featureCardActive : ""}`}
                  onClick={() => handleFeatureClick(feature.id)}
                >
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureDescription}>
                    {feature.description}
                  </p>
                  {isActive && <div className={styles.activeIndicator} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
