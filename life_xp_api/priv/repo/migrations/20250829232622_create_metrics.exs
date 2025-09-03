defmodule LifeXP.Repo.Migrations.CreateMetrics do
  use Ecto.Migration

  def change do
    create table(:metrics) do
      add :name, :string
      add :type, :string
      add :config, :map
      add :category, :string
      add :is_active, :boolean, default: false, null: false
      add :user_id, references(:users, on_delete: :nothing)

      timestamps(type: :utc_datetime)
    end

    create index(:metrics, [:user_id])
  end
end
