import styles from "./WhyChooseSection.module.css";

interface FeatureCard {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const features: FeatureCard[] = [
  {
    id: "time",
    icon: "🎯",
    title: "Free up your time",
    description:
      "Yeb-Ich automatically calculates your calories, protein, carbs, and fat. You can also add your own foods and recipes. So no need to calculate calories manually.",
  },
  {
    id: "integrate",
    icon: "❤️",
    title: "Integrate with your favorite fitness products",
    description:
      "Yeb-Ich integrates with your favorite fitness products. So you can track your calories, protein, carbs, fat AND exercises.",
  },
  {
    id: "weight",
    icon: "📈",
    title: "Lose weight effortlessly",
    description:
      "Snap a photo with Yeb-Ich, and your phone's depth sensor calculates food volume. Our AI then analyzes and breaks down your meal to determine calories, protein, carbs, and fat.",
  },
];

export default function WhyChooseSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.heading}>Why choose Yeb-Ich?</h2>
        <p className={styles.subtitle}>
          Yeb-Ich is the most advanced calorie tracker.
        </p>

        <div className={styles.cards}>
          {features.map((feature) => (
            <div key={feature.id} className={styles.card}>
              <div className={styles.iconContainer}>
                <span className={styles.icon}>{feature.icon}</span>
              </div>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
