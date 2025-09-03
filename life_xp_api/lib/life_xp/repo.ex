defmodule LifeXP.Repo do
  use Ecto.Repo,
    otp_app: :life_xp,
    adapter: Ecto.Adapters.Postgres
end
