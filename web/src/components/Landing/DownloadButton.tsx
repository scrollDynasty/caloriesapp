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
      href="#"
      className={`${styles.button} ${styles[size]} ${isAppStore ? styles.appStore : styles.googlePlay}`}
      aria-label={
        isAppStore
          ? "Download on the App Store"
          : "Get it on Google Play"
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
          {isAppStore ? "Download on the" : "GET IT ON"}
        </div>
        <div className={styles.bottomText}>
          {isAppStore ? "App Store" : "Google Play"}
        </div>
      </div>
    </a>
  );
}

