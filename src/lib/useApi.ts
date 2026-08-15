"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerLatest, TimeRange } from "./types";

export interface MetaResponse {
  events: { id: number; name: string; deadline_time: string; is_current: boolean; is_next: boolean; finished: boolean }[];
  teams: { id: number; name: string; short_name: string }[];
  currentEventId: number | null;
  snapshotCount: number;
  firstSnapshotTs: number | null;
  lastSnapshotTs: number | null;
  serverNow: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

/** Pings the snapshot endpoint on an interval so ownership history keeps growing
 * while the dashboard is open — the client acts as a co-pilot to server cron. */
export function useLiveSnapshotPing(intervalMs = 4 * 60 * 1000) {
  useEffect(() => {
    const ping = () => {
      fetch("/api/snapshot", { method: "POST" }).catch(() => {});
    };
    ping();
    const id = setInterval(ping, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

export function useMeta(refreshMs = 60000) {
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchJson<MetaResponse>("/api/meta")
      .then(setMeta)
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, refreshMs);
    return () => clearInterval(id);
  }, [load, refreshMs]);

  return { meta, error, reload: load };
}

export function usePlayers(range: TimeRange, refreshMs = 60000) {
  const [players, setPlayers] = useState<PlayerLatest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rangeRef = useRef(range);
  rangeRef.current = range;

  const load = useCallback(() => {
    fetchJson<{ range: TimeRange; players: PlayerLatest[] }>(`/api/players?range=${range}`)
      .then((data) => {
        if (rangeRef.current === range) {
          setPlayers(data.players);
          setLoading(false);
        }
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [range]);

  useEffect(() => {
    setLoading(true);
    load();
    const id = setInterval(load, refreshMs);
    return () => clearInterval(id);
  }, [load, refreshMs]);

  return { players, loading, error, reload: load };
}

export interface HistorySeries {
  player_id: number;
  points: { ts: number; selected_by_percent: number; now_cost: number; total_points: number }[];
}

export function useHistory(ids: number[], range: TimeRange, refreshMs = 90000) {
  const [series, setSeries] = useState<HistorySeries[]>([]);
  const [loading, setLoading] = useState(false);
  const key = ids.slice().sort((a, b) => a - b).join(",");

  useEffect(() => {
    if (ids.length === 0) {
      setSeries([]);
      return;
    }
    let cancelled = false;
    const load = () => {
      setLoading(true);
      fetchJson<{ series: HistorySeries[] }>(`/api/history?ids=${key}&range=${range}`)
        .then((data) => {
          if (!cancelled) {
            setSeries(data.series);
            setLoading(false);
          }
        })
        .catch(() => !cancelled && setLoading(false));
    };
    load();
    const id = setInterval(load, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, range, refreshMs]);

  return { series, loading };
}

export interface MoversResponse {
  range: TimeRange;
  direction: "rising" | "falling";
  players: PlayerLatest[];
}

export function useMovers(range: TimeRange, direction: "rising" | "falling", breakout = false, refreshMs = 60000) {
  const [data, setData] = useState<PlayerLatest[]>([]);
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchJson<MoversResponse>(
        `/api/movers?range=${range}&direction=${direction}&limit=10${breakout ? "&breakout=1" : ""}`
      )
        .then((res) => !cancelled && setData(res.players))
        .catch(() => {});
    };
    load();
    const id = setInterval(load, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [range, direction, breakout, refreshMs]);
  return data;
}
