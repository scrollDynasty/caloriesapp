"use client";

import { useEffect, useState } from "react";
import Footer from "../../components/Layout/Footer";
import Header from "../../components/Layout/Header";
import styles from "./page.module.css";

export default function TermsPage() {
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
            <h1 className={styles.title}>Условия обслуживания</h1>
            <p className={styles.lastUpdated}>
              Последнее обновление: 28 ноября 2025 г.
            </p>
            <p className={styles.intro}>
              Внимательно прочтите настоящие Условия обслуживания перед доступом к Сервису Yeb-Ich или его использованием.
            </p>
          </div>

          <div className={styles.content}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>1. Термины и определения</h2>
              
              <h3 className={styles.subsectionTitle}>1.1. Толкование</h3>
              <p className={styles.paragraph}>
                Термины, написанные с заглавной буквы, имеют значения, указанные в настоящем Разделе, или определенные иным образом в настоящих Условиях. Определения применимы независимо от того, используются ли термины в единственном или множественном числе.
              </p>

              <h3 className={styles.subsectionTitle}>1.2. Определения</h3>
              <div className={styles.definitionList}>
                <div className={styles.definition}>
                  <strong>Аффилированное лицо</strong> означает любое юридическое лицо, которое контролируется Компанией, находится под ее контролем или под общим контролем с Компанией, где «контроль» означает прямое или косвенное владение не менее пятидесяти процентов (50%) доли в капитале или голосующих акций.
                </div>
                <div className={styles.definition}>
                  <strong>Приложение</strong> означает мобильное приложение под названием «Yeb-Ich», включая все связанные с ним функции, инструменты, контент и обновления.
                </div>
                <div className={styles.definition}>
                  <strong>Компания, Мы, Нас или Наш</strong> означает ООО "Yeb-Ich", зарегистрированное в Республике Узбекистан.
                </div>
                <div className={styles.definition}>
                  <strong>Устройство</strong> означает любое устройство, способное получить доступ к Сервису.
                </div>
                <div className={styles.definition}>
                  <strong>Сервис</strong> означает, в совокупности, Приложение, Веб-сайт, связанное программное обеспечение, контент, инструменты на основе искусственного интеллекта и любые услуги, предлагаемые Компанией.
                </div>
                <div className={styles.definition}>
                  <strong>Пользовательский контент</strong> означает любые изображения, фотографии, текст, метаданные или другой контент, загруженный, представленный или переданный Вами через Сервис.
                </div>
                <div className={styles.definition}>
                  <strong>Веб-сайт</strong> означает [ваш домен веб-сайта, например, yeb-ich.uz] и любые связанные с ним субдомены.
                </div>
                <div className={styles.definition}>
                  <strong>Вы</strong> означает физическое лицо, использующее Сервис, или юридическое лицо, от имени которого физическое лицо использует Сервис.
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>2. Согласие с Условиями</h2>
              <p className={styles.paragraph}>
                Ваш доступ к Сервису и его использование обусловлены Вашим согласием с настоящими Условиями и Политикой конфиденциальности Yeb-Ich. Получая доступ к Сервису или используя его, Вы подтверждаете, что прочитали, поняли и согласились быть связанными настоящими Условиями. Если Вы не согласны, Вы должны прекратить использование Сервиса.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>3. Право на использование; Возрастные требования</h2>
              <ul className={styles.list}>
                <li>Вы заявляете и гарантируете, что Вам исполнилось не менее 13 лет.</li>
                <li>Если Вам от 13 до 17 лет, Вы можете использовать Сервис только с согласия и под наблюдением родителя или законного опекуна, который полностью несет ответственность за всю деятельность, осуществляемую с использованием Сервиса.</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>4. Отказ от ответственности в отношении здоровья, питания и безопасности</h2>
              <p className={styles.paragraph}>
                Yeb-Ich не предоставляет медицинские консультации, диетологические услуги или профессиональные медицинские услуги. Все оценки калорий, диетологические сведения и идентификация продуктов питания являются автоматизированными приближениями и могут быть неполными или неточными.
              </p>
              <ul className={styles.list}>
                <li>Оценки калорий и питательных веществ являются приблизительными.</li>
                <li>Сервис не предназначен для диагностики, лечения, излечения или предотвращения каких-либо заболеваний.</li>
                <li>Вам следует обращаться к лицензированным специалистам за диетическими или медицинскими рекомендациями.</li>
                <li>Компания не несет ответственности за неточности в подсчете калорий или идентификации продуктов питания.</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>5. Пользовательский контент; Предоставление лицензии</h2>
              <p className={styles.paragraph}>
                Предоставляя Пользовательский контент, Вы заявляете, что владеете им или имеете на него права. Вы предоставляете Компании всемирную, безотзывную, безвозмездную, передаваемую, сублицензируемую лицензию на использование, воспроизведение, анализ, обработку, модификацию, публикацию и создание производных работ из Пользовательского контента для эксплуатации и улучшения Сервиса, включая обучение моделей искусственного интеллекта.
              </p>
              <p className={styles.paragraph}>
                Вы соглашаетесь не загружать незаконный, вредоносный, оскорбительный или нарушающий права контент.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>6. Запрещенные виды использования</h2>
              <ul className={styles.list}>
                <li>Загрузка насильственного, откровенного или незаконного контента.</li>
                <li>Обратное проектирование или конкурентный анализ.</li>
                <li>Обход мер защиты или несанкционированный доступ.</li>
                <li>Загрузка изображений лиц без законного согласия.</li>
                <li>Вмешательство в работу Сервиса.</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>7. Подписка, Биллинг и Покупки в Приложении</h2>
              <p className={styles.paragraph}>
                Покупки и подписки обрабатываются через сторонние платформы, такие как Apple App Store и Google Play Store. Их условия регулируют обработку платежей, продление и возврат средств.
              </p>
              <p className={styles.paragraph}>
                Подписки автоматически продлеваются, если не отменены как минимум за 24 часа до окончания текущего периода.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>8. Сторонние Сервисы</h2>
              <p className={styles.paragraph}>
                Сервис может включать ссылки или интеграцию со сторонним контентом или сервисами. Компания не контролирует и не несет ответственности за такие сервисы.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>9. Интеллектуальная Собственность</h2>
              <p className={styles.paragraph}>
                Все права на Сервис (за исключением Пользовательского контента) принадлежат исключительно Компании или ее лицензиарам. Вы не можете копировать, изменять, распространять, продавать или подвергать обратному проектированию любую часть Сервиса.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>10. Прекращение действия</h2>
              <p className={styles.paragraph}>
                Компания может приостановить или прекратить Ваш доступ в любое время, если Вы нарушите настоящие Условия. При прекращении действия все предоставленные Вам права немедленно прекращаются.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>11. Отказ от гарантий «КАК ЕСТЬ» и «КАК ДОСТУПНО»</h2>
              <p className={styles.paragraph}>
                Сервис предоставляется без каких-либо гарантий, явных или подразумеваемых. Компания отказывается от всех гарантий, включая гарантии товарной пригодности, пригодности для определенной цели, точности и ненарушения прав.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>12. Ограничение Ответственности</h2>
              <p className={styles.paragraph}>
                В максимальной степени, разрешенной законом, общая ответственность Компании не должна превышать большую из следующих сумм:
              </p>
              <ul className={styles.list}>
                <li>Сумма, которую Вы заплатили за предыдущие 12 месяцев, ИЛИ</li>
                <li>Сто долларов США (USD $100).</li>
              </ul>
              <p className={styles.paragraph}>
                Компания не несет ответственности за косвенный, случайный или последующий ущерб, включая упущенную выгоду или потерю данных.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>13. Уведомление DMCA</h2>
              <p className={styles.paragraph}>
                Уведомления о нарушении авторских прав могут быть направлены назначенному представителю Компании, как описано на Веб-сайте.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>14. Применимое Право</h2>
              <p className={styles.paragraph}>
                Настоящие Условия регулируются и толкуются в соответствии с законодательством Республики Узбекистан. Вы соглашаетесь с юрисдикцией судов Республики Узбекистан, за исключением случаев, когда применяется арбитраж.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>15. Арбитраж и Отказ от Коллективных Исков</h2>
              <p className={styles.paragraph}>
                Споры должны разрешаться путем обязательного индивидуального арбитража, администрируемого [Указать, кто будет администрировать арбитраж, например, Торгово-промышленная палата Республики Узбекистан, или указать на возможность обращения в государственные суды]. Коллективные и репрезентативные иски не допускаются.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>16. Разделимость и Отказ от Прав</h2>
              <p className={styles.paragraph}>
                Если какое-либо положение окажется недействительным, остальные положения останутся в силе. Неисполнение какого-либо права не означает отказ от него.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>17. Изменения настоящих Условий</h2>
              <p className={styles.paragraph}>
                Компания может обновлять настоящие Условия в любое время. О существенных изменениях будет объявлено посредством разумного уведомления. Продолжение использования Сервиса после обновлений означает принятие их.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>18. Контактная информация</h2>
              <p className={styles.paragraph}>
                Если у Вас есть вопросы относительно настоящих Условий, Вы можете связаться с нами по адресу:
              </p>
              <div className={styles.contactInfo}>
                <p className={styles.contactItem}>
                  <strong>Компания:</strong> ООО "Yeb-Ich"
                </p>
                <p className={styles.contactItem}>
                  <strong>Электронная почта:</strong>{" "}
                  <a href="mailto:info@yeb-ich.com" className={styles.link}>
                    info@yeb-ich.com
                  </a>
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

