defmodule LifeXP.Metrics do
  @moduledoc """
  The Metrics context.
  """

  import Ecto.Query, warn: false
  alias LifeXP.Repo

  alias LifeXP.Metrics.Metric

  @doc """
  Returns the list of metrics for a user.
  """
  def list_metrics(user_id) do
    Metric
    |> where(user_id: ^user_id)
    |> where(is_active: true)
    |> order_by([m], [asc: m.category, asc: m.name])
    |> Repo.all()
  end

  @doc """
  Gets a single metric.
  """
  def get_metric!(id), do: Repo.get!(Metric, id)

  @doc """
  Gets a metric by user and ID.
  """
  def get_user_metric!(user_id, id) do
    Metric
    |> where(user_id: ^user_id, id: ^id)
    |> Repo.one!()
  end

  @doc """
  Creates a metric.
  """
  def create_metric(user_id, attrs \\ %{}) do
    attrs = Map.put(attrs, "user_id", user_id)
    
    %Metric{}
    |> Metric.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a metric.
  """
  def update_metric(%Metric{} = metric, attrs) do
    metric
    |> Metric.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a metric (soft delete by setting is_active to false).
  """
  def delete_metric(%Metric{} = metric) do
    metric
    |> Metric.changeset(%{is_active: false})
    |> Repo.update()
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking metric changes.
  """
  def change_metric(%Metric{} = metric, attrs \\ %{}) do
    Metric.changeset(metric, attrs)
  end

  @doc """
  Gets metrics by category for a user.
  """
  def list_metrics_by_category(user_id, category) do
    Metric
    |> where(user_id: ^user_id, category: ^category, is_active: true)
    |> order_by([m], asc: m.name)
    |> Repo.all()
  end

  @doc """
  Gets metrics by type for a user.
  """
  def list_metrics_by_type(user_id, type) do
    Metric
    |> where(user_id: ^user_id, type: ^type, is_active: true)
    |> order_by([m], asc: m.name)
    |> Repo.all()
  end
end