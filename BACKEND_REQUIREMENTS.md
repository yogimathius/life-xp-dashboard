# Life XP Dashboard - Backend Requirements

## **Current Status: React Frontend Complete, Backend Needed**
- React + TypeScript dashboard with data entry and visualization ✅
- **Missing**: Backend API for data persistence, multi-device sync, analytics processing

---

## **Backend Technology: Elixir + Phoenix**

**Why Elixir/Phoenix:**
- **Real-time data sync** across devices with Phoenix LiveView
- **Excellent pattern matching** for complex analytics calculations
- **Built-in fault tolerance** for reliable data processing
- **Concurrent processing** perfect for multiple metric calculations
- **OTP supervision trees** ensure zero data loss
- **GraphQL support** for efficient data queries

---

## **Required API Endpoints**

```elixir
# User management
POST /api/users/register
POST /api/users/login
GET /api/users/profile
PUT /api/users/preferences

# Metric management
GET /api/metrics # user's metric definitions
POST /api/metrics # create custom metric
PUT /api/metrics/:id
DELETE /api/metrics/:id

# Data entry and retrieval
POST /api/entries # log metric data
GET /api/entries # filtered by date/metric
PUT /api/entries/:id
DELETE /api/entries/:id

# Analytics and insights
GET /api/analytics/correlations
GET /api/analytics/trends
GET /api/analytics/insights
GET /api/analytics/export

# Real-time sync
WebSocket /socket # Phoenix channels for real-time sync
```

---

## **Database Schema (PostgreSQL with Ecto)**

```elixir
# User accounts
defmodule LifeXP.Accounts.User do
  schema "users" do
    field :email, :string
    field :password_hash, :string
    field :timezone, :string
    field :preferences, :map # UI preferences, notification settings
    
    has_many :metrics, LifeXP.Metrics.Metric
    has_many :entries, LifeXP.Data.Entry
    
    timestamps()
  end
end

# Flexible metric definitions
defmodule LifeXP.Metrics.Metric do
  schema "metrics" do
    field :name, :string
    field :type, :string # rating, duration, binary, number, text
    field :config, :map # min/max values, scale, units
    field :category, :string # sleep, mood, productivity, custom
    field :is_active, :boolean, default: true
    
    belongs_to :user, LifeXP.Accounts.User
    has_many :entries, LifeXP.Data.Entry
    
    timestamps()
  end
end

# Metric data entries
defmodule LifeXP.Data.Entry do
  schema "entries" do
    field :value, :map # flexible value storage (number, text, duration, etc.)
    field :date, :date
    field :time, :time, null: true # optional time component
    field :notes, :text, null: true
    field :tags, {:array, :string}, default: []
    
    belongs_to :user, LifeXP.Accounts.User
    belongs_to :metric, LifeXP.Metrics.Metric
    
    timestamps()
  end
end

# Precomputed analytics for performance
defmodule LifeXP.Analytics.Insight do
  schema "insights" do
    field :type, :string # correlation, trend, pattern, recommendation
    field :data, :map # analysis results
    field :confidence, :float
    field :date_range, :map # {start_date, end_date}
    field :is_active, :boolean, default: true
    
    belongs_to :user, LifeXP.Accounts.User
    
    timestamps()
  end
end
```

---

## **Real-Time Analytics Engine**

```elixir
defmodule LifeXP.Analytics.Engine do
  use GenServer
  
  # Correlation analysis between metrics
  def calculate_correlations(user_id, date_range) do
    entries = get_user_entries(user_id, date_range)
    
    entries
    |> group_by_metric()
    |> calculate_pearson_correlation()
    |> filter_significant_correlations()
  end
  
  # Trend detection using time series analysis
  def detect_trends(user_id, metric_id, date_range) do
    entries = get_metric_entries(user_id, metric_id, date_range)
    
    entries
    |> extract_time_series()
    |> apply_linear_regression()
    |> calculate_trend_strength()
  end
  
  # Pattern recognition for optimization insights
  def generate_insights(user_id) do
    Task.async_stream([
      &calculate_correlations/1,
      &detect_trends/1,
      &identify_patterns/1,
      &generate_recommendations/1
    ], fn analyzer -> analyzer.(user_id) end)
    |> Enum.to_list()
  end
end

# Real-time sync via Phoenix Channels
defmodule LifeXPWeb.UserChannel do
  use Phoenix.Channel
  
  def join("user:" <> user_id, _params, socket) do
    if authorized?(socket, user_id) do
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end
  
  def handle_in("new_entry", entry_params, socket) do
    case LifeXP.Data.create_entry(entry_params) do
      {:ok, entry} ->
        broadcast!(socket, "entry_created", entry)
        
        # Trigger real-time analytics update
        LifeXP.Analytics.Engine.refresh_insights(socket.assigns.user_id)
        
        {:reply, {:ok, entry}, socket}
      
      {:error, changeset} ->
        {:reply, {:error, changeset}, socket}
    end
  end
end
```

---

## **Analytics Processing Pipeline**

```elixir
defmodule LifeXP.Analytics.Pipeline do
  use Oban.Worker, queue: :analytics
  
  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id, "type" => "daily_insights"}}) do
    user_id
    |> LifeXP.Analytics.Engine.generate_insights()
    |> persist_insights()
    |> broadcast_updates()
    
    :ok
  end
  
  # Schedule daily analytics processing
  def schedule_daily_insights(user_id) do
    %{user_id: user_id, type: "daily_insights"}
    |> LifeXP.Analytics.Pipeline.new(schedule_in: {1, :hour})
    |> Oban.insert()
  end
end

# Complex correlation calculations
defmodule LifeXP.Analytics.Correlations do
  # Pearson correlation coefficient
  def pearson_correlation(x_values, y_values) do
    n = length(x_values)
    
    mean_x = Enum.sum(x_values) / n
    mean_y = Enum.sum(y_values) / n
    
    numerator = x_values
    |> Enum.zip(y_values)
    |> Enum.map(fn {x, y} -> (x - mean_x) * (y - mean_y) end)
    |> Enum.sum()
    
    denominator = :math.sqrt(
      variance(x_values, mean_x) * variance(y_values, mean_y)
    )
    
    if denominator == 0, do: 0, else: numerator / denominator
  end
  
  defp variance(values, mean) do
    values
    |> Enum.map(fn x -> :math.pow(x - mean, 2) end)
    |> Enum.sum()
  end
end
```

---

## **Data Export and Sync**

```elixir
defmodule LifeXP.Export do
  # CSV export for data portability
  def export_to_csv(user_id, date_range) do
    entries = get_user_entries(user_id, date_range)
    
    csv_data = entries
    |> Enum.map(&format_csv_row/1)
    |> CSV.encode()
    
    {:ok, csv_data}
  end
  
  # JSON export with full data structure
  def export_to_json(user_id) do
    %{
      user: get_user_profile(user_id),
      metrics: get_user_metrics(user_id),
      entries: get_user_entries(user_id),
      insights: get_user_insights(user_id)
    }
    |> Jason.encode!()
  end
  
  # Data import with validation
  def import_from_json(user_id, json_data) do
    with {:ok, data} <- Jason.decode(json_data),
         {:ok, _} <- validate_import_data(data),
         {:ok, _} <- create_metrics(user_id, data["metrics"]),
         {:ok, _} <- create_entries(user_id, data["entries"]) do
      {:ok, "Import completed successfully"}
    else
      error -> error
    end
  end
end
```

---

## **Deployment Strategy**

```bash
# Phoenix deployment to Fly.io
fly launch --name lifexp-dashboard-api
fly postgres create lifexp-db
fly redis create lifexp-redis # for Oban job processing
fly secrets set DATABASE_URL=postgresql://...
fly secrets set SECRET_KEY_BASE=...
fly deploy

# Environment variables
DATABASE_URL=postgresql://lifexp-db.internal:5432/lifexp
SECRET_KEY_BASE=your-secret-key-base
REDIS_URL=redis://lifexp-redis.internal:6379
PHX_HOST=lifexp-dashboard-api.fly.dev
```

---

## **Performance Features**

```elixir
# Caching for expensive analytics
defmodule LifeXP.Cache do
  use Nebulex.Cache,
    otp_app: :life_xp,
    adapter: Nebulex.Adapters.Local
    
  def get_or_compute_correlations(user_id, date_range) do
    cache_key = "correlations:#{user_id}:#{date_range_hash(date_range)}"
    
    get(cache_key) || 
      put_new(cache_key, compute_correlations(user_id, date_range), ttl: :timer.hours(6))
  end
end

# Background job processing with Oban
config :life_xp, Oban,
  repo: LifeXP.Repo,
  queues: [
    analytics: 10,     # Analytics processing
    exports: 5,        # Data exports
    notifications: 15  # User notifications
  ]
```

---

## **Development Timeline**

**Week 1**: Phoenix setup, user authentication, metric management
**Week 2**: Data entry APIs, real-time sync with Phoenix Channels
**Week 3**: Analytics engine, correlation calculations, trend detection
**Week 4**: Data export, caching, performance optimization, deployment

**Estimated Development**: 4-5 weeks to full launch