defmodule LifeXPWeb.MetricController do
  use LifeXPWeb, :controller

  alias LifeXP.Metrics
  alias LifeXP.Metrics.Metric
  alias LifeXP.Auth.Guardian

  action_fallback LifeXPWeb.FallbackController

  def index(conn, _params) do
    user = Guardian.Plug.current_resource(conn)
    metrics = Metrics.list_metrics(user.id)
    render(conn, :index, metrics: metrics)
  end

  def create(conn, %{"metric" => metric_params}) do
    user = Guardian.Plug.current_resource(conn)
    
    with {:ok, %Metric{} = metric} <- Metrics.create_metric(user.id, metric_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/metrics/#{metric}")
      |> render(:show, metric: metric)
    end
  end

  def show(conn, %{"id" => id}) do
    user = Guardian.Plug.current_resource(conn)
    metric = Metrics.get_user_metric!(user.id, id)
    render(conn, :show, metric: metric)
  end

  def update(conn, %{"id" => id, "metric" => metric_params}) do
    user = Guardian.Plug.current_resource(conn)
    metric = Metrics.get_user_metric!(user.id, id)

    with {:ok, %Metric{} = metric} <- Metrics.update_metric(metric, metric_params) do
      render(conn, :show, metric: metric)
    end
  end

  def delete(conn, %{"id" => id}) do
    user = Guardian.Plug.current_resource(conn)
    metric = Metrics.get_user_metric!(user.id, id)

    with {:ok, %Metric{}} <- Metrics.delete_metric(metric) do
      send_resp(conn, :no_content, "")
    end
  end
end