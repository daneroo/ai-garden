defmodule ElixirOne.Library.Scanner do
  @moduledoc """
  Walks the audiobooks directory tree and returns file entries with both
  `:path` (for filtering/tooltips/actions) and `:basename` (precomputed name
  for display and for warning rows where a path might be missing). Keeping both
  avoids repeated `Path.basename/1` in the UI and keeps warning entries readable.
  """

  alias ElixirOne.Library.Prober

  @allowed_extensions [".m4b", ".mp3", ".m4a"]

  def scan(nil),
    do: [%{type: :warning, path: "", basename: "", error: "AUDIOBOOKS_ROOT_DIR not set"}]

  def scan(""),
    do: [%{type: :warning, path: "", basename: "", error: "AUDIOBOOKS_ROOT_DIR not set"}]

  def scan(root) do
    root
    |> traverse()
    |> Enum.sort_by(fn entry ->
      if entry.type == :file do
        entry.path
      else
        "~#{entry.path}"
      end
    end)
  end

  @doc """
  Enriches the given entries using `ffprobe` and returns a Stream of results.
  This allows the caller to process each result as it becomes available.
  """
  def enrich_stream(entries) do
    # Only probe valid files, skip warnings
    files_to_probe = Enum.filter(entries, &(&1.type == :file))

    files_to_probe
    |> Task.async_stream(
      fn entry ->
        case Prober.probe(entry.path) do
          {:ok, metadata} -> Map.merge(entry, metadata)
          {:error, _} -> entry
        end
      end,
      # Don't kill the machine, but be fast
      max_concurrency: System.schedulers_online() * 2,
      timeout: 60_000,
      ordered: false
    )
    |> Stream.map(fn {:ok, entry} -> entry end)
  end

  @doc """
  Enriches the given entries with metadata using `ffprobe` (Blocking/Batch).
  Returns the full list once complete.
  """
  def enrich(entries) do
    other_entries = Enum.reject(entries, &(&1.type == :file))
    enriched_files = enrich_stream(entries) |> Enum.to_list()

    (other_entries ++ enriched_files) |> Enum.sort_by(& &1.path)
  end

  defp traverse(path) do
    case File.ls(path) do
      {:ok, entries} ->
        entries
        |> Enum.flat_map(fn entry ->
          entry_path = Path.join(path, entry)

          case File.lstat(entry_path) do
            {:ok, %{type: :symlink}} ->
              [warning_entry(entry_path, "symlink skipped")]

            {:ok, %{type: :directory}} ->
              traverse(entry_path)

            {:ok, %{type: :regular} = stat} ->
              if allowed_extension?(entry_path) do
                [
                  %{
                    type: :file,
                    basename: entry,
                    path: entry_path,
                    size: format_size(stat.size),
                    mtime: format_mtime(stat.mtime)
                  }
                ]
              else
                []
              end

            {:ok, %{type: other}} ->
              [warning_entry(entry_path, "unsupported type #{other}")]

            {:error, reason} ->
              [warning_entry(entry_path, format_error(reason))]
          end
        end)

      {:error, reason} ->
        [warning_entry(path, format_error(reason))]
    end
  end

  defp warning_entry(path, error) do
    %{
      type: :warning,
      path: path,
      basename: Path.basename(path),
      error: error
    }
  end

  defp format_mtime(%NaiveDateTime{} = mtime), do: format_naive_mtime(mtime)
  defp format_mtime(%DateTime{} = mtime), do: format_naive_mtime(DateTime.to_naive(mtime))

  defp format_mtime({{year, month, day}, {hour, minute, second}})
       when is_integer(year) and is_integer(month) and is_integer(day) and is_integer(hour) and
              is_integer(minute) and is_integer(second) do
    case NaiveDateTime.new(year, month, day, hour, minute, second) do
      {:ok, naive} -> format_naive_mtime(naive)
      _ -> inspect({{year, month, day}, {hour, minute, second}})
    end
  end

  defp format_mtime(mtime), do: inspect(mtime)

  defp format_naive_mtime(%NaiveDateTime{} = mtime) do
    Calendar.strftime(mtime, "%Y-%m-%d %H:%M:%S")
  end

  defp allowed_extension?(path) do
    path
    |> Path.extname()
    |> String.downcase()
    |> then(&(&1 in @allowed_extensions))
  end

  defp format_size(bytes) when is_integer(bytes) and bytes >= 0 do
    units = ["B", "KB", "MB", "GB", "TB"]
    {value, unit} = scale_size(bytes, units)

    formatted =
      if unit == "B" do
        Integer.to_string(value)
      else
        :erlang.float_to_binary(value, decimals: 1)
      end

    formatted <> " " <> unit
  end

  defp scale_size(bytes, [unit]) do
    {bytes, unit}
  end

  defp scale_size(bytes, [unit | _rest]) when bytes < 1000 do
    {bytes, unit}
  end

  defp scale_size(bytes, [_unit | rest]) do
    scale_size(bytes / 1000, rest)
  end

  defp format_error(reason) when is_atom(reason), do: Atom.to_string(reason)
  defp format_error(reason), do: inspect(reason)
end
