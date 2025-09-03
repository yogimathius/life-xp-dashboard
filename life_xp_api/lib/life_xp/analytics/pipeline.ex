defmodule LifeXP.Analytics.Pipeline do
  @moduledoc """
  Background job processing pipeline for analytics operations using Oban.
  """

  use Oban.Worker, queue: :analytics

  alias LifeXP.Analytics.Engine

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id, "type" => "refresh_insights"}}) do
    Engine.refresh_insights(user_id)
    :ok
  end

  def perform(%Oban.Job{args: %{"user_id" => user_id, "type" => "daily_insights"}}) do
    user_id
    |> Engine.generate_insights()
    |> persist_insights()
    |> broadcast_updates()
    
    :ok
  end

  @doc """
  Schedules daily analytics processing for a user.
  """
  def schedule_daily_insights(user_id) do
    %{user_id: user_id, type: "daily_insights"}
    |> __MODULE__.new(schedule_in: {1, :hour})
    |> Oban.insert()
  end

  @doc """
  Schedules insight refresh for a user.
  """
  def schedule_refresh_insights(user_id) do
    %{user_id: user_id, type: "refresh_insights"}
    |> __MODULE__.new(schedule_in: {5, :seconds})
    |> Oban.insert()
  end

  defp persist_insights(insights) do
    # Insights are already persisted in Engine.refresh_insights/1
    insights
  end

  defp broadcast_updates(insights) do
    # Broadcasting is already handled in Engine.refresh_insights/1
    insights
  end
end