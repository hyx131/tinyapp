const express = require("express");
const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");


function generateRandomString(length) {
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let output = "";
  for (let i = 0; i < length; i++) {
    output += characters[Math.floor(Math.random() * characters.length)];
  }
  return output;
}
// console.log(generateRandomString(6));


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

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let sURL = generateRandomString(6);
  urlDatabase[sURL] = req.body.longURL;
  // console.log(urlDatabase);
  res.redirect(`/urls/${sURL}`);
})

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(`http://${longURL}`);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});


