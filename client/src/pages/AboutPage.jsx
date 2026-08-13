function AboutPage() {
  return (
    <div className="page about-page container">
      <header className="page-header">
        <h1>О компании FreightLog</h1>
        <p>Более 15 лет на рынке автомобильных грузоперевозок</p>
      </header>

      <section className="card section">
        <h2>О нас</h2>
        <p>
          FreightLog — транспортно-логистическая компания, работающая на территории Беларуси и стран
          СНГ. Мы специализируемся на перевозке промышленных, продовольственных и коммерческих грузов
          любой сложности.
        </p>
        <p>
          Собственный автопарк из 50+ единиц техники, штат опытных водителей и диспетчерская служба
          позволяют нам гарантировать соблюдение сроков и сохранность груза.
        </p>
      </section>

      <section className="card section">
        <h2>Наши услуги</h2>
        <ul className="about-list">
          <li>Межгородские перевозки по Беларуси</li>
          <li>Международные маршруты (Россия, Украина, Польша, Литва)</li>
          <li>Рефрижераторные перевозки продуктов питания</li>
          <li>Доставка негабаритных и тяжеловесных грузов</li>
          <li>Экспресс-доставка документов и ценностей</li>
          <li>Страхование груза и таможенное сопровождение</li>
        </ul>
      </section>

      <section className="card section">
        <h2>Почему выбирают нас</h2>
        <div className="about-benefits">
          <div className="about-benefit">
            <strong>24/7</strong>
            <span>Диспетчерская служба круглосуточно</span>
          </div>
          <div className="about-benefit">
            <strong>98%</strong>
            <span>Доставок вовремя за последний год</span>
          </div>
          <div className="about-benefit">
            <strong>50+</strong>
            <span>Единиц собственного автопарка</span>
          </div>
          <div className="about-benefit">
            <strong>12</strong>
            <span>Лет средний стаж водителей</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
