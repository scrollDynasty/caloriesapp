import Image from "next/image";
import Link from "next/link";
import DownloadButton from "../Landing/DownloadButton";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <nav className={styles.nav}>
      <div className={styles.navLeft}>
        <div className={styles.logoContainer}>
          <Image src="/logo.png" alt="Yeb-Ich logo" width={32} height={32} />
        </div>
        <h1 className={styles.logoText}>Yeb-Ich</h1>
      </div>

      <div className={styles.navLinks}>
        <Link href="/" className={styles.navLink}>
          Home
        </Link>
        <Link href="/jobs" className={styles.navLink}>
          Jobs
        </Link>
        <Link href="/press" className={styles.navLink}>
          Press
        </Link>
        <Link href="/subscription" className={styles.navLink}>
          Manage Subscription
        </Link>
      </div>

      <div className={styles.navActions}>
        <DownloadButton platform="appstore" size="small" />
        <DownloadButton platform="googleplay" size="small" />
      </div>
    </nav>
  );
}

