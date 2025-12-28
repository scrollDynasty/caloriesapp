import Image from "next/image";
import FloatingLabel from "../ui/FloatingLabel";
import styles from "./PhoneMockups.module.css";

export default function PhoneMockups() {
  return (
    <div className={styles.container}>
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

      <FloatingLabel title="Blueberries" value="8" position="top-right" />
      <FloatingLabel title="Pancakes" value="595" position="middle-right" />
      <FloatingLabel title="Syrup" value="12" position="middle-center" />
    </div>
  );
}
