defmodule LifeXPWeb.EntryController do
  use LifeXPWeb, :controller

  alias LifeXP.Data
  alias LifeXP.Data.Entry
  alias LifeXP.Auth.Guardian

  action_fallback LifeXPWeb.FallbackController

  def index(conn, params) do
    user = Guardian.Plug.current_resource(conn)
    entries = Data.list_entries(user.id, params)
    render(conn, :index, entries: entries)
  end

  def create(conn, %{"entry" => entry_params}) do
    user = Guardian.Plug.current_resource(conn)
    
    with {:ok, %Entry{} = entry} <- Data.create_entry(user.id, entry_params) do
      # Broadcast real-time update
      LifeXPWeb.Endpoint.broadcast("user:#{user.id}", "entry_created", %{entry: entry})
      
      # Schedule analytics refresh
      schedule_analytics_refresh(user.id)
      
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/entries/#{entry}")
      |> render(:show, entry: entry)
    end
  end

  def show(conn, %{"id" => id}) do
    user = Guardian.Plug.current_resource(conn)
    entry = Data.get_user_entry!(user.id, id)
    render(conn, :show, entry: entry)
  end

  def update(conn, %{"id" => id, "entry" => entry_params}) do
    user = Guardian.Plug.current_resource(conn)
    entry = Data.get_user_entry!(user.id, id)

    with {:ok, %Entry{} = entry} <- Data.update_entry(entry, entry_params) do
      # Broadcast real-time update
      LifeXPWeb.Endpoint.broadcast("user:#{user.id}", "entry_updated", %{entry: entry})
      
      # Schedule analytics refresh
      schedule_analytics_refresh(user.id)
      
      render(conn, :show, entry: entry)
    end
  end

  def delete(conn, %{"id" => id}) do
    user = Guardian.Plug.current_resource(conn)
    entry = Data.get_user_entry!(user.id, id)

    with {:ok, %Entry{}} <- Data.delete_entry(entry) do
      # Broadcast real-time update
      LifeXPWeb.Endpoint.broadcast("user:#{user.id}", "entry_deleted", %{entry_id: entry.id})
      
      # Schedule analytics refresh
      schedule_analytics_refresh(user.id)
      
      send_resp(conn, :no_content, "")
    end
  end

  defp schedule_analytics_refresh(user_id) do
    # Schedule background job to refresh analytics
    LifeXP.Analytics.Pipeline.schedule_refresh_insights(user_id)
  end
end