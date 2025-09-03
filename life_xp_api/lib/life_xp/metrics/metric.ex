defmodule LifeXP.Metrics.Metric do
  use Ecto.Schema
  import Ecto.Changeset

  schema "metrics" do
    field :name, :string
    field :type, :string # rating, duration, binary, number, text
    field :config, :map # min/max values, scale, units
    field :category, :string # sleep, mood, productivity, custom
    field :is_active, :boolean, default: true
    
    belongs_to :user, LifeXP.Accounts.User
    has_many :entries, LifeXP.Data.Entry

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(metric, attrs) do
    metric
    |> cast(attrs, [:name, :type, :config, :category, :is_active, :user_id])
    |> validate_required([:name, :type, :category, :user_id])
    |> validate_inclusion(:type, ["rating", "duration", "binary", "number", "text"])
    |> validate_inclusion(:category, ["sleep", "mood", "productivity", "custom"])
    |> foreign_key_constraint(:user_id)
  end
end
