defmodule LifeXP.Repo.Migrations.CreateEntries do
  use Ecto.Migration

  def change do
    create table(:entries) do
      add :value, :map
      add :date, :date
      add :time, :time
      add :notes, :text
      add :tags, {:array, :string}
      add :user_id, references(:users, on_delete: :nothing)
      add :metric_id, references(:metrics, on_delete: :nothing)

      timestamps(type: :utc_datetime)
    end

    create index(:entries, [:user_id])
    create index(:entries, [:metric_id])
  end
end
