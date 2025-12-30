import DownloadButton from "./DownloadButton";
import styles from "./Hero.module.css";
import SocialProof from "./SocialProof";

export default function Hero() {
  return (
    <div className={styles.hero}>
      <SocialProof />

      <h1 className={styles.headline}>
        Meet Yeb-Ich
        <br />
        Track your calories
        <br />
        with just a picture
      </h1>

      <p className={styles.description}>
        Meet Yeb-Ich, the AI-powered app for easy calorie tracking. Snap a
        photo, scan a barcode, or describe your meal and get instant calorie and
        nutrient info.
      </p>

      <div className={styles.actions}>
        <DownloadButton platform="appstore" size="large" />
        <DownloadButton platform="googleplay" size="large" />
      </div>
    </div>
  );
}
