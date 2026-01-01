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
    title: "Отслеживайте еду одним снимком",
    description:
      "Сделайте фото с помощью Yeb-Ich, и датчик глубины вашего телефона рассчитает объём пищи. Наш искусственный интеллект анализирует и разбирает ваше блюдо, определяя калории, белки, углеводы и жиры.",
    image: "/photo1.jpg",
  },
  {
    id: "search-database",
    title: "Цели и питание на базе ИИ",
    description:
      "Установите персональные цели по питанию с помощью искусственного интеллекта. Получайте интеллектуальные рекомендации по ежедневному потреблению, отслеживайте прогресс и оптимизируйте рацион в соответствии с вашими целями в области здоровья.",
    image: "/photo4.jpg",
  },
  {
    id: "progress-tracking",
    title: "Полное отслеживание прогресса и рекомендации ИИ",
    description:
      "Отслеживайте вес, измерения и цели по питанию. Получайте персонализированные рекомендации от искусственного интеллекта, чтобы оставаться на правильном пути и оптимизировать свой рацион.",
    image: "/photo2.png",
  },
  {
    id: "water-exercise",
    title: "Отслеживание гидратации и фитнеса",
    description:
      "Будьте в курсе своего пути к здоровью. Отслеживайте ежедневное потребление воды, записывайте тренировки и контролируйте уровень активности. Yeb-Ich органично интегрируется с вашим фитнес-режимом, помогая достичь целей в области здоровья.",
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
        <h2 className={styles.heading}>Что включает Yeb-Ich?</h2>

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
