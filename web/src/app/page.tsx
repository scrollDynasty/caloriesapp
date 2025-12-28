import Hero from "../components/Landing/Hero";
import PhoneMockups from "../components/Landing/PhoneMockups";
import Header from "../components/Layout/Header";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Header />
        <div className={styles.content}>
          <Hero />
          <PhoneMockups />
        </div>
      </div>
    </div>
  );
}
