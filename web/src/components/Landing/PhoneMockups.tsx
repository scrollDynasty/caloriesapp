import Image from "next/image";
import styles from "./PhoneMockups.module.css";

export default function PhoneMockups() {
  return (
    <div className={styles.container}>
      {/* Left phone - scanning */}
      <div className={styles.phoneLeft}>
        <div className={styles.phoneFrame}>
          <div className={styles.phoneContent}>
            <Image
              src="/food-demo.png"
              alt="Scanning food"
              fill
              className={styles.phoneImage}
              style={{ objectFit: "cover" }}
            />
            <div className={styles.scanArea}></div>
            <div className={styles.scanOverlay}></div>
          </div>
        </div>
      </div>

      {/* Right phone - results */}
      <div className={styles.phoneRight}>
        <div className={styles.phoneFrame}>
          <div className={styles.phoneContent}>
            <Image
              src="/food-demo.png"
              alt="Food results"
              fill
              className={styles.phoneImage}
              style={{ objectFit: "cover" }}
            />
            <div className={styles.resultOverlay}>
              <div className={styles.resultHeader}>
                <h3 className={styles.resultTitle}>Pancakes with...</h3>
              </div>
              <div className={styles.resultStats}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Calories</div>
                  <div className={styles.statValue}>615</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Carbs</div>
                  <div className={styles.statValue}>93g</div>
                </div>
              </div>
              <button className={styles.doneButton}>Done</button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating labels */}
      <div className={styles.label1}>
        <div className={styles.labelTitle}>Blueberries</div>
        <div className={styles.labelValue}>8</div>
      </div>
      <div className={styles.label2}>
        <div className={styles.labelTitle}>Pancakes</div>
        <div className={styles.labelValue}>595</div>
      </div>
      <div className={styles.label3}>
        <div className={styles.labelTitle}>Syrup</div>
        <div className={styles.labelValue}>12</div>
      </div>
    </div>
  );
}
