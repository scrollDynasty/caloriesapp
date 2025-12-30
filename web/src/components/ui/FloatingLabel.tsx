import styles from "./FloatingLabel.module.css";

interface FloatingLabelProps {
  title: string;
  value: string | number;
  position: "top-right" | "middle-right" | "middle-center";
}

export default function FloatingLabel({
  title,
  value,
  position,
}: FloatingLabelProps) {
  return (
    <div className={`${styles.label} ${styles[position]}`}>
      <div className={styles.labelTitle}>{title}</div>
      <div className={styles.labelValue}>{value}</div>
    </div>
  );
}
