defmodule LifeXPWeb.MetricControllerTest do
  use LifeXPWeb.ConnCase

  alias LifeXP.Accounts
  alias LifeXP.Metrics
  alias LifeXP.Auth.Guardian

  @create_attrs %{
    name: "Sleep Quality",
    type: "rating",
    config: %{"min" => 1, "max" => 10},
    category: "sleep"
  }
  @update_attrs %{
    name: "Updated Sleep Quality",
    type: "rating",
    config: %{"min" => 1, "max" => 5},
    category: "custom"
  }
  @invalid_attrs %{name: nil, type: nil, category: nil}

  def fixture(:user) do
    {:ok, user} = Accounts.create_user(%{
      email: "test@example.com",
      password: "password123",
      timezone: "UTC",
      preferences: %{}
    })
    user
  end

  def fixture(:metric, user_id) do
    {:ok, metric} = Metrics.create_metric(user_id, @create_attrs)
    metric
  end

  setup %{conn: conn} do
    user = fixture(:user)
    {:ok, token, _claims} = Guardian.encode_and_sign(user)
    conn = put_req_header(conn, "authorization", "Bearer #{token}")
    {:ok, conn: conn, user: user}
  end

  describe "index" do
    test "lists all user's metrics", %{conn: conn, user: user} do
      metric = fixture(:metric, user.id)
      conn = get(conn, ~p"/api/metrics")
      
      assert %{"data" => metrics} = json_response(conn, 200)
      assert length(metrics) == 1
      assert List.first(metrics)["id"] == metric.id
    end

    test "does not list other users' metrics", %{conn: conn} do
      other_user = fixture(:user)
      fixture(:metric, other_user.id)
      
      conn = get(conn, ~p"/api/metrics")
      assert %{"data" => []} = json_response(conn, 200)
    end
  end

  describe "create metric" do
    test "renders metric when data is valid", %{conn: conn} do
      conn = post(conn, ~p"/api/metrics", metric: @create_attrs)
      
      assert %{"data" => metric} = json_response(conn, 201)
      assert metric["name"] == "Sleep Quality"
      assert metric["type"] == "rating"
      assert metric["category"] == "sleep"
      assert metric["is_active"] == true
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/api/metrics", metric: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end

    test "renders errors when type is invalid", %{conn: conn} do
      invalid_type_attrs = %{@create_attrs | type: "invalid_type"}
      conn = post(conn, ~p"/api/metrics", metric: invalid_type_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "show metric" do
    setup [:create_metric]

    test "renders metric", %{conn: conn, metric: metric} do
      conn = get(conn, ~p"/api/metrics/#{metric}")
      
      assert %{"data" => returned_metric} = json_response(conn, 200)
      assert returned_metric["id"] == metric.id
      assert returned_metric["name"] == metric.name
    end

    test "returns 404 for non-existent metric", %{conn: conn} do
      assert_error_sent 404, fn ->
        get(conn, ~p"/api/metrics/99999")
      end
    end
  end

  describe "update metric" do
    setup [:create_metric]

    test "renders metric when data is valid", %{conn: conn, metric: metric} do
      conn = put(conn, ~p"/api/metrics/#{metric}", metric: @update_attrs)
      
      assert %{"data" => updated_metric} = json_response(conn, 200)
      assert updated_metric["name"] == "Updated Sleep Quality"
      assert updated_metric["category"] == "custom"
    end

    test "renders errors when data is invalid", %{conn: conn, metric: metric} do
      conn = put(conn, ~p"/api/metrics/#{metric}", metric: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "delete metric" do
    setup [:create_metric]

    test "soft deletes chosen metric", %{conn: conn, metric: metric, user: user} do
      conn = delete(conn, ~p"/api/metrics/#{metric}")
      assert response(conn, 204)
      
      # Verify metric is soft deleted (not in active list)
      conn = get(conn, ~p"/api/metrics")
      assert %{"data" => []} = json_response(conn, 200)
    end
  end

  describe "unauthorized access" do
    test "requires authentication", %{user: user} do
      conn = build_conn()
      metric = fixture(:metric, user.id)
      
      conn = get(conn, ~p"/api/metrics")
      assert json_response(conn, 401)
      
      conn = get(conn, ~p"/api/metrics/#{metric}")
      assert json_response(conn, 401)
      
      conn = post(conn, ~p"/api/metrics", metric: @create_attrs)
      assert json_response(conn, 401)
    end

    test "prevents access to other users' metrics", %{conn: conn} do
      other_user = fixture(:user)
      other_metric = fixture(:metric, other_user.id)
      
      assert_error_sent 404, fn ->
        get(conn, ~p"/api/metrics/#{other_metric}")
      end
      
      assert_error_sent 404, fn ->
        put(conn, ~p"/api/metrics/#{other_metric}", metric: @update_attrs)
      end
      
      assert_error_sent 404, fn ->
        delete(conn, ~p"/api/metrics/#{other_metric}")
      end
    end
  end

  defp create_metric(%{user: user}) do
    metric = fixture(:metric, user.id)
    %{metric: metric}
  end
end