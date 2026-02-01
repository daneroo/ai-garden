defmodule ElixirOneWeb.BooksLive do
  use ElixirOneWeb, :live_view

  def mount(_params, _session, socket) do
    if connected?(socket) do
      Phoenix.PubSub.subscribe(ElixirOne.PubSub, "library")
    end

    %{entries: entries, elapsed_s: elapsed_s} = load_state()
    filter = ""

    {:ok,
     socket
     |> assign(:entries, entries)
     |> assign(:elapsed_s, elapsed_s)
     |> assign(:filter, filter)
     |> assign(:filtered_entries, apply_filter(entries, filter))
     |> assign(:total_count, length(entries))
     |> assign(:filtered_count, length(entries))
     |> assign(:form, to_form(%{"filter" => filter}))}
  end

  # PubSub Handlers

  def handle_info({:library_reset, entries, elapsed_s}, socket) do
    filter = socket.assigns.filter
    filtered = apply_filter(entries, filter)

    {:noreply,
     socket
     |> assign(:entries, entries)
     |> assign(:elapsed_s, elapsed_s)
     |> assign(:filtered_entries, filtered)
     |> assign(:total_count, length(entries))
     |> assign(:filtered_count, length(filtered))}
  end

  def handle_info({:progress_update, elapsed_s}, socket) do
    # Fetch fresh data from Server (batched every 10 entries)
    %{entries: entries} = load_state()
    filter = socket.assigns.filter
    filtered = apply_filter(entries, filter)

    {:noreply,
     socket
     |> assign(:entries, entries)
     |> assign(:elapsed_s, elapsed_s)
     |> assign(:filtered_entries, filtered)}
  end

  def handle_info({:scan_complete, elapsed_s}, socket) do
    # Fetch final data
    %{entries: entries} = load_state()
    filter = socket.assigns.filter
    filtered = apply_filter(entries, filter)

    {:noreply,
     socket
     |> assign(:entries, entries)
     |> assign(:elapsed_s, elapsed_s)
     |> assign(:filtered_entries, filtered)}
  end

  # Event Handlers

  def handle_event("filter", %{"filter" => filter}, socket) do
    entries = socket.assigns.entries
    filtered_entries = apply_filter(entries, filter)

    {:noreply,
     socket
     |> assign(:filter, filter)
     |> assign(:filtered_entries, filtered_entries)
     |> assign(:filtered_count, length(filtered_entries))
     |> assign(:form, to_form(%{"filter" => filter}))}
  end

  def handle_event("global_reset", _params, socket) do
    GenServer.cast(ElixirOne.Library.Server, :reset)
    {:noreply, socket}
  end

  # Private Helpers

  defp load_state do
    ElixirOne.Library.Server.get_entries()
  end

  defp apply_filter(entries, filter) when filter in [nil, ""], do: entries

  defp apply_filter(entries, filter) do
    needle = String.downcase(filter)

    Enum.filter(entries, fn entry ->
      haystack =
        entry
        |> Map.get(:path, "")
        |> String.downcase()

      String.contains?(haystack, needle)
    end)
  end

  defp format_duration(seconds) when is_number(seconds) do
    total_seconds = trunc(seconds)
    hours = div(total_seconds, 3600)
    minutes = div(rem(total_seconds, 3600), 60)
    "#{hours}h #{minutes}m"
  end

  defp format_duration(_), do: "-"
end
