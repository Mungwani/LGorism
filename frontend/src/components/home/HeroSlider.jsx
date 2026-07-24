import { useState, useEffect, useRef, useCallback } from "react";
import { getActiveBanners } from "../../utils/storage";
import "./HeroSlider.css";

const AUTO_INTERVAL = 4000;

export default function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    getActiveBanners()
      .then((banners) => setSlides(banners.map((b) => ({ image: b.imageBase64, title: b.title, sub: b.description }))))
      .catch(() => {});
  }, []);

  const goTo = useCallback((i) => {
    setIndex((i + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, AUTO_INTERVAL);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 40) goTo(index - 1);
    else if (delta < -40) goTo(index + 1);
    touchStartX.current = null;
    setPaused(false);
  }

  if (slides.length === 0) return null;
  const slide = slides[index] || slides[0];

  return (
    <div
      className="hero-slider"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hero-slide">
        <img src={slide.image} alt={slide.title || "슬라이드 이미지"} className="hero-slide-img" />
        {slide.title && (
          <div className="hero-slide-overlay">
            <p className="hero-slide-title">{slide.title}</p>
            <p className="hero-slide-sub">{slide.sub}</p>
          </div>
        )}
      </div>

      <div className="hero-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`hero-dot ${i === index ? "active" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`${i + 1}번째 사진`}
          />
        ))}
      </div>
    </div>
  );
}
