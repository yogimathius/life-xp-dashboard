defmodule LifeXP.Data.Entry do
  use Ecto.Schema
  import Ecto.Changeset

  schema "entries" do
    field :value, :map # flexible value storage (number, text, duration, etc.)
    field :date, :date
    field :time, :time # optional time component
    field :notes, :string # optional notes
    field :tags, {:array, :string}, default: []
    
    belongs_to :user, LifeXP.Accounts.User
    belongs_to :metric, LifeXP.Metrics.Metric

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(entry, attrs) do
    entry
    |> cast(attrs, [:value, :date, :time, :notes, :tags, :user_id, :metric_id])
    |> validate_required([:value, :date, :user_id, :metric_id])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:metric_id)
    |> validate_value_format()
  end

  defp validate_value_format(%Ecto.Changeset{changes: %{value: value}} = changeset) when is_map(value) do
    changeset
  end
  
  defp validate_value_format(changeset) do
    add_error(changeset, :value, "must be a map containing the metric value")
  end
end
