defmodule LifeXP.Analytics.Correlations do
  @moduledoc """
  Statistical correlation calculations for life metrics.
  """

  @doc """
  Calculates Pearson correlation coefficient between two sets of values.
  """
  def pearson_correlation(x_values, y_values) when length(x_values) != length(y_values) do
    # Align the arrays to the same length by taking the minimum
    min_length = min(length(x_values), length(y_values))
    x_aligned = Enum.take(x_values, min_length)
    y_aligned = Enum.take(y_values, min_length)
    pearson_correlation(x_aligned, y_aligned)
  end

  def pearson_correlation(x_values, _y_values) when length(x_values) < 3 do
    # Not enough data points for meaningful correlation
    0.0
  end

  def pearson_correlation(x_values, y_values) do
    n = length(x_values)
    
    mean_x = Enum.sum(x_values) / n
    mean_y = Enum.sum(y_values) / n
    
    numerator = x_values
    |> Enum.zip(y_values)
    |> Enum.map(fn {x, y} -> (x - mean_x) * (y - mean_y) end)
    |> Enum.sum()
    
    variance_x = calculate_variance(x_values, mean_x)
    variance_y = calculate_variance(y_values, mean_y)
    
    denominator = :math.sqrt(variance_x * variance_y)
    
    if denominator == 0 do
      0.0
    else
      numerator / denominator
    end
  end

  @doc """
  Calculates Spearman rank correlation coefficient.
  """
  def spearman_correlation(x_values, y_values) do
    x_ranks = calculate_ranks(x_values)
    y_ranks = calculate_ranks(y_values)
    
    pearson_correlation(x_ranks, y_ranks)
  end

  @doc """
  Tests statistical significance of correlation.
  """
  def correlation_significance(correlation, sample_size) do
    if sample_size < 3 do
      %{significant: false, p_value: 1.0}
    else
      # Calculate t-statistic
      t_stat = correlation * :math.sqrt((sample_size - 2) / (1 - correlation * correlation))
      
      # Approximate p-value calculation
      p_value = calculate_p_value(abs(t_stat), sample_size - 2)
      
      %{
        correlation: correlation,
        t_statistic: t_stat,
        p_value: p_value,
        significant: p_value < 0.05,
        sample_size: sample_size
      }
    end
  end

  @doc """
  Calculates correlation strength interpretation.
  """
  def correlation_strength(correlation) do
    abs_corr = abs(correlation)
    
    cond do
      abs_corr >= 0.7 -> :strong
      abs_corr >= 0.4 -> :moderate
      abs_corr >= 0.2 -> :weak
      true -> :negligible
    end
  end

  @doc """
  Generates correlation interpretation text.
  """
  def interpret_correlation(correlation, metric_a_name, metric_b_name) do
    strength = correlation_strength(correlation)
    direction = if correlation > 0, do: "positive", else: "negative"
    
    strength_text = case strength do
      :strong -> "strong"
      :moderate -> "moderate"
      :weak -> "weak"
      :negligible -> "negligible"
    end
    
    "#{metric_a_name} and #{metric_b_name} show a #{strength_text} #{direction} correlation (r = #{Float.round(correlation, 3)})"
  end

  # Private functions
  
  defp calculate_variance(values, mean) do
    values
    |> Enum.map(fn x -> :math.pow(x - mean, 2) end)
    |> Enum.sum()
  end
  
  defp calculate_ranks(values) do
    values
    |> Enum.with_index()
    |> Enum.sort_by(fn {value, _index} -> value end)
    |> Enum.with_index()
    |> Enum.map(fn {{_value, original_index}, rank} -> {original_index, rank + 1} end)
    |> Enum.sort_by(fn {original_index, _rank} -> original_index end)
    |> Enum.map(fn {_original_index, rank} -> rank end)
  end
  
  defp calculate_p_value(t_stat, _df) do
    # Simplified p-value calculation using approximation
    # In production, you'd use a proper statistical library
    cond do
      t_stat > 2.576 -> 0.01  # 99% confidence
      t_stat > 1.96 -> 0.05   # 95% confidence
      t_stat > 1.645 -> 0.10  # 90% confidence
      true -> 0.20
    end
  end
end