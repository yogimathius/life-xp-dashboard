# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :life_xp,
  namespace: LifeXP,
  ecto_repos: [LifeXP.Repo],
  generators: [timestamp_type: :utc_datetime]

# Configures the endpoint
config :life_xp, LifeXPWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: LifeXPWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: LifeXP.PubSub,
  live_view: [signing_salt: "G0hR2FBa"]

# Configures the mailer
#
# By default it uses the "Local" adapter which stores the emails
# locally. You can see the emails in your browser, at "/dev/mailbox".
#
# For production it's recommended to configure a different adapter
# at the `config/runtime.exs`.
config :life_xp, LifeXP.Mailer, adapter: Swoosh.Adapters.Local

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Configure Guardian
config :life_xp, LifeXP.Auth.Guardian,
  issuer: "life_xp",
  secret_key: "your-secret-key-here-change-in-production"

# Configure Oban for background jobs
config :life_xp, Oban,
  repo: LifeXP.Repo,
  queues: [
    analytics: 10,
    exports: 5,
    notifications: 15
  ]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
