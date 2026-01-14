defmodule ElixirOne.Library.Scanner do
  @moduledoc false

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
              [
                %{
                  type: :file,
                  basename: entry,
                  path: entry_path,
                  size: format_size(stat.size),
                  mtime: format_mtime(stat.mtime)
                }
              ]

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

  defp format_mtime(%NaiveDateTime{} = mtime), do: NaiveDateTime.to_iso8601(mtime)
  defp format_mtime(%DateTime{} = mtime), do: DateTime.to_iso8601(mtime)
  defp format_mtime(mtime), do: inspect(mtime)

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

  defp scale_size(bytes, [unit | _rest]) when bytes < 1024 do
    {bytes, unit}
  end

  defp scale_size(bytes, [_unit | rest]) do
    scale_size(bytes / 1024, rest)
  end

  defp format_error(reason) when is_atom(reason), do: Atom.to_string(reason)
  defp format_error(reason), do: inspect(reason)
end
