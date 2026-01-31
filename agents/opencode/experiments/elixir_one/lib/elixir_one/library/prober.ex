defmodule ElixirOne.Library.Prober do
  @moduledoc """
  Extracts metadata from media files using `ffprobe`.
  """

  @doc """
  Probes the given file path and returns metadata.
  """
  def probe(path) do
    # -v quiet: Suppress banner and info headers
    # -show_format: Show container info (duration, bitrate, tags)
    # -show_streams: Show stream info (codec)
    # -of json: Output as JSON
    args = ~w(-v quiet -show_format -show_streams -of json) ++ [path]

    case System.cmd("ffprobe", args, stderr_to_stdout: true) do
      {output, 0} ->
        parse_output(output)

      {error_output, _exit_code} ->
        {:error, error_output}
    end
  rescue
    e in ErlangError ->
      if e.original == :enoent do
        {:error, "ffprobe executable not found in PATH"}
      else
        {:error, inspect(e)}
      end
  end

  defp parse_output(json) do
    case Jason.decode(json) do
      {:ok, data} ->
        format = Map.get(data, "format", %{})
        streams = Map.get(data, "streams", [])
        tags = Map.get(format, "tags", %{})

        audio_stream =
          Enum.find(streams, %{}, fn s -> Map.get(s, "codec_type") == "audio" end)

        metadata = %{
          duration: parse_float(Map.get(format, "duration")),
          bit_rate_bps: parse_int(Map.get(format, "bit_rate")),
          codec_name: Map.get(audio_stream, "codec_name", "unknown"),
          title: Map.get(tags, "title") || Map.get(tags, "album"),
          author: Map.get(tags, "artist") || Map.get(tags, "album_artist"),
          series: Map.get(tags, "SERIES") || Map.get(tags, "series") || Map.get(tags, "grouping"),
          series_part: Map.get(tags, "PART") || Map.get(tags, "series-part")
        }

        {:ok, metadata}

      {:error, _} ->
        {:error, "failed to parse ffprobe json output"}
    end
  end

  defp parse_float(nil), do: 0.0
  defp parse_float(str) when is_binary(str), do: String.to_float(str) |> round_float()
  defp parse_float(num) when is_float(num), do: num
  defp parse_float(_), do: 0.0

  defp round_float(f), do: Float.round(f, 2)

  defp parse_int(nil), do: 0
  defp parse_int(str) when is_binary(str), do: String.to_integer(str)
  defp parse_int(num) when is_integer(num), do: num
  defp parse_int(_), do: 0
end
