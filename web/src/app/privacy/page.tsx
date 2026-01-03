"use client";

import { useEffect, useState } from "react";
import Footer from "../../components/Layout/Footer";
import Header from "../../components/Layout/Header";
import styles from "./page.module.css";

export default function PrivacyPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop;
      setIsScrolled(scrollPosition > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={styles.page}>
      <div
        className={`${styles.headerWrapper} ${isScrolled ? styles.headerWrapperScrolled : ""}`}
      >
        <div className={styles.headerContent}>
          <Header />
        </div>
      </div>

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.headerSection}>
            <h1 className={styles.title}>Политика конфиденциальности</h1>
            <p className={styles.lastUpdated}>
              Последнее обновление:{" "}
              {new Date().toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className={styles.intro}>
              Политика разработана в соответствии с Конституцией Республики
              Узбекистан и Законом Республики Узбекистан от 02.07.2019 г. №
              ЗРУ-547 «О персональных данных».
            </p>
          </div>

          <div className={styles.content}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>1. Основные понятия</h2>
              <div className={styles.definitionList}>
                <div className={styles.definition}>
                  <strong>Персональные данные (ПД)</strong> — любая информация,
                  относящаяся к прямо или косвенно определенному или
                  определяемому физическому лицу (субъекту персональных данных).
                </div>
                <div className={styles.definition}>
                  <strong>Обработка ПД</strong> — любое действие с персональными
                  данными, включая сбор, запись, систематизацию, накопление,
                  хранение, уточнение (обновление, изменение), извлечение,
                  использование, передачу, обезличивание, удаление.
                </div>
                <div className={styles.definition}>
                  <strong>Оператор</strong> — ИП Матёкубов Умар Русланбекович,
                  зарегистрированный в Республике Узбекистан.
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                2. Какие данные мы собираем
              </h2>
              <p className={styles.paragraph}>
                Мы собираем данные, необходимые для работы функционала подсчета
                калорий и AI-анализа:
              </p>

              <h3 className={styles.subsectionTitle}>
                2.1. Данные, предоставляемые Пользователем:
              </h3>
              <ul className={styles.list}>
                <li>Фамилия, имя, отчество (при наличии);</li>
                <li>Номер телефона, адрес электронной почты;</li>
                <li>
                  Антропометрические данные: пол, возраст, рост, вес, уровень
                  физической активности;
                </li>
                <li>
                  Данные о питании: потребляемые продукты, история приемов пищи.
                </li>
              </ul>

              <h3 className={styles.subsectionTitle}>
                2.2. Данные, собираемые автоматически:
              </h3>
              <ul className={styles.list}>
                <li>
                  IP-адрес, тип устройства, версия операционной системы
                  (iOS/Android);
                </li>
                <li>Технические логи (сбои, ошибки);</li>
                <li>
                  Пользовательский контент: фотографии еды и продуктов,
                  загружаемые для анализа нейросетью.
                </li>
              </ul>

              <h3 className={styles.subsectionTitle}>
                2.3. Биометрические данные:
              </h3>
              <p className={styles.paragraph}>
                Мы не собираем биометрические данные для идентификации личности
                (сканы лица для входа по FaceID обрабатываются устройством и не
                передаются нам). Фотографии тела (Progress photos), загружаемые
                Пользователем, хранятся в зашифрованном виде и используются
                исключительно для визуализации прогресса Пользователя.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>3. Цели обработки данных</h2>
              <p className={styles.paragraph}>Мы обрабатываем данные для:</p>
              <ul className={styles.list}>
                <li>
                  Идентификации Пользователя и предоставления доступа к
                  Приложению.
                </li>
                <li>
                  Расчета суточной нормы калорий и БЖУ (белков, жиров,
                  углеводов).
                </li>
                <li>
                  Обучения алгоритмов искусственного интеллекта (AI) на основе
                  обезличенных фотографий еды.
                </li>
                <li>
                  Связи с Пользователем (техническая поддержка, уведомления).
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                4. Локализация и место хранения данныx
              </h2>
              <p className={styles.paragraph}>
                В целях соблюдения ст. 27-1 Закона РУз «О персональных данных»,
                мы используем гибридную инфраструктуру:
              </p>

              <h3 className={styles.subsectionTitle}>
                4.1. Персональные данные:
              </h3>
              <p className={styles.paragraph}>
                Сбор, систематизация и хранение баз данных, содержащих
                персональные данные граждан Республики Узбекистан (профиль
                пользователя, контакты, параметры здоровья), осуществляются на
                технических средствах (серверах), физически расположенных на
                территории Республики Узбекистан.
              </p>

              <h3 className={styles.subsectionTitle}>
                4.2. Медиа-контент:
              </h3>
              <p className={styles.paragraph}>
                Для ускорения работы Приложения и обработки изображений
                (фотографий еды) мы используем услуги облачного объектного
                хранилища. Фотографии хранятся в обезличенном виде (без прямой
                связи с ФИО внутри хранилища) на серверах партнера ООО «Yandex
                Cloud» (Яндекс.Облако).
              </p>

              <h3 className={styles.subsectionTitle}>
                4.3. Трансграничная передача:
              </h3>
              <p className={styles.paragraph}>
                Регистрируясь в Приложении, Пользователь дает письменное
                согласие на трансграничную передачу своего Пользовательского
                контента (фотографий) для целей технического хранения и
                AI-обработки.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                5. Порядок использования AI (Искусственного Интеллекта)
              </h2>
              <div className={styles.orderedList}>
                <p className={styles.paragraph}>
                  <strong>5.1.</strong> Приложение использует алгоритмы
                  машинного обучения для распознавания еды по фото.
                </p>
                <p className={styles.paragraph}>
                  <strong>5.2.</strong> Загружая фото еды, Пользователь
                  предоставляет Оператору неисключительное право использовать
                  эти изображения в обезличенном виде для дообучения и улучшения
                  моделей AI.
                </p>
                <p className={styles.paragraph}>
                  <strong>5.3.</strong> Фотографии, содержащие лица людей или
                  личную информацию, автоматически исключаются из обучающих
                  выборок.
                </p>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                6. Передача данных третьим лицам
              </h2>
              <p className={styles.paragraph}>
                Мы не передаем Ваши персональные данные третьим лицам, за
                исключением случаев:
              </p>
              <ul className={styles.list}>
                <li>
                  <strong>Технические партнеры:</strong> Хостинг-провайдеры (на
                  территории РУз) и облачные сервисы (Yandex Cloud) в рамках
                  договора на обработку данных.
                </li>
                <li>
                  <strong>Законные требования:</strong> По официальному запросу
                  правоохранительных органов Республики Узбекистан в порядке,
                  установленном законом.
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>7. Права Пользователя</h2>
              <p className={styles.paragraph}>Пользователь имеет право:</p>
              <ul className={styles.list}>
                <li>Получать информацию о своих хранящихся данных.</li>
                <li>
                  Требовать уточнения, блокирования или уничтожения своих
                  данных, если они являются неполными или неточными.
                </li>
                <li>Отозвать согласие на обработку данных.</li>
                <li>
                  Полностью удалить свой Аккаунт через настройки Приложения. При
                  удалении аккаунта все Персональные данные удаляются или
                  обезличиваются в течение 30 дней.
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>8. Безопасность</h2>
              <p className={styles.paragraph}>
                Мы принимаем правовые, организационные и технические меры для
                защиты данных от неправомерного доступа, включая шифрование
                передаваемых данных (SSL/TLS) и ограничение доступа сотрудников
                к базе данных.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                9. Заключительные положения
              </h2>
              <div className={styles.orderedList}>
                <p className={styles.paragraph}>
                  <strong>9.1.</strong> Настоящая Политика может быть изменена
                  Оператором. Новая редакция вступает в силу с момента
                  размещения.
                </p>
                <p className={styles.paragraph}>
                  <strong>9.2.</strong> К настоящей Политике применяется право
                  Республики Узбекистан.
                </p>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>10. Контакты</h2>
              <p className={styles.paragraph}>
                Все предложения или вопросы по настоящей Политике следует
                сообщать в Службу поддержки:
              </p>
              <div className={styles.contactInfo}>
                <p className={styles.contactItem}>
                  <strong>Оператор:</strong> ИП Матёкубов Умар Русланбекович
                </p>
                <p className={styles.contactItem}>
                  <strong>Телефон:</strong>{" "}
                  <a href="tel:+998936744994" className={styles.link}>
                    +998 93 674 49 94
                  </a>
                </p>
                <p className={styles.contactItem}>
                  <strong>Приложение:</strong> Yeb-Ich
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
