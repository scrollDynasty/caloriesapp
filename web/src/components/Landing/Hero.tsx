import DownloadButton from "./DownloadButton";
import styles from "./Hero.module.css";
import SocialProof from "./SocialProof";

export default function Hero() {
  return (
    <div className={styles.hero}>
      <SocialProof />

      <h1 className={styles.headline}>
        Знакомьтесь, Yeb-Ich
        <br />
        Отслеживайте калории
        <br />
        одним снимком
      </h1>

      <p className={styles.description}>
        Yeb-Ich — приложение на базе искусственного интеллекта для простого
        подсчёта калорий. Сделайте фото, отсканируйте штрихкод или опишите блюдо
        и получите мгновенную информацию о калориях и питательных веществах.
      </p>

      <div className={styles.actions}>
        <DownloadButton platform="appstore" size="large" />
        <DownloadButton platform="googleplay" size="large" />
      </div>
    </div>
  );
}
