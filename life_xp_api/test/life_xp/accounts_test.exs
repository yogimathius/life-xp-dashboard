defmodule LifeXP.AccountsTest do
  use LifeXP.DataCase

  alias LifeXP.Accounts
  alias LifeXP.Accounts.User

  describe "users" do
    @valid_attrs %{
      email: "test@example.com",
      password: "password123",
      timezone: "UTC",
      preferences: %{}
    }
    @update_attrs %{
      email: "updated@example.com",
      timezone: "America/New_York",
      preferences: %{"theme" => "dark"}
    }
    @invalid_attrs %{email: nil, password: nil, timezone: nil}

    def user_fixture(attrs \\ %{}) do
      {:ok, user} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Accounts.create_user()

      user
    end

    test "list_users/0 returns all users" do
      user = user_fixture()
      assert Accounts.list_users() == [user]
    end

    test "get_user!/1 returns the user with given id" do
      user = user_fixture()
      assert Accounts.get_user!(user.id) == user
    end

    test "get_user_by_email/1 returns the user with given email" do
      user = user_fixture()
      assert Accounts.get_user_by_email(user.email) == user
    end

    test "create_user/1 with valid data creates a user" do
      assert {:ok, %User{} = user} = Accounts.create_user(@valid_attrs)
      assert user.email == "test@example.com"
      assert user.timezone == "UTC"
      assert user.preferences == %{}
      assert Bcrypt.verify_pass("password123", user.password_hash)
    end

    test "create_user/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Accounts.create_user(@invalid_attrs)
    end

    test "create_user/1 with duplicate email returns error changeset" do
      user_fixture()
      assert {:error, %Ecto.Changeset{}} = Accounts.create_user(@valid_attrs)
    end

    test "update_user/2 with valid data updates the user" do
      user = user_fixture()
      assert {:ok, %User{} = user} = Accounts.update_user(user, @update_attrs)
      assert user.email == "updated@example.com"
      assert user.timezone == "America/New_York"
      assert user.preferences == %{"theme" => "dark"}
    end

    test "update_user/2 with invalid data returns error changeset" do
      user = user_fixture()
      assert {:error, %Ecto.Changeset{}} = Accounts.update_user(user, @invalid_attrs)
      assert user == Accounts.get_user!(user.id)
    end

    test "delete_user/1 deletes the user" do
      user = user_fixture()
      assert {:ok, %User{}} = Accounts.delete_user(user)
      assert_raise Ecto.NoResultsError, fn -> Accounts.get_user!(user.id) end
    end

    test "change_user/1 returns a user changeset" do
      user = user_fixture()
      assert %Ecto.Changeset{} = Accounts.change_user(user)
    end

    test "authenticate_user/2 with valid credentials returns user" do
      user = user_fixture()
      assert {:ok, authenticated_user} = Accounts.authenticate_user(user.email, "password123")
      assert authenticated_user.id == user.id
    end

    test "authenticate_user/2 with invalid password returns error" do
      user = user_fixture()
      assert {:error, :invalid_credentials} = Accounts.authenticate_user(user.email, "wrongpassword")
    end

    test "authenticate_user/2 with non-existent email returns error" do
      assert {:error, :invalid_credentials} = Accounts.authenticate_user("nonexistent@example.com", "password123")
    end
  end
end