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
                alt="Yeb-Ich logo"
                width={64}
                height={64}
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

        {/* Мобильное бургер-меню */}
        <button
          type="button"
          className={styles.mobileMenuButton}
          onClick={toggleMenu}
          aria-label="Toggle menu"
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

      {/* Мобильное меню */}
      <div
        className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""}`}
      >
        <div className={styles.mobileMenuContent}>
          <Link href="/" className={styles.mobileNavLink} onClick={closeMenu}>
            Home
          </Link>
          <Link
            href="/jobs"
            className={styles.mobileNavLink}
            onClick={closeMenu}
          >
            Jobs
          </Link>
          <Link
            href="/press"
            className={styles.mobileNavLink}
            onClick={closeMenu}
          >
            Press
          </Link>
          <Link
            href="/subscription"
            className={styles.mobileNavLink}
            onClick={closeMenu}
          >
            Manage Subscription
          </Link>
          <div className={styles.mobileMenuActions}>
            <DownloadButton platform="appstore" size="large" />
            <DownloadButton platform="googleplay" size="large" />
          </div>
        </div>
      </div>

      {/* Overlay для закрытия меню */}
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
