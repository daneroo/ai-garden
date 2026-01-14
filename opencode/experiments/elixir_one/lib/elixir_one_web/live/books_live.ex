defmodule ElixirOneWeb.BooksLive do
  use ElixirOneWeb, :live_view

  alias ElixirOne.Library.Scanner

  def mount(_params, _session, socket) do
    entries = load_entries()
    filter = ""

    {:ok,
     socket
     |> assign(:entries, entries)
     |> assign(:filter, filter)
     |> assign(:filtered_entries, apply_filter(entries, filter))
     |> assign(:form, to_form(%{"filter" => filter}))}
  end

  def handle_event("filter", %{"filter" => filter}, socket) do
    entries = socket.assigns.entries

    {:noreply,
     socket
     |> assign(:filter, filter)
     |> assign(:filtered_entries, apply_filter(entries, filter))
     |> assign(:form, to_form(%{"filter" => filter}))}
  end

  defp load_entries do
    root = Application.get_env(:elixir_one, :audiobooks_root_dir)
    Scanner.scan(root)
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
end
