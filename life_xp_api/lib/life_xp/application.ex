defmodule LifeXP.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      LifeXPWeb.Telemetry,
      LifeXP.Repo,
      {DNSCluster, query: Application.get_env(:life_xp, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: LifeXP.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: LifeXP.Finch},
      # Start Oban for background jobs
      {Oban, Application.fetch_env!(:life_xp, Oban)},
      # Start to serve requests, typically the last entry
      LifeXPWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: LifeXP.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    LifeXPWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
