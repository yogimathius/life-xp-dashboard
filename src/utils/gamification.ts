// Gamification system for Life XP Dashboard
import { MetricEntry, MetricDefinition } from '../types';
import { format, differenceInDays, startOfDay, isToday, isYesterday, subDays } from 'date-fns';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'milestone' | 'consistency' | 'improvement' | 'special';
  points: number;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  isUnlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserLevel {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  title: string;
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastEntryDate?: Date;
  isActive: boolean;
}

export interface GamificationStats {
  level: UserLevel;
  achievements: Achievement[];
  streaks: Map<string, StreakInfo>;
  totalPoints: number;
  rank: string;
}

// XP values for different actions
export const XP_VALUES = {
  DAILY_ENTRY: 10,
  COMPLETE_ALL_METRICS: 25,
  WEEKLY_CONSISTENCY: 50,
  MONTHLY_MILESTONE: 100,
  STREAK_BONUS_PER_DAY: 5,
  ACHIEVEMENT_BONUS: (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 50;
      case 'rare': return 100;
      case 'epic': return 250;
      case 'legendary': return 500;
      default: return 50;
    }
  }
};

// Level thresholds and titles
const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: 'Life Explorer' },
  { level: 2, xp: 100, title: 'Data Tracker' },
  { level: 3, xp: 250, title: 'Habit Builder' },
  { level: 4, xp: 500, title: 'Progress Pioneer' },
  { level: 5, xp: 1000, title: 'Consistency Champion' },
  { level: 6, xp: 2000, title: 'Optimization Expert' },
  { level: 7, xp: 3500, title: 'Life Hacker' },
  { level: 8, xp: 5500, title: 'Wellness Warrior' },
  { level: 9, xp: 8000, title: 'Self-Mastery Sage' },
  { level: 10, xp: 12000, title: 'Life XP Master' },
];

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt' | 'progress' | 'isUnlocked'>[] = [
  // Streak achievements
  {
    id: 'first-entry',
    name: 'First Steps',
    description: 'Log your first metric entry',
    icon: '🎯',
    category: 'milestone',
    points: 10,
    rarity: 'common',
    maxProgress: 1,
  },
  {
    id: 'streak-3',
    name: 'Getting Started',
    description: 'Track metrics for 3 consecutive days',
    icon: '🔥',
    category: 'streak',
    points: 50,
    rarity: 'common',
    maxProgress: 3,
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Track metrics for 7 consecutive days',
    icon: '⭐',
    category: 'streak',
    points: 100,
    rarity: 'rare',
    maxProgress: 7,
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Track metrics for 30 consecutive days',
    icon: '🏆',
    category: 'streak',
    points: 300,
    rarity: 'epic',
    maxProgress: 30,
  },
  {
    id: 'streak-100',
    name: 'Century Club',
    description: 'Track metrics for 100 consecutive days',
    icon: '💎',
    category: 'streak',
    points: 1000,
    rarity: 'legendary',
    maxProgress: 100,
  },
  
  // Consistency achievements
  {
    id: 'perfect-week',
    name: 'Perfect Week',
    description: 'Log all metrics every day for a week',
    icon: '✨',
    category: 'consistency',
    points: 150,
    rarity: 'rare',
    maxProgress: 7,
  },
  {
    id: 'all-metrics-day',
    name: 'Complete Day',
    description: 'Log entries for all your tracked metrics in one day',
    icon: '📊',
    category: 'consistency',
    points: 25,
    rarity: 'common',
    maxProgress: 1,
  },
  
  // Milestone achievements
  {
    id: 'entries-50',
    name: 'Data Collector',
    description: 'Log 50 total metric entries',
    icon: '📈',
    category: 'milestone',
    points: 100,
    rarity: 'common',
    maxProgress: 50,
  },
  {
    id: 'entries-250',
    name: 'Tracking Titan',
    description: 'Log 250 total metric entries',
    icon: '🚀',
    category: 'milestone',
    points: 250,
    rarity: 'rare',
    maxProgress: 250,
  },
  {
    id: 'entries-1000',
    name: 'Data Master',
    description: 'Log 1000 total metric entries',
    icon: '👑',
    category: 'milestone',
    points: 500,
    rarity: 'epic',
    maxProgress: 1000,
  },
  
  // Improvement achievements
  {
    id: 'improvement-trend',
    name: 'Upward Trajectory',
    description: 'Show improvement in any metric over 14 days',
    icon: '📈',
    category: 'improvement',
    points: 200,
    rarity: 'rare',
    maxProgress: 1,
  },
  
  // Special achievements
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Log entries before 8 AM for 5 consecutive days',
    icon: '🌅',
    category: 'special',
    points: 150,
    rarity: 'rare',
    maxProgress: 5,
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Log entries after 10 PM for 5 consecutive days',
    icon: '🌙',
    category: 'special',
    points: 150,
    rarity: 'rare',
    maxProgress: 5,
  },
];

// Calculate user level based on total XP
export const calculateLevel = (totalXP: number): UserLevel => {
  let currentLevel = LEVEL_THRESHOLDS[0];
  let nextLevel = LEVEL_THRESHOLDS[1];
  
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i].xp && totalXP < LEVEL_THRESHOLDS[i + 1].xp) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevel = LEVEL_THRESHOLDS[i + 1];
      break;
    } else if (totalXP >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].xp) {
      currentLevel = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
      nextLevel = { ...currentLevel, xp: currentLevel.xp + 2000 }; // Beyond max level
    }
  }
  
  return {
    level: currentLevel.level,
    currentXP: totalXP - currentLevel.xp,
    xpToNextLevel: nextLevel.xp - totalXP,
    totalXP,
    title: currentLevel.title,
  };
};

// Calculate streaks for each metric
export const calculateStreaks = (entries: MetricEntry[]): Map<string, StreakInfo> => {
  const streaks = new Map<string, StreakInfo>();
  
  // Group entries by metric
  const metricEntries = new Map<string, MetricEntry[]>();
  entries.forEach(entry => {
    if (!metricEntries.has(entry.metricId)) {
      metricEntries.set(entry.metricId, []);
    }
    metricEntries.get(entry.metricId)!.push(entry);
  });
  
  // Calculate streaks for each metric
  metricEntries.forEach((metricEntryList, metricId) => {
    const sortedEntries = metricEntryList
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let lastEntryDate: Date | undefined;
    
    if (sortedEntries.length > 0) {
      lastEntryDate = sortedEntries[0].date;
      
      // Check if streak is still active (entry today or yesterday)
      const isActive = isToday(lastEntryDate) || isYesterday(lastEntryDate);
      
      // Calculate current streak
      let checkDate = startOfDay(new Date());
      if (!isToday(lastEntryDate) && isYesterday(lastEntryDate)) {
        checkDate = subDays(checkDate, 1);
      } else if (!isToday(lastEntryDate)) {
        // No recent entries, streak is broken
        streaks.set(metricId, {
          current: 0,
          longest: calculateLongestStreak(sortedEntries),
          lastEntryDate,
          isActive: false,
        });
        return;
      }
      
      // Count consecutive days backwards
      const entriesByDate = new Map<string, MetricEntry>();
      sortedEntries.forEach(entry => {
        const dateKey = format(entry.date, 'yyyy-MM-dd');
        if (!entriesByDate.has(dateKey)) {
          entriesByDate.set(dateKey, entry);
        }
      });
      
      while (entriesByDate.has(format(checkDate, 'yyyy-MM-dd'))) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      }
      
      longestStreak = Math.max(currentStreak, calculateLongestStreak(sortedEntries));
      
      streaks.set(metricId, {
        current: currentStreak,
        longest: longestStreak,
        lastEntryDate,
        isActive,
      });
    } else {
      streaks.set(metricId, {
        current: 0,
        longest: 0,
        isActive: false,
      });
    }
  });
  
  return streaks;
};

// Helper function to calculate longest streak
const calculateLongestStreak = (sortedEntries: MetricEntry[]): number => {
  if (sortedEntries.length === 0) return 0;
  
  const entriesByDate = new Map<string, MetricEntry>();
  sortedEntries.forEach(entry => {
    const dateKey = format(entry.date, 'yyyy-MM-dd');
    if (!entriesByDate.has(dateKey)) {
      entriesByDate.set(dateKey, entry);
    }
  });
  
  const sortedDates = Array.from(entriesByDate.keys()).sort().reverse();
  
  let longestStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const previousDate = new Date(sortedDates[i - 1]);
    const daysDiff = differenceInDays(previousDate, currentDate);
    
    if (daysDiff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  return longestStreak;
};

// Calculate XP based on entries
export const calculateTotalXP = (entries: MetricEntry[], achievements: Achievement[]): number => {
  let totalXP = 0;
  
  // Base XP from entries
  const entriesByDate = new Map<string, MetricEntry[]>();
  entries.forEach(entry => {
    const dateKey = format(entry.date, 'yyyy-MM-dd');
    if (!entriesByDate.has(dateKey)) {
      entriesByDate.set(dateKey, []);
    }
    entriesByDate.get(dateKey)!.push(entry);
  });
  
  // XP for daily entries
  entriesByDate.forEach((dayEntries, dateKey) => {
    totalXP += XP_VALUES.DAILY_ENTRY * Math.min(dayEntries.length, 5); // Cap at 5 entries per day for XP
    
    // Bonus for completing multiple metrics in one day
    if (dayEntries.length >= 3) {
      totalXP += XP_VALUES.COMPLETE_ALL_METRICS;
    }
  });
  
  // XP from achievements
  achievements.forEach(achievement => {
    if (achievement.isUnlocked) {
      totalXP += achievement.points;
    }
  });
  
  return totalXP;
};

// Check and update achievements
export const updateAchievements = (
  entries: MetricEntry[],
  metrics: MetricDefinition[],
  streaks: Map<string, StreakInfo>
): Achievement[] => {
  const achievements: Achievement[] = [];
  
  ACHIEVEMENT_DEFINITIONS.forEach(achievementDef => {
    const achievement: Achievement = {
      ...achievementDef,
      progress: 0,
      isUnlocked: false,
    };
    
    // Check achievement conditions
    switch (achievement.id) {
      case 'first-entry':
        achievement.progress = Math.min(entries.length, 1);
        achievement.isUnlocked = entries.length >= 1;
        break;
        
      case 'streak-3':
      case 'streak-7':
      case 'streak-30':
      case 'streak-100': {
        const targetDays = parseInt(achievement.id.split('-')[1]);
        const maxCurrentStreak = Math.max(...Array.from(streaks.values()).map(s => s.current));
        achievement.progress = Math.min(maxCurrentStreak, targetDays);
        achievement.isUnlocked = maxCurrentStreak >= targetDays;
        break;
      }
      
      case 'all-metrics-day': {
        // Check if there's any day with entries for all metrics
        const entriesByDate = new Map<string, Set<string>>();
        entries.forEach(entry => {
          const dateKey = format(entry.date, 'yyyy-MM-dd');
          if (!entriesByDate.has(dateKey)) {
            entriesByDate.set(dateKey, new Set());
          }
          entriesByDate.get(dateKey)!.add(entry.metricId);
        });
        
        let hasCompleteDay = false;
        entriesByDate.forEach((metricIds, dateKey) => {
          if (metricIds.size >= metrics.length && metrics.length > 0) {
            hasCompleteDay = true;
          }
        });
        
        achievement.progress = hasCompleteDay ? 1 : 0;
        achievement.isUnlocked = hasCompleteDay;
        break;
      }
      
      case 'entries-50':
      case 'entries-250':
      case 'entries-1000': {
        const targetCount = parseInt(achievement.id.split('-')[1]);
        achievement.progress = Math.min(entries.length, targetCount);
        achievement.isUnlocked = entries.length >= targetCount;
        break;
      }
      
      case 'perfect-week': {
        // Check for a perfect week (all metrics logged for 7 consecutive days)
        achievement.progress = 0; // Would need more complex logic
        achievement.isUnlocked = false; // Simplified for now
        break;
      }
      
      // Add more achievement logic as needed
      default:
        achievement.progress = 0;
        achievement.isUnlocked = false;
    }
    
    // Set unlock date if newly unlocked
    if (achievement.isUnlocked && !achievement.unlockedAt) {
      achievement.unlockedAt = new Date();
    }
    
    achievements.push(achievement);
  });
  
  return achievements.sort((a, b) => {
    if (a.isUnlocked !== b.isUnlocked) {
      return a.isUnlocked ? -1 : 1; // Unlocked first
    }
    return b.points - a.points; // Higher points first
  });
};

// Get user's rank based on level
export const getUserRank = (level: number): string => {
  if (level >= 10) return 'Legend';
  if (level >= 8) return 'Master';
  if (level >= 6) return 'Expert';
  if (level >= 4) return 'Advanced';
  if (level >= 2) return 'Intermediate';
  return 'Beginner';
};

// Calculate complete gamification stats
export const calculateGamificationStats = (
  entries: MetricEntry[],
  metrics: MetricDefinition[]
): GamificationStats => {
  const streaks = calculateStreaks(entries);
  const achievements = updateAchievements(entries, metrics, streaks);
  const totalXP = calculateTotalXP(entries, achievements);
  const level = calculateLevel(totalXP);
  const totalPoints = achievements
    .filter(a => a.isUnlocked)
    .reduce((sum, a) => sum + a.points, 0);
  const rank = getUserRank(level.level);
  
  return {
    level,
    achievements,
    streaks,
    totalPoints,
    rank,
  };
};