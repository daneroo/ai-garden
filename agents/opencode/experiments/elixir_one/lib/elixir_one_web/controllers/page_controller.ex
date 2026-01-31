defmodule ElixirOneWeb.PageController do
  use ElixirOneWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end

  def logo(conn, _params) do
    render(conn, :logo)
  end
end
