import { useState, useEffect, useRef, useCallback } from "react";
import slideScoreboard from "../assets/hero/slide-scoreboard-welcome.jpg";
import slideFans from "../assets/hero/slide-fans-cheer.jpg";
import slideTowels from "../assets/hero/slide-towels.jpg";
import slideTickets from "../assets/hero/slide-tickets.jpg";
import "./HeroSlider.css";

const SLIDES = [
  { image: slideScoreboard, title: "잠실 전광판에 뜬 우리 이름", sub: "엘고리즘, 잠실에서 만나요 🏟️" },
  { image: slideFans, title: "다같이 응원하는 그 순간", sub: "전광판에 잡힌 엘고리즘 응원석 📣" },
  { image: slideTowels, title: "노란 물결, 우리의 자부심", sub: "끝까지 트윈스 💛" },
  { image: slideTickets, title: "함께 본 경기, 쌓여가는 티켓", sub: "오늘도 직관 가실 분? 🎟️" },
];

const AUTO_INTERVAL = 4000;

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);

  const goTo = useCallback((i) => {
    setIndex((i + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, AUTO_INTERVAL);
    return () => clearInterval(timer);
  }, [paused]);

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

  const slide = SLIDES[index];

  return (
    <div
      className="hero-slider"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hero-slide">
        <img src={slide.image} alt={slide.title} className="hero-slide-img" />
        <div className="hero-slide-overlay">
          <p className="hero-slide-title">{slide.title}</p>
          <p className="hero-slide-sub">{slide.sub}</p>
        </div>
        <span className="hero-slide-count">{index + 1}/{SLIDES.length}</span>
      </div>

      <div className="hero-dots">
        {SLIDES.map((_, i) => (
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
