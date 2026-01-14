defmodule ElixirOneWeb.PageController do
  use ElixirOneWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end
end
