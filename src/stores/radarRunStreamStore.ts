/**
 * External store for radar run stream events.
 * Only components that subscribe re-render when events change.
 */

export interface RadarRunStreamEvent {
  run_uuid?: string;
  source_site?: string;
  work_unit_key?: string;
  count: number;
  total_crawled?: number;
  timestamp: Date;
}

const MAX_EVENTS = 50;

let events: RadarRunStreamEvent[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((f) => f());
}

export const radarRunStreamStore = {
  addEvent(payload: Omit<RadarRunStreamEvent, 'timestamp'>) {
    events = [
      ...events.slice(-(MAX_EVENTS - 1)),
      { ...payload, timestamp: new Date() }
    ];
    emit();
  },

  getSnapshot(): RadarRunStreamEvent[] {
    return events;
  },

  subscribe(onStoreChange: () => void): () => void {
    listeners.add(onStoreChange);
    return () => listeners.delete(onStoreChange);
  }
};
