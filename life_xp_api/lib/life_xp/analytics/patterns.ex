defmodule LifeXP.Analytics.Patterns do
  @moduledoc """
  Advanced pattern recognition and recommendation generation.
  """

  @doc """
  Detects behavioral patterns in user data.
  """
  def detect_patterns(entries) do
    patterns = []
    
    patterns = patterns ++ detect_streak_patterns(entries)
    patterns = patterns ++ detect_threshold_patterns(entries)
    patterns = patterns ++ detect_habit_patterns(entries)
    patterns = patterns ++ detect_anomaly_patterns(entries)
    
    patterns
  end

  @doc """
  Generates actionable recommendations based on correlations and trends.
  """
  def generate_recommendations(correlations, trends) do
    recommendations = []
    
    recommendations = recommendations ++ correlation_recommendations(correlations)
    recommendations = recommendations ++ trend_recommendations(trends)
    recommendations = recommendations ++ optimization_recommendations(correlations, trends)
    
    Enum.take(recommendations, 10) # Limit to top 10 recommendations
  end

  # Private functions - Pattern Detection

  defp detect_streak_patterns(entries) do
    # Group entries by metric and detect consecutive streaks
    entries
    |> Enum.group_by(& &1.metric_id)
    |> Enum.flat_map(fn {metric_id, metric_entries} ->
      detect_metric_streaks(metric_id, metric_entries)
    end)
  end

  defp detect_metric_streaks(metric_id, entries) do
    sorted_entries = Enum.sort_by(entries, & &1.date)
    
    streaks = find_consecutive_streaks(sorted_entries)
    
    streaks
    |> Enum.filter(fn streak -> length(streak) >= 3 end)
    |> Enum.map(fn streak ->
      %{
        type: :streak,
        metric_id: metric_id,
        length: length(streak),
        start_date: List.first(streak).date,
        end_date: List.last(streak).date,
        pattern: determine_streak_pattern(streak)
      }
    end)
  end

  defp find_consecutive_streaks(entries) do
    entries
    |> Enum.chunk_while(
      [],
      fn entry, acc ->
        if consecutive_date?(entry, List.last(acc)) do
          {:cont, acc ++ [entry]}
        else
          if acc == [] do
            {:cont, [entry]}
          else
            {:cont, acc, [entry]}
          end
        end
      end,
      fn acc -> {:cont, acc, []} end
    )
    |> Enum.filter(fn streak -> length(streak) > 1 end)
  end

  defp consecutive_date?(_entry, nil), do: true
  defp consecutive_date?(entry, previous_entry) do
    Date.diff(entry.date, previous_entry.date) <= 2
  end

  defp determine_streak_pattern(streak) do
    values = Enum.map(streak, fn entry ->
      extract_numeric_value(entry.value)
    end) |> Enum.reject(&is_nil/1)
    
    if length(values) >= 2 do
      first = List.first(values)
      last = List.last(values)
      
      cond do
        last > first * 1.1 -> :improving
        last < first * 0.9 -> :declining
        true -> :stable
      end
    else
      :unknown
    end
  end

  defp detect_threshold_patterns(entries) do
    # Detect when metrics cross certain thresholds
    entries
    |> Enum.group_by(& &1.metric_id)
    |> Enum.flat_map(fn {metric_id, metric_entries} ->
      detect_threshold_crossings(metric_id, metric_entries)
    end)
  end

  defp detect_threshold_crossings(metric_id, entries) do
    numeric_entries = entries
    |> Enum.map(fn entry ->
      value = extract_numeric_value(entry.value)
      if value, do: %{entry | numeric_value: value}, else: nil
    end)
    |> Enum.reject(&is_nil/1)
    |> Enum.sort_by(& &1.date)
    
    if length(numeric_entries) > 5 do
      values = Enum.map(numeric_entries, & &1.numeric_value)
      mean = Enum.sum(values) / length(values)
      std_dev = calculate_standard_deviation(values, mean)
      
      upper_threshold = mean + std_dev
      lower_threshold = mean - std_dev
      
      find_threshold_crossings(metric_id, numeric_entries, upper_threshold, lower_threshold)
    else
      []
    end
  end

  defp find_threshold_crossings(metric_id, entries, upper, lower) do
    entries
    |> Enum.chunk_every(2, 1, :discard)
    |> Enum.flat_map(fn [prev, curr] ->
      crossings = []
      
      # Check upper threshold crossing
      if prev.numeric_value <= upper and curr.numeric_value > upper do
        crossings = [%{
          type: :threshold_crossing,
          metric_id: metric_id,
          direction: :upward,
          threshold: upper,
          date: curr.date,
          value: curr.numeric_value
        } | crossings]
      end
      
      # Check lower threshold crossing
      if prev.numeric_value >= lower and curr.numeric_value < lower do
        crossings = [%{
          type: :threshold_crossing,
          metric_id: metric_id,
          direction: :downward,
          threshold: lower,
          date: curr.date,
          value: curr.numeric_value
        } | crossings]
      end
      
      crossings
    end)
  end

  defp detect_habit_patterns(entries) do
    # Detect regular habits (daily, weekly patterns)
    entries
    |> Enum.group_by(fn entry ->
      {entry.metric_id, Date.day_of_week(entry.date)}
    end)
    |> Enum.flat_map(fn {{metric_id, day_of_week}, day_entries} ->
      if length(day_entries) >= 3 do
        [%{
          type: :habit,
          metric_id: metric_id,
          pattern: :weekly,
          day_of_week: day_of_week,
          frequency: length(day_entries),
          consistency: calculate_consistency(day_entries)
        }]
      else
        []
      end
    end)
    |> Enum.filter(fn habit -> habit.consistency > 0.7 end)
  end

  defp detect_anomaly_patterns(entries) do
    # Detect unusual values or patterns
    entries
    |> Enum.group_by(& &1.metric_id)
    |> Enum.flat_map(fn {metric_id, metric_entries} ->
      detect_anomalies(metric_id, metric_entries)
    end)
  end

  defp detect_anomalies(metric_id, entries) do
    numeric_entries = entries
    |> Enum.map(fn entry ->
      value = extract_numeric_value(entry.value)
      if value, do: {entry.date, value}, else: nil
    end)
    |> Enum.reject(&is_nil/1)
    
    if length(numeric_entries) >= 5 do
      values = Enum.map(numeric_entries, fn {_date, value} -> value end)
      mean = Enum.sum(values) / length(values)
      std_dev = calculate_standard_deviation(values, mean)
      
      numeric_entries
      |> Enum.filter(fn {_date, value} ->
        abs(value - mean) > 2 * std_dev
      end)
      |> Enum.map(fn {date, value} ->
        %{
          type: :anomaly,
          metric_id: metric_id,
          date: date,
          value: value,
          deviation: abs(value - mean) / std_dev
        }
      end)
    else
      []
    end
  end

  # Private functions - Recommendation Generation

  defp correlation_recommendations(correlations) do
    correlations
    |> Enum.filter(fn corr -> abs(corr.correlation) > 0.5 end)
    |> Enum.map(fn corr ->
      if corr.correlation > 0 do
        %{
          type: :correlation,
          priority: :high,
          message: "Improving #{corr.metric_a} may positively impact #{corr.metric_b}",
          correlation: corr.correlation,
          metrics: [corr.metric_a, corr.metric_b]
        }
      else
        %{
          type: :correlation,
          priority: :medium,
          message: "#{corr.metric_a} and #{corr.metric_b} show negative correlation - balance is important",
          correlation: corr.correlation,
          metrics: [corr.metric_a, corr.metric_b]
        }
      end
    end)
  end

  defp trend_recommendations(trends) do
    trends
    |> Enum.filter(fn trend -> trend.significant end)
    |> Enum.map(fn trend ->
      case trend.trend do
        :increasing ->
          %{
            type: :trend,
            priority: :medium,
            message: "Great progress on this metric! Keep up the positive trend",
            metric_id: trend.metric_id,
            trend: :positive
          }
        
        :decreasing ->
          %{
            type: :trend,
            priority: :high,
            message: "This metric is declining - consider focusing attention here",
            metric_id: trend.metric_id,
            trend: :negative
          }
        
        :stable ->
          %{
            type: :trend,
            priority: :low,
            message: "This metric is stable - maintain current approach",
            metric_id: trend.metric_id,
            trend: :stable
          }
        
        _ -> nil
      end
    end)
    |> Enum.reject(&is_nil/1)
  end

  defp optimization_recommendations(correlations, trends) do
    # Generate optimization recommendations based on combined analysis
    positive_trends = Enum.filter(trends, fn t -> t.trend == :increasing and t.significant end)
    negative_trends = Enum.filter(trends, fn t -> t.trend == :decreasing and t.significant end)
    
    recommendations = []
    
    # Recommend leveraging positive correlations
    recommendations = recommendations ++ leverage_positive_correlations(correlations, positive_trends)
    
    # Recommend addressing negative trends
    recommendations = recommendations ++ address_negative_trends(negative_trends, correlations)
    
    recommendations
  end

  defp leverage_positive_correlations(correlations, positive_trends) do
    positive_trend_metrics = Enum.map(positive_trends, & &1.metric_id)
    
    correlations
    |> Enum.filter(fn corr -> 
      corr.correlation > 0.4 and 
      (corr.metric_a in positive_trend_metrics or corr.metric_b in positive_trend_metrics)
    end)
    |> Enum.map(fn corr ->
      %{
        type: :optimization,
        priority: :high,
        message: "Your progress in one area is likely benefiting another - maximize this positive momentum",
        correlation: corr.correlation,
        metrics: [corr.metric_a, corr.metric_b]
      }
    end)
  end

  defp address_negative_trends(negative_trends, correlations) do
    negative_trend_metrics = Enum.map(negative_trends, & &1.metric_id)
    
    correlations
    |> Enum.filter(fn corr ->
      corr.correlation > 0.4 and
      (corr.metric_a in negative_trend_metrics or corr.metric_b in negative_trend_metrics)
    end)
    |> Enum.map(fn corr ->
      %{
        type: :optimization,
        priority: :high,
        message: "Improving the correlated metric might help address the declining trend",
        correlation: corr.correlation,
        metrics: [corr.metric_a, corr.metric_b]
      }
    end)
  end

  # Utility functions

  defp extract_numeric_value(%{"value" => value}) when is_number(value), do: value
  defp extract_numeric_value(%{"rating" => rating}) when is_number(rating), do: rating
  defp extract_numeric_value(%{"duration" => duration}) when is_number(duration), do: duration
  defp extract_numeric_value(%{"binary" => true}), do: 1
  defp extract_numeric_value(%{"binary" => false}), do: 0
  defp extract_numeric_value(_), do: nil

  defp calculate_standard_deviation(values, mean) do
    variance = values
    |> Enum.map(fn x -> :math.pow(x - mean, 2) end)
    |> Enum.sum()
    |> Kernel./(length(values))
    
    :math.sqrt(variance)
  end

  defp calculate_consistency(entries) do
    if length(entries) <= 1 do
      1.0
    else
      # Simple consistency measure based on regularity
      date_diffs = entries
      |> Enum.sort_by(& &1.date)
      |> Enum.chunk_every(2, 1, :discard)
      |> Enum.map(fn [prev, curr] -> Date.diff(curr.date, prev.date) end)
      
      if length(date_diffs) > 0 do
        mean_diff = Enum.sum(date_diffs) / length(date_diffs)
        variance = Enum.sum(Enum.map(date_diffs, fn diff -> 
          :math.pow(diff - mean_diff, 2) 
        end)) / length(date_diffs)
        
        # Lower variance = higher consistency
        max(0.0, 1.0 - variance / 100.0)
      else
        1.0
      end
    end
  end
end