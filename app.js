const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
  }
};

intializeDbAndServer();

//Register User API
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const selectUserQuery = `
    SELECT *
    FROM user
    WHERE username = '${username}'`;

  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const addUserQuery = `
            INSERT INTO user
            (username, name, password, gender, location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`;
      await db.run(addUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//Login User API
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT *
    FROM user
    WHERE username = '${username}'`;

  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//Update Password API
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `
    SELECT *
    FROM user
    WHERE username = '${username}'`;

  const dbUser = await db.get(selectUserQuery);
  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
  if (isPasswordMatched) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `
            UPDATE user
            SET password = '${hashedPassword}'
            WHERE username = '${username}'`;

      await db.run(updatePasswordQuery);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
