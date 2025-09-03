defmodule LifeXP.Analytics.TrendsTest do
  use ExUnit.Case, async: true
  alias LifeXP.Analytics.Trends

  describe "calculate_trend/1" do
    test "calculates increasing trend" do
      time_series = [
        %{date: ~D[2023-12-01], value: 5},
        %{date: ~D[2023-12-02], value: 6},
        %{date: ~D[2023-12-03], value: 7},
        %{date: ~D[2023-12-04], value: 8},
        %{date: ~D[2023-12-05], value: 9}
      ]
      
      trend = Trends.calculate_trend(time_series)
      
      assert trend.slope > 0
      assert trend.trend == :increasing
      assert trend.period_days == 4
      assert trend.data_points == 5
      assert is_float(trend.r_squared)
      assert is_float(trend.intercept)
    end

    test "calculates decreasing trend" do
      time_series = [
        %{date: ~D[2023-12-01], value: 10},
        %{date: ~D[2023-12-02], value: 8},
        %{date: ~D[2023-12-03], value: 6},
        %{date: ~D[2023-12-04], value: 4},
        %{date: ~D[2023-12-05], value: 2}
      ]
      
      trend = Trends.calculate_trend(time_series)
      
      assert trend.slope < 0
      assert trend.trend == :decreasing
    end

    test "calculates stable trend" do
      time_series = [
        %{date: ~D[2023-12-01], value: 5},
        %{date: ~D[2023-12-02], value: 5.1},
        %{date: ~D[2023-12-03], value: 4.9},
        %{date: ~D[2023-12-04], value: 5.05},
        %{date: ~D[2023-12-05], value: 4.95}
      ]
      
      trend = Trends.calculate_trend(time_series)
      
      assert abs(trend.slope) < 0.1
      assert trend.trend == :stable
    end

    test "handles insufficient data" do
      time_series = [
        %{date: ~D[2023-12-01], value: 5},
        %{date: ~D[2023-12-02], value: 6}
      ]
      
      trend = Trends.calculate_trend(time_series)
      
      assert trend.trend == :insufficient_data
      assert trend.slope == 0.0
      assert trend.r_squared == 0.0
    end

    test "calculates high R-squared for perfect linear trend" do
      time_series = [
        %{date: ~D[2023-12-01], value: 1},
        %{date: ~D[2023-12-02], value: 2},
        %{date: ~D[2023-12-03], value: 3},
        %{date: ~D[2023-12-04], value: 4},
        %{date: ~D[2023-12-05], value: 5}
      ]
      
      trend = Trends.calculate_trend(time_series)
      
      assert_in_delta trend.r_squared, 1.0, 0.001
    end
  end

  describe "assess_significance/1" do
    test "marks significant trends as significant" do
      trend = %{
        slope: 1.0,
        r_squared: 0.8,
        data_points: 10,
        trend: :increasing
      }
      
      result = Trends.assess_significance(trend)
      
      assert result.significant == true
      assert is_float(result.t_statistic)
      assert is_float(result.standard_error)
    end

    test "marks weak trends as non-significant" do
      trend = %{
        slope: 0.01,
        r_squared: 0.1,
        data_points: 10,
        trend: :stable
      }
      
      result = Trends.assess_significance(trend)
      
      assert result.significant == false
    end

    test "handles insufficient data points" do
      trend = %{
        slope: 1.0,
        r_squared: 0.8,
        data_points: 2,
        trend: :increasing
      }
      
      result = Trends.assess_significance(trend)
      
      assert result.significant == false
    end
  end

  describe "detect_patterns/1" do
    test "detects weekly patterns with sufficient data" do
      # Create entries across different days of the week
      time_series = [
        %{date: ~D[2023-12-04], value: 8}, # Monday
        %{date: ~D[2023-12-05], value: 7}, # Tuesday
        %{date: ~D[2023-12-06], value: 9}, # Wednesday
        %{date: ~D[2023-12-11], value: 8}, # Monday
        %{date: ~D[2023-12-12], value: 7}, # Tuesday
        %{date: ~D[2023-12-13], value: 9}, # Wednesday
        %{date: ~D[2023-12-18], value: 8}, # Monday
      ]
      
      result = Trends.detect_patterns(time_series)
      
      assert is_list(result.patterns)
    end

    test "returns empty patterns for insufficient data" do
      time_series = [
        %{date: ~D[2023-12-01], value: 5},
        %{date: ~D[2023-12-02], value: 6}
      ]
      
      result = Trends.detect_patterns(time_series)
      
      assert result.patterns == []
    end
  end

  describe "forecast/2" do
    test "generates forecast for significant trend" do
      trend = %{
        significant: true,
        slope: 1.0,
        intercept: 5.0,
        r_squared: 0.8,
        period_days: 10
      }
      
      forecast = Trends.forecast(trend, 5)
      
      assert forecast.days_ahead == 5
      assert forecast.predicted_value == 20.0 # 5 + 1.0 * (10 + 5)
      assert forecast.confidence == 0.8
      assert forecast.reliable == true
    end

    test "returns unreliable forecast for weak trend" do
      trend = %{
        significant: true,
        slope: 0.1,
        intercept: 5.0,
        r_squared: 0.3,
        period_days: 10
      }
      
      forecast = Trends.forecast(trend, 5)
      
      assert forecast.reliable == false
      assert forecast.confidence == 0.3
    end

    test "returns null forecast for non-significant trend" do
      trend = %{
        significant: false,
        slope: 0.01,
        intercept: 5.0,
        r_squared: 0.1,
        period_days: 10
      }
      
      forecast = Trends.forecast(trend, 5)
      
      assert forecast.predicted_value == nil
      assert forecast.reliable == false
      assert forecast.confidence == 0.0
    end
  end
end