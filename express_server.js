const PORT = 8080;
const express = require("express");
const app = express();
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const bcrypt = require('bcrypt');


const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: ""},
  "9sm5xK": {longURL: "http://www.google.com", userID: ""}
};

const users = {
  "BCvho9y8L": 
   { id: 'BCvho9y8L',
     email: 'selin.hyx@gmail.com',
     password: '$2b$10$Eoa8eix2Vz2cUrJGW3ebzOzOE9YCctp6pov.STGYnqT.Fqm5V3hUy' } 
};


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
    password: bcrypt.hashSync(password, 10)
  }
  return userInfo;
};

const emailLookup = function(obj, emailAdress) {
  let ids = Object.values(obj);
  for (let user of ids) {
    if (user.email === emailAdress) {
      return user.id;
    } 
  }
  return false;
};

const urlsForUser = function(id) {
  let matched = {};
  for (let keys in urlDatabase) {
    if (urlDatabase[keys].userID === id) {
      matched[keys] = urlDatabase[keys];
    }
  }
  return matched;
};





// home page & experimenting how express works:

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



// /login & /logout:

app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id]
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!emailLookup(users, email)) {
    res.status(403).send("<h2 style='color: gray'>Invalid email!</h2>");
  } else if (!bcrypt.compareSync(password, users[emailLookup(users, email)].password)) {
    res.status(403).send("<h2 style='color: gray'>Invalid password!</h2>")
  } else {
  res.cookie("user_id", emailLookup(users, email));
  }
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});



// /ulrs:

app.get("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    res.send("You're not logged in yet! Please login or register an account to modify urls!");
  } else {
    let userDatabase = urlsForUser(req.cookies.user_id);
    let templateVars = { 
      urls: userDatabase, 
      user: users[req.cookies["user_id"]]
    };
    res.render("urls_Index", templateVars);
  }
});

app.post("/urls", (req, res) => {
  let sURL = generateRandomString(6);
  urlDatabase[sURL] = { longURL: req.body.longURL, userID: req.cookies.user_id };
  res.redirect(`/urls/${sURL}`);
});



// urls/extensions:

app.get("/urls/new", (req, res) => {
  let templateVars = {  
    user: users[req.cookies["user_id"]]
  };
  if (!req.cookies.user_id) {
    res.render("login", templateVars);
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let sURL = req.params.shortURL;
  let userDatabase = urlsForUser(req.cookies.user_id);
  if (!req.cookies.user_id) {
    res.send("You're not logged in yet! Please login or register an account to modify urls!");
  } else if (!userDatabase[sURL]) {
    res.send("You don't have access to this url!");
  } else {
    let templateVars = { 
      user: users[req.cookies["user_id"]],
      shortURL: req.params.shortURL, 
      longURL: userDatabase[req.params.shortURL].longURL
    };
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:shortURL", (req, res) => { // reminder: this is the code block for editing the long urls
  let userDatabase = urlsForUser(req.cookies.user_id);
  let sURL = req.params.shortURL;
  if (!req.cookies.user_id) {
    res.send("Cannot edit url!");
  } else {
    userDatabase[sURL].longURL = req.body.longURL;
  }
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(`http://${longURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let userDatabase = urlsForUser(req.cookies.user_id);
  if (!req.cookies.user_id) {
    res.send("Cannot delete url!");
  } else {
    delete userDatabase[req.params.shortURL];
 }
  res.redirect(`/urls`);
});



// /register:

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
  console.log(users);
  res.redirect("/urls");
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
