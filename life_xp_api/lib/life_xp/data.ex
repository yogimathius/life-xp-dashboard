defmodule LifeXP.Data do
  @moduledoc """
  The Data context for managing metric entries.
  """

  import Ecto.Query, warn: false
  alias LifeXP.Repo

  alias LifeXP.Data.Entry

  @doc """
  Returns the list of entries for a user.
  """
  def list_entries(user_id, filters \\ %{}) do
    Entry
    |> where(user_id: ^user_id)
    |> filter_by_date_range(filters)
    |> filter_by_metric(filters)
    |> order_by([e], desc: e.date, desc: e.time)
    |> preload(:metric)
    |> Repo.all()
  end

  @doc """
  Gets a single entry.
  """
  def get_entry!(id), do: Repo.get!(Entry, id)

  @doc """
  Gets an entry by user and ID.
  """
  def get_user_entry!(user_id, id) do
    Entry
    |> where(user_id: ^user_id, id: ^id)
    |> preload(:metric)
    |> Repo.one!()
  end

  @doc """
  Creates an entry.
  """
  def create_entry(user_id, attrs \\ %{}) do
    attrs = Map.put(attrs, "user_id", user_id)
    
    %Entry{}
    |> Entry.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates an entry.
  """
  def update_entry(%Entry{} = entry, attrs) do
    entry
    |> Entry.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes an entry.
  """
  def delete_entry(%Entry{} = entry) do
    Repo.delete(entry)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking entry changes.
  """
  def change_entry(%Entry{} = entry, attrs \\ %{}) do
    Entry.changeset(entry, attrs)
  end

  @doc """
  Gets entries for analytics calculations.
  """
  def get_entries_for_analytics(user_id, date_range) do
    Entry
    |> where(user_id: ^user_id)
    |> where([e], e.date >= ^date_range.start_date and e.date <= ^date_range.end_date)
    |> preload(:metric)
    |> order_by([e], asc: e.date, asc: e.time)
    |> Repo.all()
  end

  @doc """
  Gets entries by metric for correlation analysis.
  """
  def get_entries_by_metric(user_id, metric_id, date_range) do
    Entry
    |> where(user_id: ^user_id, metric_id: ^metric_id)
    |> where([e], e.date >= ^date_range.start_date and e.date <= ^date_range.end_date)
    |> order_by([e], asc: e.date, asc: e.time)
    |> Repo.all()
  end

  defp filter_by_date_range(query, %{"start_date" => start_date, "end_date" => end_date}) do
    where(query, [e], e.date >= ^start_date and e.date <= ^end_date)
  end
  
  defp filter_by_date_range(query, _), do: query

  defp filter_by_metric(query, %{"metric_id" => metric_id}) do
    where(query, [e], e.metric_id == ^metric_id)
  end
  
  defp filter_by_metric(query, _), do: query
end