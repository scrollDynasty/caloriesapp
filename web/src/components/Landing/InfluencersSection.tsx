import Image from "next/image";
import styles from "./InfluencersSection.module.css";

interface InfluencerCardProps {
  name: string;
  quote: string;
  imageUrl: string;
}

function InfluencerCard({ name, quote, imageUrl }: InfluencerCardProps) {
  return (
    <div className={styles.card}>
      <Image
        src={imageUrl}
        alt={name}
        fill
        className={styles.cardImage}
        style={{ objectFit: "cover" }}
      />
      <div className={styles.cardOverlay}>
        <div className={styles.quoteIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
      quote: "Make a healthier choice for your latenight snack and use the Yeb-Ich app to track your calories",
      imageUrl: "https://www.figma.com/api/mcp/asset/13970ff3-5871-45b9-bb91-511eed34e08d",
    },
    {
      name: "Dawson Gibbs",
      quote: "Track with Yeb-Ich app, if you're not tracking your calories while going for your goals then you're doing it all wrong.",
      imageUrl: "https://www.figma.com/api/mcp/asset/b28b1c09-63fd-4c08-aeee-758f93c43459",
    },
    {
      name: "Hussein Farhat",
      quote: "If you're tracking your calories and macros correctly with Yeb-Ich, you can get away with eating almost anything and still get in shape as long as it matches your daily goals.",
      imageUrl: "https://www.figma.com/api/mcp/asset/dfd8883c-42e6-4763-9af7-bd70a4739a2d",
    },
  ];

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Used by your favorite fitness influencers 👀</h2>
      <div className={styles.cards}>
        {influencers.map((influencer) => (
          <InfluencerCard key={influencer.name} {...influencer} />
        ))}
      </div>
    </section>
  );
}

