import styles from "./SocialProof.module.css";

export default function SocialProof() {
  return (
    <div className={styles.badge}>
      <div className={styles.users}>
        <div className={styles.userAvatar}></div>
        <div className={styles.userAvatar}></div>
        <div className={styles.userAvatar}></div>
      </div>
      <div className={styles.text}>Loved by 5M users with</div>
      <div className={styles.rating}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className={styles.starIcon}
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="currentColor"
          />
        </svg>
        <span className={styles.ratingText}>4.9 rating</span>
      </div>
    </div>
  );
}

