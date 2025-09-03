defmodule LifeXP.DataTest do
  use LifeXP.DataCase

  alias LifeXP.Data
  alias LifeXP.Accounts
  alias LifeXP.Metrics

  describe "entries" do
    @valid_user_attrs %{
      email: "test@example.com",
      password: "password123",
      timezone: "UTC",
      preferences: %{}
    }

    @valid_metric_attrs %{
      name: "Sleep Quality",
      type: "rating",
      config: %{"min" => 1, "max" => 10},
      category: "sleep"
    }

    @valid_attrs %{
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

    def user_fixture() do
      {:ok, user} = Accounts.create_user(@valid_user_attrs)
      user
    end

    def metric_fixture(user_id) do
      {:ok, metric} = Metrics.create_metric(user_id, @valid_metric_attrs)
      metric
    end

    def entry_fixture(user_id, metric_id, attrs \\ %{}) do
      attrs = 
        attrs
        |> Enum.into(@valid_attrs)
        |> Map.put(:metric_id, metric_id)
      
      {:ok, entry} = Data.create_entry(user_id, attrs)
      entry
    end

    test "list_entries/1 returns all entries for a user" do
      user = user_fixture()
      metric = metric_fixture(user.id)
      entry = entry_fixture(user.id, metric.id)
      
      entries = Data.list_entries(user.id)
      assert length(entries) == 1
      assert List.first(entries).id == entry.id
    end

    test "list_entries/2 with date range filter returns filtered entries" do
      user = user_fixture()
      metric = metric_fixture(user.id)
      
      entry1 = entry_fixture(user.id, metric.id, %{date: ~D[2023-12-01]})
      entry2 = entry_fixture(user.id, metric.id, %{date: ~D[2023-12-15]})
      entry_fixture(user.id, metric.id, %{date: ~D[2023-12-31]})
      
      filters = %{"start_date" => ~D[2023-12-01], "end_date" => ~D[2023-12-20]}
      entries = Data.list_entries(user.id, filters)
      
      assert length(entries) == 2
      entry_ids = Enum.map(entries, & &1.id)
      assert entry1.id in entry_ids
      assert entry2.id in entry_ids
    end

    test "list_entries/2 with metric filter returns filtered entries" do
      user = user_fixture()
      metric1 = metric_fixture(user.id)
      {:ok, metric2} = Metrics.create_metric(user.id, %{@valid_metric_attrs | name: "Mood"})
      
      entry1 = entry_fixture(user.id, metric1.id)
      entry_fixture(user.id, metric2.id)
      
      filters = %{"metric_id" => metric1.id}
      entries = Data.list_entries(user.id, filters)
      
      assert length(entries) == 1
      assert List.first(entries).id == entry1.id
    end

    test "get_user_entry!/2 returns the entry with given id for user" do
      user = user_fixture()
      metric = metric_fixture(user.id)
      entry = entry_fixture(user.id, metric.id)
      
      found_entry = Data.get_user_entry!(user.id, entry.id)
      assert found_entry.id == entry.id
      assert found_entry.metric.id == metric.id
    end

    test "create_entry/2 with valid data creates an entry" do
      user = user_fixture()
      metric = metric_fixture(user.id)
      attrs = Map.put(@valid_attrs, :metric_id, metric.id)
      
      assert {:ok, %Data.Entry{} = entry} = Data.create_entry(user.id, attrs)
      assert entry.value == %{"rating" => 8}
      assert entry.date == ~D[2023-12-01]
      assert entry.time == ~T[22:00:00]
      assert entry.notes == "Good sleep"
      assert entry.tags == ["restful", "early_bedtime"]
      assert entry.user_id == user.id
      assert entry.metric_id == metric.id
    end

    test "create_entry/2 with invalid data returns error changeset" do
      user = user_fixture()
      assert {:error, %Ecto.Changeset{}} = Data.create_entry(user.id, @invalid_attrs)
    end

    test "create_entry/2 with invalid value format returns error changeset" do
      user = user_fixture()
      metric = metric_fixture(user.id)
      invalid_attrs = %{@valid_attrs | value: "not_a_map", metric_id: metric.id}
      
      assert {:error, %Ecto.Changeset{}} = Data.create_entry(user.id, invalid_attrs)
    end

    test "update_entry/2 with valid data updates the entry" do
      user = user_fixture()
      metric = metric_fixture(user.id)
      entry = entry_fixture(user.id, metric.id)
      
      assert {:ok, %Data.Entry{} = entry} = Data.update_entry(entry, @update_attrs)
      assert entry.value == %{"rating" => 9}
      assert entry.date == ~D[2023-12-02]
      assert entry.notes == "Great sleep"
      assert entry.tags == ["excellent"]
    end

    test "update_entry/2 with invalid data returns error changeset" do
      user = user_fixture()
      metric = metric_fixture(user.id)
      entry = entry_fixture(user.id, metric.id)
      
      assert {:error, %Ecto.Changeset{}} = Data.update_entry(entry, @invalid_attrs)
      assert entry.id == Data.get_user_entry!(user.id, entry.id).id
    end

    test "delete_entry/1 deletes the entry" do
      user = user_fixture()
      metric = metric_fixture(user.id)
      entry = entry_fixture(user.id, metric.id)
      
      assert {:ok, %Data.Entry{}} = Data.delete_entry(entry)
      assert_raise Ecto.NoResultsError, fn -> Data.get_user_entry!(user.id, entry.id) end
    end

    test "get_entries_for_analytics/2 returns entries within date range" do
      user = user_fixture()
      metric = metric_fixture(user.id)
      
      entry1 = entry_fixture(user.id, metric.id, %{date: ~D[2023-12-05]})
      entry2 = entry_fixture(user.id, metric.id, %{date: ~D[2023-12-10]})
      entry_fixture(user.id, metric.id, %{date: ~D[2023-12-25]})
      
      date_range = %{start_date: ~D[2023-12-01], end_date: ~D[2023-12-15]}
      entries = Data.get_entries_for_analytics(user.id, date_range)
      
      assert length(entries) == 2
      entry_ids = Enum.map(entries, & &1.id)
      assert entry1.id in entry_ids
      assert entry2.id in entry_ids
    end

    test "get_entries_by_metric/3 returns entries for specific metric and date range" do
      user = user_fixture()
      metric1 = metric_fixture(user.id)
      {:ok, metric2} = Metrics.create_metric(user.id, %{@valid_metric_attrs | name: "Mood"})
      
      target_entry = entry_fixture(user.id, metric1.id, %{date: ~D[2023-12-05]})
      entry_fixture(user.id, metric2.id, %{date: ~D[2023-12-05]}) # Different metric
      entry_fixture(user.id, metric1.id, %{date: ~D[2023-12-25]}) # Outside date range
      
      date_range = %{start_date: ~D[2023-12-01], end_date: ~D[2023-12-15]}
      entries = Data.get_entries_by_metric(user.id, metric1.id, date_range)
      
      assert length(entries) == 1
      assert List.first(entries).id == target_entry.id
    end
  end
end