import { StarIcon } from "../ui/Icons";
import styles from "./SocialProof.module.css";

export default function SocialProof() {
  return (
    <div className={styles.badge}>
      <div className={styles.users}>
        <div className={styles.userAvatar} />
        <div className={styles.userAvatar} />
        <div className={styles.userAvatar} />
      </div>
      <div className={styles.text}>Более тысячи человек с</div>
      <div className={styles.rating}>
        <StarIcon size={14} className={styles.starIcon} />
        <span className={styles.ratingText}>4.9 rating</span>
      </div>
    </div>
  );
}
