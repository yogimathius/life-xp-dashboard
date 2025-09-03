defmodule LifeXP.Analytics.Insight do
  use Ecto.Schema
  import Ecto.Changeset

  schema "insights" do
    field :type, :string # correlation, trend, pattern, recommendation
    field :data, :map # analysis results
    field :confidence, :float
    field :date_range, :map # {start_date, end_date}
    field :is_active, :boolean, default: true
    
    belongs_to :user, LifeXP.Accounts.User

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(insight, attrs) do
    insight
    |> cast(attrs, [:type, :data, :confidence, :date_range, :is_active, :user_id])
    |> validate_required([:type, :data, :confidence, :user_id])
    |> validate_inclusion(:type, ["correlation", "trend", "pattern", "recommendation"])
    |> validate_number(:confidence, greater_than_or_equal_to: 0.0, less_than_or_equal_to: 1.0)
    |> foreign_key_constraint(:user_id)
  end
end
