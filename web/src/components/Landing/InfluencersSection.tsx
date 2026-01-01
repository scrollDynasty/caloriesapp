import Image from "next/image";
import styles from "./InfluencersSection.module.css";

interface InfluencerCardProps {
  name: string;
  quote: string;
  imageUrl: string;
  index: number;
}

function InfluencerCard({ name, quote, imageUrl, index }: InfluencerCardProps) {
  const isCenterRow = index >= 3 && index < 6;

  return (
    <div
      className={`${styles.card} ${isCenterRow ? styles.cardCenterRow : ""}`}
      style={isCenterRow ? { transform: "translateY(-80px)" } : undefined}
    >
      <Image
        src={imageUrl}
        alt={name}
        fill
        className={styles.cardImage}
        style={{ objectFit: "cover" }}
      />
      <div className={styles.cardOverlay}>
        <div className={styles.quoteIcon}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-label="Quote icon"
            role="img"
          >
            <path
              d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"
              fill="white"
            />
          </svg>
        </div>
        <h3 className={styles.cardName}>{name}</h3>
        <p className={styles.cardQuote}>{quote}</p>
      </div>
    </div>
  );
}

export default function InfluencersSection() {
  const influencers = [
    {
      name: "Jeremiah Jones",
      quote:
        "Делайте более здоровый выбор для позднего перекуса и используйте приложение Yeb-Ich для отслеживания калорий",
      imageUrl:
        "https://www.figma.com/api/mcp/asset/13970ff3-5871-45b9-bb91-511eed34e08d",
    },
    {
      name: "Dawson Gibbs",
      quote:
        "Отслеживайте с приложением Yeb-Ich — если вы не отслеживаете калории, стремясь к своим целям, то делаете всё неправильно.",
      imageUrl:
        "https://www.figma.com/api/mcp/asset/b28b1c09-63fd-4c08-aeee-758f93c43459",
    },
    {
      name: "Hussein Farhat",
      quote:
        "Если вы правильно отслеживаете калории и макроэлементы с помощью Yeb-Ich, вы можете есть почти что угодно и всё равно оставаться в форме, пока это соответствует вашим ежедневным целям.",
      imageUrl:
        "https://www.figma.com/api/mcp/asset/dfd8883c-42e6-4763-9af7-bd70a4739a2d",
    },
    {
      name: "Marcus Johnson",
      quote:
        "Yeb-Ich полностью изменил то, как я отслеживаю своё питание. Это так просто и точно, что я не могу представить возврат к ручному учёту.",
      imageUrl:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&h=1200&fit=crop",
    },
    {
      name: "Alex Rivera",
      quote:
        "Распознавание с помощью ИИ в Yeb-Ich невероятно. Просто сделайте фото и получите мгновенный анализ макроэлементов. Это меняет правила игры для подготовки еды.",
      imageUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=1200&fit=crop",
    },
    {
      name: "Jordan Taylor",
      quote:
        "Как персональный тренер, я рекомендую Yeb-Ich всем своим клиентам. Это делает отслеживание калорий лёгким и помогает им оставаться последовательными.",
      imageUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop",
    },
  ];

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>
        Используется вашими любимыми фитнес-инфлюенсерами 👀
      </h2>
      <div className={styles.cards}>
        {influencers.map((influencer, index) => (
          <InfluencerCard key={influencer.name} {...influencer} index={index} />
        ))}
      </div>
    </section>
  );
}
