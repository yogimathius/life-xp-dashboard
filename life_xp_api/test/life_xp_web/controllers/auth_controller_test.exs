defmodule LifeXPWeb.AuthControllerTest do
  use LifeXPWeb.ConnCase

  alias LifeXP.Accounts
  alias LifeXP.Auth.Guardian

  @create_attrs %{
    email: "test@example.com",
    password: "password123",
    timezone: "UTC",
    preferences: %{}
  }
  
  @invalid_attrs %{email: "invalid", password: "123"}

  def fixture(:user) do
    {:ok, user} = Accounts.create_user(@create_attrs)
    user
  end

  describe "register" do
    test "renders user and token when data is valid", %{conn: conn} do
      conn = post(conn, ~p"/api/register", user: @create_attrs)
      
      assert %{"data" => data} = json_response(conn, 201)
      assert %{"user" => user, "token" => token} = data
      assert user["email"] == "test@example.com"
      assert user["timezone"] == "UTC"
      assert is_binary(token)
    end

    test "renders errors when data is invalid", %{conn: conn} do
      conn = post(conn, ~p"/api/register", user: @invalid_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end

    test "renders error when email already exists", %{conn: conn} do
      fixture(:user)
      conn = post(conn, ~p"/api/register", user: @create_attrs)
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "login" do
    setup [:create_user]

    test "renders user and token when credentials are valid", %{conn: conn, user: user} do
      login_attrs = %{email: user.email, password: "password123"}
      conn = post(conn, ~p"/api/login", user: login_attrs)
      
      assert %{"data" => data} = json_response(conn, 200)
      assert %{"user" => returned_user, "token" => token} = data
      assert returned_user["id"] == user.id
      assert returned_user["email"] == user.email
      assert is_binary(token)
    end

    test "renders error when password is invalid", %{conn: conn, user: user} do
      login_attrs = %{email: user.email, password: "wrongpassword"}
      conn = post(conn, ~p"/api/login", user: login_attrs)
      
      assert %{"error" => "Invalid credentials"} = json_response(conn, 401)
    end

    test "renders error when email doesn't exist", %{conn: conn} do
      login_attrs = %{email: "nonexistent@example.com", password: "password123"}
      conn = post(conn, ~p"/api/login", user: login_attrs)
      
      assert %{"error" => "Invalid credentials"} = json_response(conn, 401)
    end
  end

  describe "me" do
    setup [:create_user, :authenticate_user]

    test "renders current user when authenticated", %{conn: conn, user: user} do
      conn = get(conn, ~p"/api/me")
      
      assert %{"data" => returned_user} = json_response(conn, 200)
      assert returned_user["id"] == user.id
      assert returned_user["email"] == user.email
    end
  end

  describe "logout" do
    setup [:create_user, :authenticate_user]

    test "returns success message", %{conn: conn} do
      conn = post(conn, ~p"/api/logout")
      
      assert %{"message" => "Successfully logged out"} = json_response(conn, 200)
    end
  end

  describe "unauthenticated requests" do
    test "returns 401 for protected routes", %{conn: conn} do
      conn = get(conn, ~p"/api/me")
      assert json_response(conn, 401)
    end
  end

  defp create_user(_) do
    user = fixture(:user)
    %{user: user}
  end

  defp authenticate_user(%{conn: conn, user: user}) do
    {:ok, token, _claims} = Guardian.encode_and_sign(user)
    conn = put_req_header(conn, "authorization", "Bearer #{token}")
    %{conn: conn, token: token}
  end
end