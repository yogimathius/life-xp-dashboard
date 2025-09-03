defmodule LifeXPWeb.Router do
  use LifeXPWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug CORSPlug, origin: ["http://localhost:3000", "http://127.0.0.1:3000"]
  end

  pipeline :auth do
    plug LifeXP.Auth.Pipeline
  end

  scope "/api", LifeXPWeb do
    pipe_through :api

    # Authentication routes
    post "/register", AuthController, :register
    post "/login", AuthController, :login
    post "/logout", AuthController, :logout
  end

  scope "/api", LifeXPWeb do
    pipe_through [:api, :auth]

    # Protected routes
    get "/me", AuthController, :me
    
    # Metrics management
    resources "/metrics", MetricController, except: [:new, :edit]
    
    # Data entry
    resources "/entries", EntryController, except: [:new, :edit]
    
    # Analytics
    get "/analytics/correlations", AnalyticsController, :correlations
    get "/analytics/trends", AnalyticsController, :trends
    get "/analytics/insights", AnalyticsController, :insights
    get "/analytics/export", AnalyticsController, :export
  end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:life_xp, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]

      live_dashboard "/dashboard", metrics: LifeXPWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
