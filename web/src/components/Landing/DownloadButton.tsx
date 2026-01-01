import { AppleIcon, GooglePlayIcon } from "../ui/Icons";
import styles from "./DownloadButton.module.css";

interface DownloadButtonProps {
  platform: "appstore" | "googleplay";
  size?: "small" | "large";
}

export default function DownloadButton({
  platform,
  size = "large",
}: DownloadButtonProps) {
  const isAppStore = platform === "appstore";
  const iconSize = size === "small" ? 22 : isAppStore ? 32 : 28;

  return (
    <a
      href={isAppStore ? "https://apps.apple.com" : "https://play.google.com"}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.button} ${styles[size]} ${isAppStore ? styles.appStore : styles.googlePlay}`}
      aria-label={
        isAppStore ? "Скачать в App Store" : "Получить в Google Play"
      }
    >
      <div className={styles.icon}>
        {isAppStore ? (
          <AppleIcon size={iconSize} />
        ) : (
          <GooglePlayIcon size={iconSize} />
        )}
      </div>
      <div className={styles.text}>
        <div className={styles.topText}>
          {isAppStore ? "Скачать в" : "ДОСТУПНО В"}
        </div>
        <div className={styles.bottomText}>
          {isAppStore ? "App Store" : "Google Play"}
        </div>
      </div>
    </a>
  );
}
