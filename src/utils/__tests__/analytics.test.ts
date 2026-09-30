import { describe, it, expect } from 'vitest'
import { findTopCorrelations } from '../analytics'
import type { MetricEntry, MetricDefinition } from '../../types'

function makeMetric(id: string, name: string): MetricDefinition {
  return {
    id,
    name,
    type: 'number',
    category: 'custom',
    createdAt: new Date('2026-01-01'),
  }
}

function makeEntry(metricId: string, dateStr: string, value: number): MetricEntry {
  return {
    id: `${metricId}-${dateStr}`,
    metricId,
    value,
    date: new Date(`${dateStr}T12:00:00`),
    createdAt: new Date(`${dateStr}T12:00:00`),
    updatedAt: new Date(`${dateStr}T12:00:00`),
  }
}

const dateRange = { start: new Date('2026-01-01'), end: new Date('2026-01-10') }

describe('findTopCorrelations', () => {
  const sleep = makeMetric('sleep', 'Sleep')
  const mood = makeMetric('mood', 'Mood')
  const screenTime = makeMetric('screen', 'Screen Time')

  it('finds a strong positive correlation between two metrics that move together', () => {
    const days = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05']
    const values = [3, 5, 4, 7, 6]
    const entries: MetricEntry[] = days.flatMap((day, i) => [
      makeEntry('sleep', day, values[i]),
      makeEntry('mood', day, values[i]),
    ])

    const results = findTopCorrelations(entries, [sleep, mood], dateRange)

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      metricAName: 'Sleep',
      metricBName: 'Mood',
      strength: 'strong',
      direction: 'positive',
    })
  })

  it('excludes weak correlations by default', () => {
    const days = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05']
    // Essentially unrelated series.
    const entries: MetricEntry[] = [
      makeEntry('sleep', days[0], 5),
      makeEntry('sleep', days[1], 3),
      makeEntry('sleep', days[2], 8),
      makeEntry('sleep', days[3], 2),
      makeEntry('sleep', days[4], 6),
      makeEntry('mood', days[0], 4),
      makeEntry('mood', days[1], 4),
      makeEntry('mood', days[2], 5),
      makeEntry('mood', days[3], 5),
      makeEntry('mood', days[4], 4),
    ]

    const results = findTopCorrelations(entries, [sleep, mood], dateRange)

    expect(results).toEqual([])
  })

  it('sorts multiple pairs by correlation strength, strongest first', () => {
    const days = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05']
    const strongValues = [1, 2, 3, 4, 5]
    const moderateValues = [2, 1, 4, 3, 5]
    const entries: MetricEntry[] = days.flatMap((day, i) => [
      makeEntry('sleep', day, strongValues[i]),
      makeEntry('mood', day, strongValues[i]),
      makeEntry('screen', day, moderateValues[i]),
    ])

    const results = findTopCorrelations(entries, [sleep, mood, screenTime], dateRange, {
      minStrength: 'weak',
    })

    expect(results[0]).toMatchObject({ metricAName: 'Sleep', metricBName: 'Mood' })
    expect(Math.abs(results[0].coefficient)).toBeGreaterThanOrEqual(Math.abs(results[1].coefficient))
  })

  it('respects the limit option', () => {
    const days = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05']
    const values = [1, 2, 3, 4, 5]
    const entries: MetricEntry[] = days.flatMap((day, i) => [
      makeEntry('sleep', day, values[i]),
      makeEntry('mood', day, values[i]),
      makeEntry('screen', day, values[i]),
    ])

    const results = findTopCorrelations(entries, [sleep, mood, screenTime], dateRange, {
      minStrength: 'weak',
      limit: 1,
    })

    expect(results).toHaveLength(1)
  })

  it('returns an empty array with fewer than two metrics', () => {
    expect(findTopCorrelations([], [sleep], dateRange)).toEqual([])
  })
})
