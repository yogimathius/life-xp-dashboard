defmodule LifeXP.Analytics.CorrelationsTest do
  use ExUnit.Case, async: true
  alias LifeXP.Analytics.Correlations

  describe "pearson_correlation/2" do
    test "calculates perfect positive correlation" do
      x = [1, 2, 3, 4, 5]
      y = [2, 4, 6, 8, 10]
      
      correlation = Correlations.pearson_correlation(x, y)
      assert_in_delta correlation, 1.0, 0.001
    end

    test "calculates perfect negative correlation" do
      x = [1, 2, 3, 4, 5]
      y = [10, 8, 6, 4, 2]
      
      correlation = Correlations.pearson_correlation(x, y)
      assert_in_delta correlation, -1.0, 0.001
    end

    test "calculates no correlation" do
      x = [1, 2, 3, 4, 5]
      y = [3, 1, 4, 1, 5] # Random values
      
      correlation = Correlations.pearson_correlation(x, y)
      assert correlation != 1.0 and correlation != -1.0
    end

    test "handles identical values (zero variance)" do
      x = [5, 5, 5, 5, 5]
      y = [1, 2, 3, 4, 5]
      
      correlation = Correlations.pearson_correlation(x, y)
      assert correlation == 0.0
    end

    test "handles insufficient data points" do
      x = [1, 2]
      y = [3, 4]
      
      correlation = Correlations.pearson_correlation(x, y)
      assert correlation == 0.0
    end

    test "handles mismatched array lengths" do
      x = [1, 2, 3, 4, 5]
      y = [1, 2, 3]
      
      correlation = Correlations.pearson_correlation(x, y)
      # Should use min length (3 points)
      assert is_float(correlation)
    end
  end

  describe "spearman_correlation/2" do
    test "calculates rank correlation correctly" do
      x = [1, 2, 3, 4, 5]
      y = [2, 1, 4, 5, 3]
      
      correlation = Correlations.spearman_correlation(x, y)
      assert is_float(correlation)
      assert correlation >= -1.0 and correlation <= 1.0
    end

    test "handles tied ranks" do
      x = [1, 2, 2, 3, 4]
      y = [5, 4, 4, 2, 1]
      
      correlation = Correlations.spearman_correlation(x, y)
      assert is_float(correlation)
    end
  end

  describe "correlation_significance/2" do
    test "calculates significance for strong correlation" do
      result = Correlations.correlation_significance(0.8, 20)
      
      assert result.correlation == 0.8
      assert result.sample_size == 20
      assert is_float(result.t_statistic)
      assert is_float(result.p_value)
      assert is_boolean(result.significant)
    end

    test "returns non-significant for small sample size" do
      result = Correlations.correlation_significance(0.9, 2)
      
      assert result.significant == false
      assert result.p_value == 1.0
    end

    test "returns non-significant for weak correlation" do
      result = Correlations.correlation_significance(0.1, 50)
      
      assert result.correlation == 0.1
      assert result.significant == false
    end
  end

  describe "correlation_strength/1" do
    test "classifies strong positive correlation" do
      assert Correlations.correlation_strength(0.8) == :strong
      assert Correlations.correlation_strength(-0.7) == :strong
    end

    test "classifies moderate correlation" do
      assert Correlations.correlation_strength(0.5) == :moderate
      assert Correlations.correlation_strength(-0.4) == :moderate
    end

    test "classifies weak correlation" do
      assert Correlations.correlation_strength(0.3) == :weak
      assert Correlations.correlation_strength(-0.2) == :weak
    end

    test "classifies negligible correlation" do
      assert Correlations.correlation_strength(0.1) == :negligible
      assert Correlations.correlation_strength(-0.05) == :negligible
    end
  end

  describe "interpret_correlation/3" do
    test "generates correct interpretation for positive correlation" do
      interpretation = Correlations.interpret_correlation(0.7, "Sleep", "Mood")
      
      assert String.contains?(interpretation, "Sleep")
      assert String.contains?(interpretation, "Mood")
      assert String.contains?(interpretation, "strong")
      assert String.contains?(interpretation, "positive")
    end

    test "generates correct interpretation for negative correlation" do
      interpretation = Correlations.interpret_correlation(-0.5, "Stress", "Happiness")
      
      assert String.contains?(interpretation, "Stress")
      assert String.contains?(interpretation, "Happiness")
      assert String.contains?(interpretation, "moderate")
      assert String.contains?(interpretation, "negative")
    end

    test "includes correlation coefficient in interpretation" do
      interpretation = Correlations.interpret_correlation(0.456, "A", "B")
      
      assert String.contains?(interpretation, "0.456")
    end
  end
end