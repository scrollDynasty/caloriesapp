"use client";

import { useState } from "react";
import Footer from "../../components/Layout/Footer";
import Header from "../../components/Layout/Header";
import styles from "./page.module.css";

type NotificationType = "success" | "error" | null;

export default function PressPage() {
  const [formData, setFormData] = useState({
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const getApiUrl = () => {
        if (typeof window !== "undefined") {
          const hostname = window.location.hostname;
          if (hostname === "yeb-ich.com" || hostname === "www.yeb-ich.com") {
            return "https://api.yeb-ich.com";
          }
          if (hostname === "localhost" || hostname === "127.0.0.1") {
            return "http://localhost:8000";
          }
        }
        return process.env.NEXT_PUBLIC_API_URL || "https://api.yeb-ich.com";
      };

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/v1/press/inquiry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }),
      });

      if (!response.ok) {
        let errorMessage =
          "Не удалось отправить запрос. Пожалуйста, попробуйте снова.";
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              const errors = errorData.detail.map(
                (err: { loc?: string[]; msg?: string }) => {
                  const field = err.loc ? err.loc.join(".") : "поле";
                  return `${field}: ${err.msg || "Ошибка валидации"}`;
                },
              );
              errorMessage = errors.join("\n");
            } else if (typeof errorData.detail === "string") {
              errorMessage = errorData.detail;
            } else {
              errorMessage = JSON.stringify(errorData.detail);
            }
          }
        } catch {
          errorMessage = `Ошибка сервера: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Успешная отправка
      setFormData({ email: "", subject: "", message: "" });
      setNotification({
        type: "success",
        message: "Спасибо за ваш запрос! Мы свяжемся с вами в ближайшее время.",
      });

      // Автоматически скрываем уведомление через 5 секунд
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Не удалось отправить запрос. Пожалуйста, попробуйте позже.";

      setNotification({
        type: "error",
        message: errorMessage,
      });

      // Автоматически скрываем уведомление об ошибке через 7 секунд
      setTimeout(() => {
        setNotification(null);
      }, 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerWrapper}>
        <div className={styles.headerContent}>
          <Header />
        </div>
      </div>

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.headerSection}>
            <h1 className={styles.title}>Пресса</h1>
            <p className={styles.description}>
              Свяжитесь с нашей пресс-службой для медиа-запросов, интервью и
              пресс-релизов.
            </p>
          </div>

          {notification && (
            <div
              className={`${styles.notification} ${
                notification.type === "success"
                  ? styles.notificationSuccess
                  : styles.notificationError
              }`}
            >
              <div className={styles.notificationContent}>
                <span className={styles.notificationIcon}>
                  {notification.type === "success" ? "✓" : "✕"}
                </span>
                <span className={styles.notificationMessage}>
                  {notification.message}
                </span>
              </div>
              <button
                type="button"
                className={styles.notificationClose}
                onClick={() => setNotification(null)}
                aria-label="Закрыть уведомление"
              >
                ×
              </button>
            </div>
          )}

          <div className={styles.formCard}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Адрес электронной почты *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ваш.email@example.com"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="subject" className={styles.label}>
                  Тема *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Тема медиа-запроса"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message" className={styles.label}>
                  Сообщение *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Пожалуйста, укажите детали вашего медиа-запроса, включая сроки, информацию об издании и конкретные вопросы, на которые вы хотели бы получить ответы..."
                  className={styles.textarea}
                  rows={8}
                  required
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Отправка..."
                  : "Отправить запрос в пресс-службу"}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
