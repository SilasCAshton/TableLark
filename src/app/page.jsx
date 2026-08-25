import Link from "next/link";
import Image from "next/image";
import HomeRestaurantSearch from "@/components/home/HomeRestaurantSearch";

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__shade" />

        <header className="home-header">
          <div className="home-header__nav">
            <div className="home-logo" aria-label="TableLark home">
              <Image
                className="home-logo__mark"
                src="/tablelark-logo-classic.png"
                alt=""
                width={48}
                height={48}
                priority
              />
              <span className="home-logo__name">TableLark</span>
            </div>
            <Link className="home-finder-link" href="/finder">
              Finder
            </Link>
          </div>
        </header>

        <div className="home-hero__content">
          <p className="home-hero__eyebrow">Your next favorite place might be nearby</p>
          <h1 id="home-title">Let's find somewhere worth going.</h1>
          <p className="home-hero__intro">
            Whether you’re in the mood for a familiar favorite or 
            somewhere you’ve never tried, finding the right table should feel simple.
          </p>

          <HomeRestaurantSearch />
        </div>
      </section>

      <section className="home-story" aria-labelledby="home-story-title">
        <p className="home-story__eyebrow">Look beyond the usual</p>
        <h2 id="home-story-title">The best places are often the ones you almost miss.</h2>
        <p>
          Great restaurants can be easy to miss, tucked into quiet neighborhoods, hidden 
          behind modest storefronts, or buried several pages deep in a typical search. 
          Small, well-loved places deserve to be seen, and we want to make it easier 
          for people to discover and share them with others.
        </p>
        <p>
          TableLark is built to help you find somewhere you’ll genuinely want to go. 
          Whether you’re looking for a well-known favorite or a small local café, 
          we’ll help you explore your options and choose a place that feels right.
        </p>
        <div className="home-story__accent" aria-hidden="true">
          <span>Discover</span>
          <span>Gather</span>
          <span>Share</span>
        </div>
      </section>
    </main>
  );
}
