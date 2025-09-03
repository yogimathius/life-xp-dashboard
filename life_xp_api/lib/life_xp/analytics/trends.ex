defmodule LifeXP.Analytics.Trends do
  @moduledoc """
  Time series trend analysis for life metrics.
  """

  @doc """
  Calculates linear trend using least squares regression.
  """
  def calculate_trend(time_series) when length(time_series) < 3 do
    %{
      slope: 0.0,
      intercept: 0.0,
      r_squared: 0.0,
      trend: :insufficient_data
    }
  end

  def calculate_trend(time_series) do
    # Convert dates to numeric values (days since first date)
    first_date = List.first(time_series).date
    
    numeric_series = Enum.map(time_series, fn point ->
      days_since_start = Date.diff(point.date, first_date)
      %{x: days_since_start, y: point.value}
    end)
    
    {slope, intercept} = linear_regression(numeric_series)
    r_squared = calculate_r_squared(numeric_series, slope, intercept)
    
    %{
      slope: slope,
      intercept: intercept,
      r_squared: r_squared,
      trend: classify_trend(slope, r_squared),
      period_days: Date.diff(List.last(time_series).date, first_date),
      data_points: length(time_series)
    }
  end

  @doc """
  Assesses statistical significance of trend.
  """
  def assess_significance(%{slope: slope, r_squared: r_squared, data_points: n} = trend) do
    if n < 3 do
      Map.put(trend, :significant, false)
    else
      # Calculate t-statistic for slope
      standard_error = calculate_slope_standard_error(r_squared, n)
      t_stat = abs(slope / standard_error)
      
      # Simple significance test
      significant = t_stat > 2.0 and r_squared > 0.3
      
      trend
      |> Map.put(:significant, significant)
      |> Map.put(:t_statistic, t_stat)
      |> Map.put(:standard_error, standard_error)
    end
  end

  @doc """
  Detects trend patterns like seasonality or cycles.
  """
  def detect_patterns(time_series) when length(time_series) < 7 do
    %{patterns: []}
  end

  def detect_patterns(time_series) do
    patterns = []
    
    patterns = patterns ++ detect_weekly_pattern(time_series)
    patterns = patterns ++ detect_monthly_pattern(time_series)
    patterns = patterns ++ detect_seasonal_pattern(time_series)
    
    %{patterns: patterns}
  end

  @doc """
  Forecasts future values based on trend.
  """
  def forecast(trend, days_ahead) do
    if trend.significant do
      predicted_value = trend.intercept + (trend.slope * (trend.period_days + days_ahead))
      
      %{
        predicted_value: predicted_value,
        confidence: trend.r_squared,
        days_ahead: days_ahead,
        reliable: trend.r_squared > 0.5
      }
    else
      %{
        predicted_value: nil,
        confidence: 0.0,
        days_ahead: days_ahead,
        reliable: false
      }
    end
  end

  # Private functions

  defp linear_regression(points) do
    n = length(points)
    
    sum_x = Enum.sum(Enum.map(points, & &1.x))
    sum_y = Enum.sum(Enum.map(points, & &1.y))
    sum_xy = Enum.sum(Enum.map(points, fn p -> p.x * p.y end))
    sum_x_squared = Enum.sum(Enum.map(points, fn p -> p.x * p.x end))
    
    denominator = n * sum_x_squared - sum_x * sum_x
    
    if denominator == 0 do
      {0.0, sum_y / n}
    else
      slope = (n * sum_xy - sum_x * sum_y) / denominator
      intercept = (sum_y - slope * sum_x) / n
      {slope, intercept}
    end
  end

  defp calculate_r_squared(points, slope, intercept) do
    mean_y = Enum.sum(Enum.map(points, & &1.y)) / length(points)
    
    ss_tot = points
    |> Enum.map(fn p -> :math.pow(p.y - mean_y, 2) end)
    |> Enum.sum()
    
    ss_res = points
    |> Enum.map(fn p -> 
      predicted = slope * p.x + intercept
      :math.pow(p.y - predicted, 2)
    end)
    |> Enum.sum()
    
    if ss_tot == 0 do
      0.0
    else
      1 - (ss_res / ss_tot)
    end
  end

  defp classify_trend(slope, r_squared) do
    cond do
      r_squared < 0.1 -> :no_trend
      slope > 0.1 -> :increasing
      slope < -0.1 -> :decreasing
      true -> :stable
    end
  end

  defp calculate_slope_standard_error(r_squared, n) do
    if r_squared >= 1.0 or n <= 2 do
      1.0
    else
      :math.sqrt((1 - r_squared) / (n - 2))
    end
  end

  defp detect_weekly_pattern(time_series) do
    # Group by day of week and check for patterns
    weekly_groups = Enum.group_by(time_series, fn point ->
      Date.day_of_week(point.date)
    end)
    
    if map_size(weekly_groups) >= 3 do
      weekly_averages = Enum.map(weekly_groups, fn {day, points} ->
        avg = Enum.sum(Enum.map(points, & &1.value)) / length(points)
        {day, avg}
      end)
      
      variance = calculate_weekly_variance(weekly_averages)
      
      if variance > 0.5 do
        [%{type: :weekly, variance: variance, pattern: weekly_averages}]
      else
        []
      end
    else
      []
    end
  end

  defp detect_monthly_pattern(_time_series) do
    # Simplified monthly pattern detection
    # In production, implement proper monthly grouping
    []
  end

  defp detect_seasonal_pattern(_time_series) do
    # Simplified seasonal pattern detection
    # In production, implement proper seasonal analysis
    []
  end

  defp calculate_weekly_variance(weekly_averages) do
    values = Enum.map(weekly_averages, fn {_day, avg} -> avg end)
    mean = Enum.sum(values) / length(values)
    
    variance = values
    |> Enum.map(fn v -> :math.pow(v - mean, 2) end)
    |> Enum.sum()
    |> Kernel./(length(values))
    
    :math.sqrt(variance)
  end
end