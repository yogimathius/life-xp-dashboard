defmodule LifeXP.Auth.Pipeline do
  use Guardian.Plug.Pipeline, 
    otp_app: :life_xp,
    module: LifeXP.Auth.Guardian,
    error_handler: LifeXP.Auth.ErrorHandler

  plug Guardian.Plug.VerifyHeader
  plug Guardian.Plug.EnsureAuthenticated
  plug Guardian.Plug.LoadResource
end