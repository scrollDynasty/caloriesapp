import Image from "next/image";
import styles from "./TestimonialsSection.module.css";

interface Testimonial {
  id: string;
  username: string;
  quote: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    username: "pree.palmer",
    quote:
      "im ngl I've lost 17 lbs with it doesn't need to be exact it's pretty decent",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    id: "2",
    username: "Ordinary Tony",
    quote: "IVE BEEN BULKING FOR A YEAR STRAIGHT W APP FR 💪💪💪",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
  {
    id: "3",
    username: "2025weightlossa...",
    quote:
      "I love your app it helps me keep track of my food without overthinking everything and gives me a visual of my portions plus it's so aesthetic ❤",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  },
  {
    id: "4",
    username: "Mathias",
    quote: "I started to use it yesterday and im already giving it 5 ⭐",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
  },
  {
    id: "5",
    username: "Ms Nsofor",
    quote:
      "For people that want to control their calories @yebich.app is the app for you 🔥🔥",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  },
];

export default function TestimonialsSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.heading}>Thousands of users talk about us</h2>

        <div className={styles.cardsGrid}>
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className={styles.card}>
              <div className={styles.avatarContainer}>
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.username}
                  width={48}
                  height={48}
                  className={styles.avatar}
                  unoptimized
                />
              </div>
              <div className={styles.cardContent}>
                <div className={styles.username}>{testimonial.username}</div>
                <p className={styles.quote}>{testimonial.quote}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
