'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { UserGame } from '@/lib/actions/games';
import { NowPlayingCard } from './cards/NowPlayingCard';

interface NowPlayingCarouselProps {
  games: UserGame[];
  onEditGame: (game: UserGame) => void;
  onDeleteGame: (game: UserGame) => void;
}

export function NowPlayingCarousel({
  games,
  onEditGame,
  onDeleteGame,
}: NowPlayingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    const maxScroll = scrollWidth - clientWidth;
    const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
    setScrollProgress(progress);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [checkScroll, games.length]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;

    const cardWidth = 360;
    const scrollAmount = cardWidth * 2;

    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Auto-play loop
  useEffect(() => {
    if (games.length <= 1 || isPaused) return;

    const el = scrollRef.current;
    if (!el) return;

    const cardWidth = 360;
    const autoScrollInterval = setInterval(() => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 10;

      if (isAtEnd) {
        // Loop back to start
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Scroll to next card
        el.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }, 5000);

    return () => clearInterval(autoScrollInterval);
  }, [games.length, isPaused]);

  if (games.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-theme-primary to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-theme-primary to-transparent z-10 pointer-events-none" />

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {games.map((game, index) => (
          <div
            key={game.id}
            className="shrink-0"
            style={{ scrollSnapAlign: 'start' }}
          >
            <NowPlayingCard
              game={game}
              onEdit={() => onEditGame(game)}
              onDelete={() => onDeleteGame(game)}
              index={index}
            />
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="group/btn absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-theme-secondary border border-theme rounded-xl text-theme-muted hover:text-cyan-400 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-300 shadow-xl"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 group-hover/btn:-translate-x-0.5 transition-transform" />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="group/btn absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-theme-secondary border border-theme rounded-xl text-theme-muted hover:text-cyan-400 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-300 shadow-xl"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Progress indicator */}
      {games.length > 3 && (
        <div className="flex justify-center mt-4">
          <div className="w-24 h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-150"
              style={{ width: `${Math.max(20, scrollProgress)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
