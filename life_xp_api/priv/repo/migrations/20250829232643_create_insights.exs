defmodule LifeXP.Repo.Migrations.CreateInsights do
  use Ecto.Migration

  def change do
    create table(:insights) do
      add :type, :string
      add :data, :map
      add :confidence, :float
      add :date_range, :map
      add :is_active, :boolean, default: false, null: false
      add :user_id, references(:users, on_delete: :nothing)

      timestamps(type: :utc_datetime)
    end

    create index(:insights, [:user_id])
  end
end
