defmodule LifeXPWeb.MetricJSON do
  alias LifeXP.Metrics.Metric

  @doc """
  Renders a list of metrics.
  """
  def index(%{metrics: metrics}) do
    %{data: for(metric <- metrics, do: data(metric))}
  end

  @doc """
  Renders a single metric.
  """
  def show(%{metric: metric}) do
    %{data: data(metric)}
  end

  defp data(%Metric{} = metric) do
    %{
      id: metric.id,
      name: metric.name,
      type: metric.type,
      config: metric.config,
      category: metric.category,
      is_active: metric.is_active,
      user_id: metric.user_id,
      inserted_at: metric.inserted_at,
      updated_at: metric.updated_at
    }
  end
end