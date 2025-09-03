defmodule LifeXP.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :email, :string
      add :password_hash, :string
      add :timezone, :string
      add :preferences, :map

      timestamps(type: :utc_datetime)
    end
  end
end
