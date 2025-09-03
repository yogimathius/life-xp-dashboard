defmodule LifeXP.Analytics do
  @moduledoc """
  The Analytics context for managing insights and analytics operations.
  """

  import Ecto.Query, warn: false
  alias LifeXP.Repo
  alias LifeXP.Analytics.Insight
  alias LifeXP.Analytics.Engine

  @doc """
  Gets insights for a user.
  """
  def list_insights(user_id, filters \\ %{}) do
    Insight
    |> where(user_id: ^user_id, is_active: true)
    |> filter_by_type(filters)
    |> order_by([i], desc: i.inserted_at)
    |> limit(50)
    |> Repo.all()
  end

  @doc """
  Gets a single insight.
  """
  def get_insight!(id), do: Repo.get!(Insight, id)

  @doc """
  Creates an insight.
  """
  def create_insight(attrs \\ %{}) do
    %Insight{}
    |> Insight.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Stores an insight for a user.
  """
  def store_insight(user_id, type, data, confidence) do
    attrs = %{
      user_id: user_id,
      type: type,
      data: data,
      confidence: confidence,
      date_range: %{
        start_date: Date.add(Date.utc_today(), -30),
        end_date: Date.utc_today()
      }
    }
    
    create_insight(attrs)
  end

  @doc """
  Updates an insight.
  """
  def update_insight(%Insight{} = insight, attrs) do
    insight
    |> Insight.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes an insight.
  """
  def delete_insight(%Insight{} = insight) do
    Repo.delete(insight)
  end

  @doc """
  Calculates correlations for a user.
  """
  def calculate_correlations(user_id, date_range \\ nil) do
    Engine.calculate_correlations(user_id, date_range)
  end

  @doc """
  Detects trends for a user's metric.
  """
  def detect_trends(user_id, metric_id, date_range \\ nil) do
    Engine.detect_trends(user_id, metric_id, date_range)
  end

  @doc """
  Generates comprehensive insights for a user.
  """
  def generate_insights(user_id, date_range \\ nil) do
    Engine.generate_insights(user_id, date_range)
  end

  @doc """
  Refreshes all insights for a user.
  """
  def refresh_insights(user_id) do
    Engine.refresh_insights(user_id)
  end

  @doc """
  Exports user data in various formats.
  """
  def export_data(user_id, format \\ :json) do
    case format do
      :json -> export_json(user_id)
      :csv -> export_csv(user_id)
      _ -> {:error, :unsupported_format}
    end
  end

  # Private functions

  defp filter_by_type(query, %{"type" => type}) do
    where(query, [i], i.type == ^type)
  end
  
  defp filter_by_type(query, _), do: query

  defp export_json(user_id) do
    user = LifeXP.Accounts.get_user!(user_id)
    metrics = LifeXP.Metrics.list_metrics(user_id)
    entries = LifeXP.Data.list_entries(user_id)
    insights = list_insights(user_id)

    data = %{
      user: %{
        id: user.id,
        email: user.email,
        timezone: user.timezone,
        preferences: user.preferences
      },
      metrics: Enum.map(metrics, &format_metric_for_export/1),
      entries: Enum.map(entries, &format_entry_for_export/1),
      insights: Enum.map(insights, &format_insight_for_export/1),
      exported_at: DateTime.utc_now()
    }

    {:ok, Jason.encode!(data, pretty: true)}
  end

  defp export_csv(user_id) do
    entries = LifeXP.Data.list_entries(user_id)
    
    csv_data = [
      ["Date", "Time", "Metric", "Value", "Notes", "Tags"]
    ] ++ Enum.map(entries, fn entry ->
      [
        Date.to_string(entry.date),
        if(entry.time, do: Time.to_string(entry.time), else: ""),
        entry.metric.name,
        inspect(entry.value),
        entry.notes || "",
        Enum.join(entry.tags, ";")
      ]
    end)

    csv_string = csv_data
    |> CSV.encode()
    |> Enum.to_list()
    |> Enum.join("")

    {:ok, csv_string}
  end

  defp format_metric_for_export(metric) do
    %{
      name: metric.name,
      type: metric.type,
      config: metric.config,
      category: metric.category,
      created_at: metric.inserted_at
    }
  end

  defp format_entry_for_export(entry) do
    %{
      date: entry.date,
      time: entry.time,
      value: entry.value,
      notes: entry.notes,
      tags: entry.tags,
      metric_name: entry.metric.name,
      created_at: entry.inserted_at
    }
  end

  defp format_insight_for_export(insight) do
    %{
      type: insight.type,
      data: insight.data,
      confidence: insight.confidence,
      date_range: insight.date_range,
      created_at: insight.inserted_at
    }
  end
end