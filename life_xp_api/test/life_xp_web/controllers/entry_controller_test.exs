defmodule LifeXPWeb.EntryControllerTest do
  use LifeXPWeb.ConnCase

  alias LifeXP.Accounts
  alias LifeXP.Metrics
  alias LifeXP.Data
  alias LifeXP.Auth.Guardian

  @create_attrs %{
    value: %{"rating" => 8},
    date: ~D[2023-12-01],
    time: ~T[22:00:00],
    notes: "Good sleep",
    tags: ["restful", "early_bedtime"]
  }
  @update_attrs %{
    value: %{"rating" => 9},
    date: ~D[2023-12-02],
    notes: "Great sleep",
    tags: ["excellent"]
  }
  @invalid_attrs %{value: nil, date: nil}

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
    {:ok, metric} = Metrics.create_metric(user_id, %{
      name: "Sleep Quality",
      type: "rating",
      config: %{"min" => 1, "max" => 10},
      category: "sleep"
    })
    metric
  end

  def fixture(:entry, user_id, metric_id) do
    attrs = Map.put(@create_attrs, :metric_id, metric_id)
    {:ok, entry} = Data.create_entry(user_id, attrs)
    entry
  end

  setup %{conn: conn} do
    user = fixture(:user)
    metric = fixture(:metric, user.id)
    {:ok, token, _claims} = Guardian.encode_and_sign(user)
    conn = put_req_header(conn, "authorization", "Bearer #{token}")
    {:ok, conn: conn, user: user, metric: metric}
  end

  describe "index" do
    test "lists all user's entries", %{conn: conn, user: user, metric: metric} do
      entry = fixture(:entry, user.id, metric.id)
      conn = get(conn, ~p"/api/entries")
      
      assert %{"data" => entries} = json_response(conn, 200)
      assert length(entries) == 1
      
      returned_entry = List.first(entries)
      assert returned_entry["id"] == entry.id
      assert returned_entry["value"] == %{"rating" => 8}
      assert returned_entry["metric"]["name"] == "Sleep Quality"
    end

    test "filters entries by date range", %{conn: conn, user: user, metric: metric} do
      fixture(:entry, user.id, metric.id) # 2023-12-01
      
      # Create entry outside filter range
      future_attrs = %{@create_attrs | date: ~D[2023-12-31]}
      Data.create_entry(user.id, Map.put(future_attrs, :metric_id, metric.id))
      
      conn = get(conn, ~p"/api/entries?start_date=2023-12-01&end_date=2023-12-15")
      
      assert %{"data" => entries} = json_response(conn, 200)
      assert length(entries) == 1
    end

    test "filters entries by metric", %{conn: conn, user: user, metric: metric} do
      entry1 = fixture(:entry, user.id, metric.id)
      
      # Create second metric and entry
      {:ok, metric2} = Metrics.create_metric(user.id, %{
        name: "Mood",
        type: "rating",
        config: %{"min" => 1, "max" => 10},
        category: "mood"
      })
      fixture(:entry, user.id, metric2.id)
      
      conn = get(conn, ~p"/api/entries?metric_id=#{metric.id}")
      
      assert %{"data" => entries} = json_response(conn, 200)
      assert length(entries) == 1
      assert List.first(entries)["id"] == entry1.id
    end
  end

  describe "create entry" do
    test "renders entry when data is valid", %{conn: conn, metric: metric} do
      attrs = Map.put(@create_attrs, :metric_id, metric.id)
      conn = post(conn, ~p"/api/entries", entry: attrs)
      
      assert %{"data" => entry} = json_response(conn, 201)
      assert entry["value"] == %{"rating" => 8}
      assert entry["date"] == "2023-12-01"
      assert entry["notes"] == "Good sleep"
      assert entry["tags"] == ["restful", "early_bedtime"]
      assert entry["metric"]["id"] == metric.id
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/api/entries", entry: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end

    test "renders errors when value is not a map", %{conn: conn, metric: metric} do
      invalid_attrs = %{@create_attrs | value: "not_a_map", metric_id: metric.id}
      conn = post(conn, ~p"/api/entries", entry: invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end

    test "renders errors when metric doesn't exist", %{conn: conn} do
      attrs = Map.put(@create_attrs, :metric_id, 99999)
      conn = post(conn, ~p"/api/entries", entry: attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "show entry" do
    setup [:create_entry]

    test "renders entry", %{conn: conn, entry: entry} do
      conn = get(conn, ~p"/api/entries/#{entry}")
      
      assert %{"data" => returned_entry} = json_response(conn, 200)
      assert returned_entry["id"] == entry.id
      assert returned_entry["value"] == %{"rating" => 8}
    end
  end

  describe "update entry" do
    setup [:create_entry]

    test "renders entry when data is valid", %{conn: conn, entry: entry} do
      conn = put(conn, ~p"/api/entries/#{entry}", entry: @update_attrs)
      
      assert %{"data" => updated_entry} = json_response(conn, 200)
      assert updated_entry["value"] == %{"rating" => 9}
      assert updated_entry["date"] == "2023-12-02"
      assert updated_entry["notes"] == "Great sleep"
      assert updated_entry["tags"] == ["excellent"]
    end

    test "renders errors when data is invalid", %{conn: conn, entry: entry} do
      conn = put(conn, ~p"/api/entries/#{entry}", entry: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "delete entry" do
    setup [:create_entry]

    test "deletes chosen entry", %{conn: conn, entry: entry} do
      conn = delete(conn, ~p"/api/entries/#{entry}")
      assert response(conn, 204)
      
      assert_error_sent 404, fn ->
        get(conn, ~p"/api/entries/#{entry}")
      end
    end
  end

  describe "unauthorized access" do
    test "requires authentication", %{user: user, metric: metric} do
      conn = build_conn()
      entry = fixture(:entry, user.id, metric.id)
      
      conn = get(conn, ~p"/api/entries")
      assert json_response(conn, 401)
      
      conn = get(conn, ~p"/api/entries/#{entry}")
      assert json_response(conn, 401)
      
      attrs = Map.put(@create_attrs, :metric_id, metric.id)
      conn = post(conn, ~p"/api/entries", entry: attrs)
      assert json_response(conn, 401)
    end

    test "prevents access to other users' entries", %{conn: conn} do
      other_user = fixture(:user)
      other_metric = fixture(:metric, other_user.id)
      other_entry = fixture(:entry, other_user.id, other_metric.id)
      
      assert_error_sent 404, fn ->
        get(conn, ~p"/api/entries/#{other_entry}")
      end
      
      assert_error_sent 404, fn ->
        put(conn, ~p"/api/entries/#{other_entry}", entry: @update_attrs)
      end
      
      assert_error_sent 404, fn ->
        delete(conn, ~p"/api/entries/#{other_entry}")
      end
    end
  end

  defp create_entry(%{user: user, metric: metric}) do
    entry = fixture(:entry, user.id, metric.id)
    %{entry: entry}
  end
end