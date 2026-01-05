"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import DownloadButton from "../Landing/DownloadButton";
import styles from "./Header.module.css";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <Link href="/" className={styles.logoLink} onClick={closeMenu}>
            <div className={styles.logoContainer}>
              <Image
                src="/logo.png"
                alt="Логотип Yeb-Ich"
                width={48}
                height={48}
                className={styles.logoImage}
                priority
                unoptimized
              />
            </div>
          </Link>
          <Link href="/" className={styles.logoTextLink} onClick={closeMenu}>
            <h1 className={styles.logoText}>Yeb-Ich</h1>
          </Link>
        </div>

        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>
            Главная
          </Link>
          <Link href="/jobs" className={styles.navLink}>
            Вакансии
          </Link>
          <Link href="/press" className={styles.navLink}>
            Пресса
          </Link>
          <Link href="/subscription" className={styles.navLink}>
            Управление подпиской
          </Link>
        </div>

        <div className={styles.navActions}>
          <DownloadButton platform="appstore" size="small" />
          <DownloadButton platform="googleplay" size="small" />
        </div>

        <button
          type="button"
          className={styles.mobileMenuButton}
          onClick={toggleMenu}
          aria-label="Переключить меню"
          aria-expanded={isMenuOpen}
        >
          <span
            className={`${styles.burgerLine} ${isMenuOpen ? styles.burgerLineOpen : ""}`}
          />
          <span
            className={`${styles.burgerLine} ${isMenuOpen ? styles.burgerLineOpen : ""}`}
          />
          <span
            className={`${styles.burgerLine} ${isMenuOpen ? styles.burgerLineOpen : ""}`}
          />
        </button>
      </nav>

      <div
        className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""}`}
      >
        <div className={styles.mobileMenuContent}>
          <Link href="/" className={styles.mobileNavLink} onClick={closeMenu}>
            Главная
          </Link>
          <Link
            href="/jobs"
            className={styles.mobileNavLink}
            onClick={closeMenu}
          >
            Вакансии
          </Link>
          <Link
            href="/press"
            className={styles.mobileNavLink}
            onClick={closeMenu}
          >
            Пресса
          </Link>
          <Link
            href="/subscription"
            className={styles.mobileNavLink}
            onClick={closeMenu}
          >
            Управление подпиской
          </Link>
          <div className={styles.mobileMenuActions}>
            <DownloadButton platform="appstore" size="large" />
            <DownloadButton platform="googleplay" size="large" />
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div
          className={styles.mobileMenuOverlay}
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
}
