defmodule LifeXPWeb.AuthController do
  use LifeXPWeb, :controller

  alias LifeXP.Accounts
  alias LifeXP.Auth.Guardian

  action_fallback LifeXPWeb.FallbackController

  def register(conn, %{"user" => user_params}) do
    case Accounts.create_user(user_params) do
      {:ok, user} ->
        {:ok, token, _claims} = Guardian.encode_and_sign(user)
        
        conn
        |> put_status(:created)
        |> render(:user, %{user: user, token: token})

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, %{changeset: changeset})
    end
  end

  def login(conn, %{"user" => %{"email" => email, "password" => password}}) do
    case Accounts.authenticate_user(email, password) do
      {:ok, user} ->
        {:ok, token, _claims} = Guardian.encode_and_sign(user)
        
        conn
        |> put_status(:ok)
        |> render(:user, %{user: user, token: token})

      {:error, :invalid_credentials} ->
        conn
        |> put_status(:unauthorized)
        |> render(:error, %{message: "Invalid credentials"})
    end
  end

  def logout(conn, _params) do
    token = Guardian.Plug.current_token(conn)
    Guardian.revoke(token)
    
    conn
    |> put_status(:ok)
    |> render(:message, %{message: "Successfully logged out"})
  end

  def me(conn, _params) do
    user = Guardian.Plug.current_resource(conn)
    
    conn
    |> put_status(:ok)
    |> render(:user, %{user: user})
  end
end