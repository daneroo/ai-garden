defmodule ElixirOne.Library.Server do
  use GenServer

  alias ElixirOne.Library.Scanner

  # Client API

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  def get_entries do
    GenServer.call(__MODULE__, :get_entries)
  end

  # Server Callbacks

  @impl true
  def init(_state) do
    send(self(), :load)
    {:ok, initial_state()}
  end

  @impl true
  def handle_call(:get_entries, _from, state) do
    # Include computed elapsed_s in the response for mount
    elapsed_s = compute_elapsed_s(state)
    {:reply, %{entries: state.entries, elapsed_s: elapsed_s, status: state.status}, state}
  end

  @impl true
  def handle_cast(:reset, _state) do
    send(self(), :load)
    {:noreply, initial_state()}
  end

  @impl true
  def handle_info(:load, _state) do
    root = Application.get_env(:elixir_one, :audiobooks_root_dir)
    start_time = System.monotonic_time(:millisecond)

    # 1. Fast Scan
    raw_entries = Scanner.scan(root)

    new_state = %{
      entries: raw_entries,
      status: :enriching,
      start_time: start_time,
      end_time: nil
    }

    # Broadcast reset with elapsed_s = 0
    Phoenix.PubSub.broadcast(ElixirOne.PubSub, "library", {:library_reset, raw_entries, 0})

    # 2. Kick off streaming enrichment with elapsed_s in each broadcast
    server_pid = self()

    Task.start(fn ->
      Scanner.enrich_stream(raw_entries)
      |> Stream.with_index(1)
      |> Enum.each(fn {enriched_entry, index} ->
        # Always update server state
        send(server_pid, {:update_entry, enriched_entry})

        # Only broadcast to browser every 10 entries (reduces UI load by ~90%)
        if rem(index, 10) == 0 do
          elapsed_s = div(System.monotonic_time(:millisecond) - start_time, 1000)

          Phoenix.PubSub.broadcast(
            ElixirOne.PubSub,
            "library",
            {:progress_update, elapsed_s}
          )
        end
      end)

      send(server_pid, :enrich_complete)
    end)

    {:noreply, new_state}
  end

  @impl true
  def handle_info(:enrich_complete, state) do
    end_time = System.monotonic_time(:millisecond)
    elapsed_s = div(end_time - state.start_time, 1000)

    new_state = %{state | status: :ready, end_time: end_time}

    Phoenix.PubSub.broadcast(ElixirOne.PubSub, "library", {:scan_complete, elapsed_s})
    {:noreply, new_state}
  end

  @impl true
  def handle_info({:update_entry, enriched_entry}, state) do
    new_entries =
      Enum.map(state.entries, fn entry ->
        if entry.path == enriched_entry.path, do: enriched_entry, else: entry
      end)

    {:noreply, %{state | entries: new_entries}}
  end

  # Helpers

  defp initial_state do
    %{entries: [], status: :loading, start_time: nil, end_time: nil}
  end

  defp compute_elapsed_s(%{start_time: nil}), do: 0

  defp compute_elapsed_s(%{start_time: start, end_time: nil}) do
    div(System.monotonic_time(:millisecond) - start, 1000)
  end

  defp compute_elapsed_s(%{start_time: start, end_time: end_time}) do
    div(end_time - start, 1000)
  end
end
