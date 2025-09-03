defmodule LifeXP.Analytics.Engine do
  @moduledoc """
  Real-time analytics engine for calculating correlations, trends, and insights.
  """

  use GenServer
  
  alias LifeXP.Data
  alias LifeXP.Metrics
  alias LifeXP.Analytics.Correlations
  alias LifeXP.Analytics.Trends
  alias LifeXP.Analytics.Patterns
  
  @doc """
  Calculates correlations between all user metrics for a date range.
  """
  def calculate_correlations(user_id, date_range \\ default_date_range()) do
    entries = Data.get_entries_for_analytics(user_id, date_range)
    
    entries
    |> group_by_metric()
    |> calculate_pearson_correlations()
    |> filter_significant_correlations()
  end
  
  @doc """
  Detects trends for a specific metric over time.
  """
  def detect_trends(user_id, metric_id, date_range \\ default_date_range()) do
    entries = Data.get_entries_by_metric(user_id, metric_id, date_range)
    
    entries
    |> extract_time_series()
    |> Trends.calculate_trend()
    |> Trends.assess_significance()
  end
  
  @doc """
  Generates comprehensive insights for a user.
  """
  def generate_insights(user_id, date_range \\ default_date_range()) do
    [
      Task.async(fn -> calculate_correlations(user_id, date_range) end),
      Task.async(fn -> detect_all_trends(user_id, date_range) end),
      Task.async(fn -> identify_patterns(user_id, date_range) end),
      Task.async(fn -> generate_recommendations(user_id, date_range) end)
    ]
    |> Task.await_many(30_000)
    |> combine_insights()
  end
  
  @doc """
  Refreshes insights for a user (called after data changes).
  """
  def refresh_insights(user_id) do
    insights = generate_insights(user_id)
    store_insights(user_id, insights)
    broadcast_insights_update(user_id, insights)
  end

  # Private functions
  
  defp default_date_range() do
    end_date = Date.utc_today()
    start_date = Date.add(end_date, -30) # Last 30 days
    %{start_date: start_date, end_date: end_date}
  end
  
  defp group_by_metric(entries) do
    Enum.group_by(entries, & &1.metric_id, fn entry ->
      extract_numeric_value(entry.value)
    end)
  end
  
  defp extract_numeric_value(%{"value" => value}) when is_number(value), do: value
  defp extract_numeric_value(%{"rating" => rating}) when is_number(rating), do: rating
  defp extract_numeric_value(%{"duration" => duration}) when is_number(duration), do: duration
  defp extract_numeric_value(%{"binary" => true}), do: 1
  defp extract_numeric_value(%{"binary" => false}), do: 0
  defp extract_numeric_value(_), do: nil
  
  defp calculate_pearson_correlations(metric_groups) do
    metric_pairs = get_metric_pairs(Map.keys(metric_groups))
    
    Enum.map(metric_pairs, fn {metric_a, metric_b} ->
      values_a = metric_groups[metric_a] |> Enum.reject(&is_nil/1)
      values_b = metric_groups[metric_b] |> Enum.reject(&is_nil/1)
      
      if length(values_a) >= 3 and length(values_b) >= 3 do
        correlation = Correlations.pearson_correlation(values_a, values_b)
        %{
          metric_a: metric_a,
          metric_b: metric_b,
          correlation: correlation,
          sample_size: min(length(values_a), length(values_b))
        }
      else
        nil
      end
    end)
    |> Enum.reject(&is_nil/1)
  end
  
  defp get_metric_pairs(metric_ids) do
    for a <- metric_ids,
        b <- metric_ids,
        a < b,
        do: {a, b}
  end
  
  defp filter_significant_correlations(correlations) do
    Enum.filter(correlations, fn correlation ->
      abs(correlation.correlation) >= 0.3 and correlation.sample_size >= 5
    end)
  end
  
  defp extract_time_series(entries) do
    entries
    |> Enum.map(fn entry ->
      %{
        date: entry.date,
        value: extract_numeric_value(entry.value)
      }
    end)
    |> Enum.reject(fn point -> is_nil(point.value) end)
  end
  
  defp detect_all_trends(user_id, date_range) do
    metrics = Metrics.list_metrics(user_id)
    
    Enum.map(metrics, fn metric ->
      trend = detect_trends(user_id, metric.id, date_range)
      Map.put(trend, :metric_id, metric.id)
    end)
  end
  
  defp identify_patterns(user_id, date_range) do
    entries = Data.get_entries_for_analytics(user_id, date_range)
    Patterns.detect_patterns(entries)
  end
  
  defp generate_recommendations(user_id, date_range) do
    correlations = calculate_correlations(user_id, date_range)
    trends = detect_all_trends(user_id, date_range)
    
    Patterns.generate_recommendations(correlations, trends)
  end
  
  defp combine_insights([correlations, trends, patterns, recommendations]) do
    %{
      correlations: correlations,
      trends: trends,
      patterns: patterns,
      recommendations: recommendations,
      generated_at: DateTime.utc_now()
    }
  end
  
  defp store_insights(user_id, insights) do
    # Store insights in the database
    LifeXP.Analytics.store_insight(user_id, "combined", insights, 0.8)
  end
  
  defp broadcast_insights_update(user_id, insights) do
    LifeXPWeb.Endpoint.broadcast("user:#{user_id}", "insights_updated", insights)
  end
end