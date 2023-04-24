const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

let db = null;
let dbPath = path.join(__dirname, "userData.db");

//Connecting to DB and starting the Server
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server started at http://localhost:3000/");
    });
  } catch (err) {
    console.log(`DB Error: ${err.message}`);
    process.exit(1);
  }
};

initializeDBandServer();

//API 1
app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  console.log(request.body);
  console.log(username);
  console.log(password);
  let hashedPassword = await bcrypt.hash(password, 10);
  console.log(hashedPassword);
  const selectUserQuery = `SELECT * FROM user
    WHERE username = '${username}';`;
  let dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    let passLength = password.length;
    if (passLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let createUserQuery = `INSERT INTO user
            (username,name, password,gender, location)
            VALUES
            ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2
app.post("/login", async (request, response) => {
  let { username, password } = request.body;
  let getUserQuery = `SELECT * FROM user
    WHERE username = '${username}';`;
  let dbUser = await db.get(getUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3
app.put("/change-password", async (request, response) => {
  let { username, oldPassword, newPassword } = request.body;
  let newHashPassword = await bcrypt.hash(newPassword, 10);
  let getUserQuery = `SELECT * FROM user
    WHERE username = '${username}';`;
  let dbUser = await db.get(getUserQuery);
  let isOldPassMatch = await bcrypt.compare(oldPassword, dbUser.password);
  if (isOldPassMatch === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let updateUserQuery = `UPDATE user
            SET password = '${newHashPassword}'
            WHERE username = '${username}';`;
      await db.run(updateUserQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
