/**
 * Mission / Pursuit constants
 * Phases and goal types must match backend founder/pursuit/phases.go
 */

import type { GoalType } from '@/api/founder/schemas';

/** Ordered phases per goal type */
export const PHASES_BY_GOAL_TYPE: Record<GoalType, string[]> = {
  resume_management: ['auditing', 'skill_gap', 'learning', 'executing', 'achieved'],
  job_search: ['positioning', 'preparing', 'testing', 'iterating', 'achieved'],
  company_launch: ['learning', 'ideating', 'validating', 'building', 'launching'],
  job_management: ['onboarding', 'learning', 'performing', 'advancing'],
  stock_investing: ['learning', 'paper_trading', 'live_trading', 'portfolio_management'],
  personal_brand: ['learning', 'creating', 'publishing', 'growing', 'monetizing']
};

/** Human-readable goal type labels */
export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  job_search: 'Job Search',
  company_launch: 'Company Launch',
  stock_investing: 'Stock Investing',
  personal_brand: 'Personal Brand',
  job_management: 'Job Management',
  resume_management: 'Resume Management'
};

/** Human-readable phase labels (snake_case → Title Case) */
export function formatPhaseLabel(phase: string): string {
  return phase
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Human-readable track type labels */
export const TRACK_TYPE_LABELS: Record<string, string> = {
  learn: 'Learn',
  execute: 'Execute',
  discover: 'Discover'
};
