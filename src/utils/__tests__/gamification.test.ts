import { describe, it, expect } from 'vitest'
import { updateAchievements, calculateStreaks } from '../gamification'
import type { MetricEntry, MetricDefinition } from '../../types'

function makeMetric(id: string): MetricDefinition {
  return {
    id,
    name: id,
    type: 'number',
    category: 'custom',
    createdAt: new Date('2026-01-01'),
  }
}

function makeEntry(metricId: string, dateStr: string): MetricEntry {
  return {
    id: `${metricId}-${dateStr}`,
    metricId,
    value: 1,
    date: new Date(`${dateStr}T12:00:00`),
    createdAt: new Date(`${dateStr}T12:00:00`),
    updatedAt: new Date(`${dateStr}T12:00:00`),
  }
}

// Builds entries for every metric on every date given.
function makeCompleteDays(metrics: MetricDefinition[], dateStrs: string[]): MetricEntry[] {
  return dateStrs.flatMap(dateStr => metrics.map(m => makeEntry(m.id, dateStr)))
}

function findAchievement(entries: MetricEntry[], metrics: MetricDefinition[], id: string) {
  const streaks = calculateStreaks(entries)
  const achievements = updateAchievements(entries, metrics, streaks)
  const found = achievements.find(a => a.id === id)
  if (!found) throw new Error(`achievement ${id} not found`)
  return found
}

describe('perfect-week achievement', () => {
  const metrics = [makeMetric('sleep'), makeMetric('mood')]

  it('unlocks when every metric is logged for 7 consecutive days', () => {
    const days = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05', '2026-01-06', '2026-01-07']
    const entries = makeCompleteDays(metrics, days)

    const achievement = findAchievement(entries, metrics, 'perfect-week')

    expect(achievement.isUnlocked).toBe(true)
    expect(achievement.progress).toBe(7)
  })

  it('does not unlock when one day in the run is missing a metric', () => {
    const days = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05', '2026-01-06', '2026-01-07']
    const entries = makeCompleteDays(metrics, days)
      // Remove the 'mood' entry for the 4th day, breaking that day's completeness.
      .filter(e => !(e.metricId === 'mood' && e.date.toISOString().startsWith('2026-01-04')))

    const achievement = findAchievement(entries, metrics, 'perfect-week')

    expect(achievement.isUnlocked).toBe(false)
  })

  it('does not unlock when complete days are not consecutive', () => {
    // 4 complete days, then a gap, then 3 more complete days: longest run is only 4.
    const firstRun = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04']
    const secondRun = ['2026-01-06', '2026-01-07', '2026-01-08']
    const entries = makeCompleteDays(metrics, [...firstRun, ...secondRun])

    const achievement = findAchievement(entries, metrics, 'perfect-week')

    expect(achievement.isUnlocked).toBe(false)
    expect(achievement.progress).toBe(4)
  })

  it('reports partial progress capped at maxProgress for a run shorter than a week', () => {
    const days = ['2026-01-01', '2026-01-02', '2026-01-03']
    const entries = makeCompleteDays(metrics, days)

    const achievement = findAchievement(entries, metrics, 'perfect-week')

    expect(achievement.progress).toBe(3)
    expect(achievement.isUnlocked).toBe(false)
  })
})
