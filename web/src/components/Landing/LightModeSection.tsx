import Image from "next/image";
import styles from "./LightModeSection.module.css";

export default function LightModeSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.textContent}>
            <div className={styles.badge}>НОВАЯ ФУНКЦИЯ</div>
            <h2 className={styles.heading}>
              Светлая тема для элегантного опыта отслеживания!
            </h2>
            <div className={styles.emojiRow}>
              <span className={styles.emoji}>☀️</span>
              <span className={styles.emoji}>✨</span>
              <span className={styles.emoji}>✨</span>
            </div>
            <p className={styles.subtitle}>Новые функции каждую неделю :)</p>
          </div>

          <div className={styles.phoneWrapper}>
            <div className={styles.phoneFrame}>
              <div className={styles.phoneContent}>
                <Image
                  src="/light.jpg"
                  alt="Светлая тема"
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
