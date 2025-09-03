defmodule LifeXPWeb.AnalyticsController do
  use LifeXPWeb, :controller

  alias LifeXP.Analytics
  alias LifeXP.Auth.Guardian

  action_fallback LifeXPWeb.FallbackController

  def correlations(conn, params) do
    user = Guardian.Plug.current_resource(conn)
    date_range = parse_date_range(params)
    
    correlations = Analytics.calculate_correlations(user.id, date_range)
    
    conn
    |> put_status(:ok)
    |> json(%{data: correlations})
  end

  def trends(conn, %{"metric_id" => metric_id} = params) do
    user = Guardian.Plug.current_resource(conn)
    date_range = parse_date_range(params)
    
    trends = Analytics.detect_trends(user.id, metric_id, date_range)
    
    conn
    |> put_status(:ok)
    |> json(%{data: trends})
  end

  def insights(conn, params) do
    user = Guardian.Plug.current_resource(conn)
    filters = Map.take(params, ["type"])
    
    insights = Analytics.list_insights(user.id, filters)
    
    conn
    |> put_status(:ok)
    |> json(%{data: insights})
  end

  def export(conn, %{"format" => format}) do
    user = Guardian.Plug.current_resource(conn)
    format_atom = String.to_existing_atom(format)
    
    case Analytics.export_data(user.id, format_atom) do
      {:ok, data} ->
        conn
        |> put_resp_content_type(content_type_for_format(format_atom))
        |> put_resp_header("content-disposition", "attachment; filename=\"lifexp_export.#{format}\"")
        |> send_resp(200, data)
      
      {:error, :unsupported_format} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Unsupported export format"})
    end
  end

  def export(conn, _params) do
    # Default to JSON export
    export(conn, %{"format" => "json"})
  end

  defp parse_date_range(%{"start_date" => start_date, "end_date" => end_date}) do
    %{
      start_date: Date.from_iso8601!(start_date),
      end_date: Date.from_iso8601!(end_date)
    }
  rescue
    _ -> nil
  end

  defp parse_date_range(_), do: nil

  defp content_type_for_format(:json), do: "application/json"
  defp content_type_for_format(:csv), do: "text/csv"
  defp content_type_for_format(_), do: "application/octet-stream"
end