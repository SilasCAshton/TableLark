import HomeRestaurantSearch from "@/components/home/HomeRestaurantSearch";

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__shade" />

        <header className="home-header">
          <div className="home-logo" aria-label="TableLark home">
            <span className="home-logo__mark" aria-hidden="true">TL</span>
            <span className="home-logo__name">TableLark</span>
          </div>
        </header>

        <div className="home-hero__content">
          <p className="home-hero__eyebrow">Good food. Great company.</p>
          <h1 id="home-title">Find a table worth talking about.</h1>
          <p className="home-hero__intro">
            Discover memorable restaurants nearby and uncover the local spots
            that make an ordinary night out feel special.
          </p>

          <HomeRestaurantSearch />
        </div>
      </section>

      <section className="home-story" aria-labelledby="home-story-title">
        <p className="home-story__eyebrow">Beyond the usual</p>
        <h2 id="home-story-title">The best places are often the ones you almost miss.</h2>
        <p>
          TableLark is built to shine a light on wonderful restaurants that sit
          just off the beaten path: the neighborhood kitchen with a loyal
          following, the tiny cafe tucked around the corner, and the family-run
          spot your friends will still be talking about next week.
        </p>
        <p>
          Our goal is to make finding those places simple, welcoming, and fun,
          so you can spend less time deciding where to go and more time sharing
          a great meal with the people you enjoy most.
        </p>
        <div className="home-story__accent" aria-hidden="true">
          <span>Discover</span>
          <span>Gather</span>
          <span>Enjoy</span>
        </div>
      </section>
    </main>
  );
}
