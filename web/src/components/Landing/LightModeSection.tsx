import Image from "next/image";
import styles from "./LightModeSection.module.css";

export default function LightModeSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.textContent}>
            <div className={styles.badge}>NEW FEATURE</div>
            <h2 className={styles.heading}>
              Light Mode for a sleek tracking experience!
            </h2>
            <div className={styles.emojiRow}>
              <span className={styles.emoji}>☀️</span>
              <span className={styles.emoji}>✨</span>
              <span className={styles.emoji}>✨</span>
            </div>
            <p className={styles.subtitle}>New features weekly :)</p>
          </div>

          <div className={styles.phoneWrapper}>
            <div className={styles.phoneFrame}>
              <div className={styles.phoneContent}>
                <Image
                  src="/light.jpg"
                  alt="Light Mode"
                  fill
                  className={styles.phoneImage}
                  style={{
                    objectFit: "contain",
                    objectPosition: "center center",
                  }}
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
