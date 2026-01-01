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
    title: "Освободите своё время",
    description:
      "Yeb-Ich автоматически рассчитывает калории, белки, углеводы и жиры. Вы также можете добавлять свои продукты и рецепты. Больше не нужно считать калории вручную.",
  },
  {
    id: "integrate",
    icon: "❤️",
    title: "Интеграция с вашими любимыми фитнес-продуктами",
    description:
      "Yeb-Ich интегрируется с вашими любимыми фитнес-продуктами. Таким образом, вы можете отслеживать калории, белки, углеводы, жиры и тренировки.",
  },
  {
    id: "weight",
    icon: "📈",
    title: "Сбрасывайте вес без усилий",
    description:
      "Сделайте фото с помощью Yeb-Ich, и датчик глубины вашего телефона рассчитает объём пищи. Наш искусственный интеллект анализирует и разбирает ваше блюдо, определяя калории, белки, углеводы и жиры.",
  },
];

export default function WhyChooseSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.heading}>Почему стоит выбрать Yeb-Ich?</h2>
        <p className={styles.subtitle}>
          Yeb-Ich — самый продвинутый трекер калорий.
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
