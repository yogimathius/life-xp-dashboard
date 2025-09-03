defmodule LifeXPWeb.AuthJSON do
  alias LifeXP.Accounts.User

  @doc """
  Renders a user with or without token.
  """
  def user(%{user: user, token: token}) do
    %{
      data: %{
        user: data(user),
        token: token
      }
    }
  end

  def user(%{user: user}) do
    %{data: data(user)}
  end

  @doc """
  Renders a message.
  """
  def message(%{message: message}) do
    %{message: message}
  end

  @doc """
  Renders errors.
  """
  def error(%{changeset: changeset}) do
    %{errors: translate_errors(changeset)}
  end

  def error(%{message: message}) do
    %{error: message}
  end

  defp data(%User{} = user) do
    %{
      id: user.id,
      email: user.email,
      timezone: user.timezone,
      preferences: user.preferences,
      inserted_at: user.inserted_at,
      updated_at: user.updated_at
    }
  end

  defp translate_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, &translate_error/1)
  end

  defp translate_error({msg, opts}) do
    Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
      opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
    end)
  end
end