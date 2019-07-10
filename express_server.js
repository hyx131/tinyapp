const PORT = 8080;
const express = require("express");
const app = express();
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());



const generateRandomString = function(length) {
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let output = "";
  for (let i = 0; i < length; i++) {
    output += characters[Math.floor(Math.random() * characters.length)];
  }
  return output;
};

const generateUsers = function(email, password) {
  let id = generateRandomString(9);
  let userInfo = {
    id: id,
    email: email,
    password: password
  }
  return userInfo;
};

const emailLookup = function(obj, emailAdress) {
  let ids = Object.values(obj);
  for (let user of ids) {
    if (user.email === emailAdress) {
      return true;
    }
  }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  },
  "zvuKv9vDx": {
    id: "zvuKv9vDx",
    email: "some@email.com"
  }
};




const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  // res.send("<html><body>Hello <b>World</b></body></html>\n");
  res.render("hello_world", {greeting: "hello world!"});
});

app.post("/login", (req, res) => {
  res.cookie("user_id", req.cookies["user_id"]);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  let templateVars = { 
    urls: urlDatabase, 
    user: users[req.cookies["user_id"]]};
  res.render("urls_Index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {  
    user: users[req.cookies["user_id"]]};
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { 
    user: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let sURL = generateRandomString(6);
  urlDatabase[sURL] = req.body.longURL;
  res.redirect(`/urls/${sURL}`);
})

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(`http://${longURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL", (req, res) => {
  let sURL = req.params.shortURL;
  urlDatabase[sURL] = req.body.longURL;
  res.redirect("/urls");
});



app.get("/register", (req, res) => {
  let templateVars = {
    user: req.cookies["user_id"],
  }
  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send("<h2 style='color: gray'>Invalid email or password!</h2>");
  } else if (emailLookup(users, email)) {
    res.status(400).send("<h2 style='color: gray'>This email has already been used!</h2>")
  } else {
    let newUser = generateUsers(email, password);
    users[newUser.id] = newUser;
    res.cookie("user_id", newUser.id);
  }
  res.redirect("/urls");
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
