defmodule LifeXP.MixProject do
  use Mix.Project

  def project do
    [
      app: :life_xp,
      version: "0.1.0",
      elixir: "~> 1.14",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps()
    ]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [
      mod: {LifeXP.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  # Specifies which paths to compile per environment.
  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  # Specifies your project dependencies.
  #
  # Type `mix help deps` for examples and options.
  defp deps do
    [
      {:phoenix, "~> 1.7.19"},
      {:phoenix_ecto, "~> 4.5"},
      {:ecto_sql, "~> 3.10"},
      {:postgrex, ">= 0.0.0"},
      {:phoenix_live_dashboard, "~> 0.8.3"},
      {:swoosh, "~> 1.5"},
      {:finch, "~> 0.13"},
      {:telemetry_metrics, "~> 1.0"},
      {:telemetry_poller, "~> 1.0"},
      {:gettext, "~> 0.26"},
      {:jason, "~> 1.2"},
      {:dns_cluster, "~> 0.1.1"},
      {:bandit, "~> 1.5"},
      
      # Authentication & Authorization
      {:guardian, "~> 2.3"},
      {:comeonin, "~> 5.4"},
      {:bcrypt_elixir, "~> 3.0"},
      
      # Background Job Processing
      {:oban, "~> 2.18"},
      
      # Analytics & Mathematics
      {:nx, "~> 0.8"},
      {:explorer, "~> 0.9"},
      
      # Caching
      {:cachex, "~> 3.6"},
      
      # CSV Export
      {:csv, "~> 3.2"},
      
      # CORS
      {:cors_plug, "~> 3.0"},
      
      # Validation
      {:ex_json_schema, "~> 0.10"},
      
      # Testing
      {:stream_data, "~> 1.0", only: :test},
      {:ex_machina, "~> 2.8", only: :test}
    ]
  end

  # Aliases are shortcuts or tasks specific to the current project.
  # For example, to install project dependencies and perform other setup tasks, run:
  #
  #     $ mix setup
  #
  # See the documentation for `Mix` for more info on aliases.
  defp aliases do
    [
      setup: ["deps.get", "ecto.setup"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"]
    ]
  end
end
