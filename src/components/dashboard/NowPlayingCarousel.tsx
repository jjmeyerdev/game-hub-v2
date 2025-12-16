'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { UserGame } from '@/app/_actions/games';
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

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Calculate scroll progress (0-100)
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

    // Scroll by approximately 3 card widths
    const cardWidth = 340;
    const scrollAmount = cardWidth * 3;

    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (games.length === 0) return null;

  return (
    <div className="relative group">
      {/* Holographic frame */}
      <div className="absolute inset-0 pointer-events-none z-20 rounded-xl">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-6 h-6">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 to-transparent" />
          <div className="absolute top-0 left-0 h-full w-0.5 bg-gradient-to-b from-cyan-400 to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-6 h-6">
          <div className="absolute top-0 right-0 w-full h-0.5 bg-gradient-to-l from-cyan-400 to-transparent" />
          <div className="absolute top-0 right-0 h-full w-0.5 bg-gradient-to-b from-cyan-400 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 w-6 h-6">
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-transparent" />
          <div className="absolute bottom-0 left-0 h-full w-0.5 bg-gradient-to-t from-purple-400 to-transparent" />
        </div>
        <div className="absolute bottom-0 right-0 w-6 h-6">
          <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-l from-purple-400 to-transparent" />
          <div className="absolute bottom-0 right-0 h-full w-0.5 bg-gradient-to-t from-purple-400 to-transparent" />
        </div>
      </div>

      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-void to-transparent z-10 pointer-events-none rounded-l-xl" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-void to-transparent z-10 pointer-events-none rounded-r-xl" />

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-2 px-4 scrollbar-hide scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {games.map((game, index) => (
          <div
            key={game.id}
            className="flex-shrink-0 scroll-snap-align-start"
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
          className="
            absolute left-2 top-1/2 -translate-y-1/2 z-30
            w-10 h-10 flex items-center justify-center
            bg-void/90 backdrop-blur-sm
            border border-cyan-500/40 hover:border-cyan-400
            rounded-lg
            text-cyan-400 hover:text-cyan-300
            transition-all duration-300
            hover:bg-cyan-500/10 hover:shadow-[0_0_20px_rgba(0,217,255,0.3)]
            group/btn
          "
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 group-hover/btn:-translate-x-0.5 transition-transform" />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="
            absolute right-2 top-1/2 -translate-y-1/2 z-30
            w-10 h-10 flex items-center justify-center
            bg-void/90 backdrop-blur-sm
            border border-cyan-500/40 hover:border-cyan-400
            rounded-lg
            text-cyan-400 hover:text-cyan-300
            transition-all duration-300
            hover:bg-cyan-500/10 hover:shadow-[0_0_20px_rgba(0,217,255,0.3)]
            group/btn
          "
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Progress track */}
      {games.length > 3 && (
        <div className="flex justify-center mt-4">
          <div className="w-32 h-1 bg-steel/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-150"
              style={{ width: `${Math.max(20, scrollProgress)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
