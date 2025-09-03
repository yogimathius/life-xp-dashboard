defmodule LifeXP.MetricsTest do
  use LifeXP.DataCase

  alias LifeXP.Metrics
  alias LifeXP.Accounts

  describe "metrics" do
    @valid_user_attrs %{
      email: "test@example.com",
      password: "password123",
      timezone: "UTC",
      preferences: %{}
    }

    @valid_attrs %{
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

    def user_fixture() do
      {:ok, user} = Accounts.create_user(@valid_user_attrs)
      user
    end

    def metric_fixture(user_id, attrs \\ %{}) do
      attrs = Enum.into(attrs, @valid_attrs)
      {:ok, metric} = Metrics.create_metric(user_id, attrs)
      metric
    end

    test "list_metrics/1 returns all metrics for a user" do
      user = user_fixture()
      metric = metric_fixture(user.id)
      assert Metrics.list_metrics(user.id) == [metric]
    end

    test "list_metrics/1 only returns active metrics" do
      user = user_fixture()
      active_metric = metric_fixture(user.id)
      inactive_metric = metric_fixture(user.id, %{name: "Inactive", is_active: false})
      
      assert Metrics.list_metrics(user.id) == [active_metric]
    end

    test "get_user_metric!/2 returns the metric with given id for user" do
      user = user_fixture()
      metric = metric_fixture(user.id)
      assert Metrics.get_user_metric!(user.id, metric.id) == metric
    end

    test "create_metric/2 with valid data creates a metric" do
      user = user_fixture()
      assert {:ok, %Metrics.Metric{} = metric} = Metrics.create_metric(user.id, @valid_attrs)
      assert metric.name == "Sleep Quality"
      assert metric.type == "rating"
      assert metric.config == %{"min" => 1, "max" => 10}
      assert metric.category == "sleep"
      assert metric.is_active == true
      assert metric.user_id == user.id
    end

    test "create_metric/2 with invalid data returns error changeset" do
      user = user_fixture()
      assert {:error, %Ecto.Changeset{}} = Metrics.create_metric(user.id, @invalid_attrs)
    end

    test "create_metric/2 with invalid type returns error changeset" do
      user = user_fixture()
      invalid_type_attrs = %{@valid_attrs | type: "invalid_type"}
      assert {:error, %Ecto.Changeset{}} = Metrics.create_metric(user.id, invalid_type_attrs)
    end

    test "update_metric/2 with valid data updates the metric" do
      user = user_fixture()
      metric = metric_fixture(user.id)
      assert {:ok, %Metrics.Metric{} = metric} = Metrics.update_metric(metric, @update_attrs)
      assert metric.name == "Updated Sleep Quality"
      assert metric.config == %{"min" => 1, "max" => 5}
      assert metric.category == "custom"
    end

    test "update_metric/2 with invalid data returns error changeset" do
      user = user_fixture()
      metric = metric_fixture(user.id)
      assert {:error, %Ecto.Changeset{}} = Metrics.update_metric(metric, @invalid_attrs)
      assert metric == Metrics.get_user_metric!(user.id, metric.id)
    end

    test "delete_metric/1 soft deletes the metric" do
      user = user_fixture()
      metric = metric_fixture(user.id)
      assert {:ok, %Metrics.Metric{} = updated_metric} = Metrics.delete_metric(metric)
      assert updated_metric.is_active == false
      assert [] == Metrics.list_metrics(user.id)
    end

    test "list_metrics_by_category/2 returns metrics filtered by category" do
      user = user_fixture()
      sleep_metric = metric_fixture(user.id, %{category: "sleep"})
      mood_metric = metric_fixture(user.id, %{name: "Mood", category: "mood"})
      
      assert Metrics.list_metrics_by_category(user.id, "sleep") == [sleep_metric]
      assert Metrics.list_metrics_by_category(user.id, "mood") == [mood_metric]
    end

    test "list_metrics_by_type/2 returns metrics filtered by type" do
      user = user_fixture()
      rating_metric = metric_fixture(user.id, %{type: "rating"})
      binary_metric = metric_fixture(user.id, %{name: "Exercise", type: "binary"})
      
      assert Metrics.list_metrics_by_type(user.id, "rating") == [rating_metric]
      assert Metrics.list_metrics_by_type(user.id, "binary") == [binary_metric]
    end
  end
end