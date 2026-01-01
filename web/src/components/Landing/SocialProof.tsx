import styles from "./SocialProof.module.css";

export default function SocialProof() {
  return (
    <div className={styles.badge}>
      <div className={styles.users}>
        <div className={styles.userAvatar} />
        <div className={styles.userAvatar} />
        <div className={styles.userAvatar} />
      </div>
      <span className={styles.text}>Loved by thousands with ⭐ 4.9 rating</span>
    </div>
  );
}
