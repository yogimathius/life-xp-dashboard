defmodule LifeXPWeb.EntryJSON do
  alias LifeXP.Data.Entry
  alias LifeXP.Metrics.Metric

  @doc """
  Renders a list of entries.
  """
  def index(%{entries: entries}) do
    %{data: for(entry <- entries, do: data(entry))}
  end

  @doc """
  Renders a single entry.
  """
  def show(%{entry: entry}) do
    %{data: data(entry)}
  end

  defp data(%Entry{} = entry) do
    %{
      id: entry.id,
      value: entry.value,
      date: entry.date,
      time: entry.time,
      notes: entry.notes,
      tags: entry.tags,
      user_id: entry.user_id,
      metric_id: entry.metric_id,
      metric: render_metric(entry.metric),
      inserted_at: entry.inserted_at,
      updated_at: entry.updated_at
    }
  end

  defp render_metric(%Metric{} = metric) do
    %{
      id: metric.id,
      name: metric.name,
      type: metric.type,
      config: metric.config,
      category: metric.category
    }
  end

  defp render_metric(_), do: nil
end