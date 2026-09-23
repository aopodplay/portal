// hooks/useCards.ts
'use client';
import { useEffect, useState } from 'react';
import {
  Card,
  CardFilters,
  getAllCards,
  getFeaturedCards,
  getMusicCards,
  getPodcastCards,
  getBibleCards,
  getRecentCards,
  getPopularCards,
} from '@/lib/cards';

type Fetcher = () => Promise<Card[]>;

export function useCards(fetcher: Fetcher, deps: any[] = []) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetcher()
      .then((data) => {
        if (active) setCards(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { cards, loading, error };
}