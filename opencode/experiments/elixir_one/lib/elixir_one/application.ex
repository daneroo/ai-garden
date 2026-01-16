defmodule ElixirOne.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      ElixirOne.Repo,
      ElixirOneWeb.Telemetry,
      {DNSCluster, query: Application.get_env(:elixir_one, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: ElixirOne.PubSub},
      ElixirOne.Library.Server,
      # Start a worker by calling: ElixirOne.Worker.start_link(arg)
      # {ElixirOne.Worker, arg},
      # Start to serve requests, typically the last entry
      ElixirOneWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: ElixirOne.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    ElixirOneWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
