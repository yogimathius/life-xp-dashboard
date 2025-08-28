import React, { useMemo } from 'react';
import { useMetrics } from '../hooks/useMetrics';
import { useEntries } from '../hooks/useEntries';
import { calculateGamificationStats, Achievement, UserLevel, StreakInfo } from '../utils/gamification';

interface GamificationDashboardProps {
  className?: string;
}

const GamificationDashboard: React.FC<GamificationDashboardProps> = ({ className = '' }) => {
  const { metrics } = useMetrics();
  const { entries } = useEntries();
  
  const gamificationStats = useMemo(() => 
    calculateGamificationStats(entries, metrics),
    [entries, metrics]
  );

  const { level, achievements, streaks, totalPoints, rank } = gamificationStats;
  
  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const inProgressAchievements = achievements
    .filter(a => !a.isUnlocked && (a.progress || 0) > 0)
    .slice(0, 3);

  // Get overall streak (longest current streak across all metrics)
  const overallStreak = Math.max(...Array.from(streaks.values()).map(s => s.current), 0);
  const longestStreak = Math.max(...Array.from(streaks.values()).map(s => s.longest), 0);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelProgress = (level: UserLevel) => {
    const totalXPForLevel = level.currentXP + level.xpToNextLevel;
    return totalXPForLevel > 0 ? (level.currentXP / totalXPForLevel) * 100 : 0;
  };

  const formatMetricName = (metricId: string) => {
    const metric = metrics.find(m => m.id === metricId);
    return metric ? `${metric.icon} ${metric.name}` : metricId;
  };

  if (entries.length === 0) {
    return (
      <div className={`gamification-dashboard ${className}`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <span className="text-4xl mb-4 block">🎮</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Journey</h3>
          <p className="text-gray-600">Track your first metric to begin earning XP and unlocking achievements!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`gamification-dashboard ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Level {level.level}</h2>
              <p className="text-purple-100">{level.title}</p>
              <p className="text-purple-200 text-sm mt-1">Rank: {rank}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{level.totalXP}</div>
              <div className="text-purple-200 text-sm">Total XP</div>
            </div>
          </div>
          
          {/* XP Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>{level.currentXP} XP</span>
              <span>{level.xpToNextLevel} XP to next level</span>
            </div>
            <div className="w-full bg-purple-700 bg-opacity-50 rounded-full h-3">
              <div 
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${getLevelProgress(level)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Your Stats</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Streak</span>
                  <span className="font-semibold text-orange-600">
                    🔥 {overallStreak} days
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Longest Streak</span>
                  <span className="font-semibold text-green-600">
                    ⭐ {longestStreak} days
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Entries</span>
                  <span className="font-semibold text-blue-600">
                    📊 {entries.length}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Achievements</span>
                  <span className="font-semibold text-purple-600">
                    🏅 {unlockedAchievements.length}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Points</span>
                  <span className="font-semibold text-yellow-600">
                    ⭐ {totalPoints}
                  </span>
                </div>
              </div>

              {/* Metric Streaks */}
              {streaks.size > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Metric Streaks</h4>
                  <div className="space-y-2">
                    {Array.from(streaks.entries())
                      .filter(([_, streak]) => streak.current > 0)
                      .sort(([_, a], [__, b]) => b.current - a.current)
                      .slice(0, 5)
                      .map(([metricId, streak]) => (
                        <div key={metricId} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 truncate">
                            {formatMetricName(metricId)}
                          </span>
                          <span className={`font-medium ${
                            streak.isActive ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {streak.current} days
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏅 Achievements</h3>
              
              {/* Recently Unlocked */}
              {unlockedAchievements.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Unlocked ({unlockedAchievements.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {unlockedAchievements.slice(0, 6).map(achievement => (
                      <div
                        key={achievement.id}
                        className="p-3 rounded-lg border-2 border-green-200 bg-green-50"
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{achievement.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h5 className="font-medium text-gray-900 truncate">
                                {achievement.name}
                              </h5>
                              <span className={`px-2 py-1 text-xs rounded-full ${getRarityColor(achievement.rarity)}`}>
                                {achievement.rarity}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {achievement.description}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-green-600 font-medium">
                                +{achievement.points} XP
                              </span>
                              {achievement.unlockedAt && (
                                <span className="text-xs text-gray-500">
                                  {achievement.unlockedAt.toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {unlockedAchievements.length > 6 && (
                    <p className="text-sm text-gray-500 text-center mt-3">
                      +{unlockedAchievements.length - 6} more achievements unlocked
                    </p>
                  )}
                </div>
              )}

              {/* In Progress */}
              {inProgressAchievements.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    In Progress
                  </h4>
                  <div className="space-y-3">
                    {inProgressAchievements.map(achievement => (
                      <div
                        key={achievement.id}
                        className="p-3 rounded-lg border border-gray-200 bg-gray-50"
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl opacity-60">{achievement.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h5 className="font-medium text-gray-700 truncate">
                                {achievement.name}
                              </h5>
                              <span className={`px-2 py-1 text-xs rounded-full ${getRarityColor(achievement.rarity)} opacity-75`}>
                                {achievement.rarity}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {achievement.description}
                            </p>
                            
                            {/* Progress Bar */}
                            {achievement.maxProgress && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600">
                                    {achievement.progress || 0} / {achievement.maxProgress}
                                  </span>
                                  <span className="text-gray-500">
                                    +{achievement.points} XP
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 rounded-full h-2 transition-all duration-500"
                                    style={{
                                      width: `${((achievement.progress || 0) / achievement.maxProgress) * 100}%`
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No achievements yet */}
              {unlockedAchievements.length === 0 && inProgressAchievements.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-4 block">🏆</span>
                  <p>Start tracking to unlock your first achievements!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">💪</span>
            <div>
              <h4 className="font-medium text-gray-900">Keep Going!</h4>
              <p className="text-sm text-gray-600">
                {overallStreak > 0
                  ? `You're on a ${overallStreak}-day streak. Don't break it now!`
                  : "Start tracking today to begin your journey to optimization!"
                }
                {' '}
                {level.xpToNextLevel <= 100 && level.xpToNextLevel > 0 && 
                  `Just ${level.xpToNextLevel} more XP to reach Level ${level.level + 1}!`
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationDashboard;