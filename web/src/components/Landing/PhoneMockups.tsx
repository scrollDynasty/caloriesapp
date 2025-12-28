import Image from "next/image";
import styles from "./PhoneMockups.module.css";

export default function PhoneMockups() {
  return (
    <div className={styles.container}>
      <div className={styles.phoneLeft}>
        <div className={styles.phoneFrame}>
          <div className={styles.phoneContent}>
            <Image
              src="/photo1.jpg"
              alt="Track Your Food With Just a Picture"
              fill
              className={styles.phoneImage}
              style={{ objectFit: "cover", objectPosition: "60% center" }}
              unoptimized
            />
          </div>
        </div>
      </div>

      <div className={styles.phoneRight}>
        <div className={styles.phoneFrame}>
          <div className={styles.phoneContent}>
            <Image
              src="/photo3.jpg"
              alt="Hydration & Fitness Tracking"
              fill
              className={styles.phoneImage}
              style={{ objectFit: "cover", objectPosition: "60% center" }}
              unoptimized
            />
          </div>
        </div>
      </div>
    </div>
  );
}
