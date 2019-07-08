const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (request, response) => {
  response.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  // res.send("<html><body>Hello <b>World</b></body></html>\n");
  res.render("hello_world", {greeting: "hello world!"});
});

app.get("/urls", (req, res) => {
  res.render("urls_Index", { urls: urlDatabase });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});