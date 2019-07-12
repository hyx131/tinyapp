const PORT = 8080;
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['totoro']
}));
app.use(methodOverride('_method'));


/* ------------------------------- global constants and helper functions ------------------------------ */

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "", time: ""},
  "9sm5xK": {longURL: "http://www.google.com", userID: "", time: ""}
};


const users = {
  "BCvho9y8L": 
   { id: 'BCvho9y8L',
     email: 'totoro@email.com',
     password: '$2b$10$Eoa8eix2Vz2cUrJGW3ebzOzOE9YCctp6pov.STGYnqT.Fqm5V3hUy' } 
};


const { emailLookup } = require("./helper");
const { generateRandomString } = require('./helper');
const { generateUsers } = require('./helper');


// function to extract user's urls from the urlDatabase:
const urlsForUser = function(id) {
  let matched = {};
  for (let keys in urlDatabase) {
    if (urlDatabase[keys].userID === id) {
      matched[keys] = urlDatabase[keys];
    }
  }
  return matched;
};


// object to keep count of the short url visitors
const urlVisitors = {
};


// function to generate short url visitors and the time of their visit
const generateViewers = function(id) {
  let userInfo = {
    id: id,
    time: new Date()
  }
  return userInfo;
};


// function to ckeck if a user has already been counted toward the unique visitors count
const checkVisitorCookie = function (id, visitorDatabase) {
  let ids = Object.values(visitorDatabase);
  for (let user of ids) {
    if (user.id === id) {
      return true;
    }
  }
  return false;
};



/* ------------------------------- hello & home page ------------------------------ */

app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});


app.get("/hello", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render("hello_world", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});



/* ------------------------------- login & logout ------------------------------ */

app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
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
    req.session.user_id = emailLookup(users, email);
  }
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session["user_id"] = null;
  res.redirect("/urls");
});




/* ------------------------------- urls index page ------------------------------ */

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.send("You're not logged in yet! Please login or register an account to modify urls!");
  } else {
    let userDatabase = urlsForUser(req.session.user_id);
    let templateVars = { 
      urls: userDatabase, 
      user: users[req.session.user_id]
    };
    res.render("urls_Index", templateVars);
  }
});


app.post("/urls", (req, res) => {
  let sURL = generateRandomString(6);
  urlDatabase[sURL] = { 
    longURL: req.body.longURL, 
    userID: req.session.user_id, 
    time: new Date(),
    totalVisit: 0,
    uniqueVisit: 0
  };
  res.redirect(`/urls/${sURL}`);
});



/* ------------------------------- urls & extensions ------------------------------ */

app.get("/urls/new", (req, res) => {
  let templateVars = {  
    user: users[req.session.user_id],
  };
  if (!req.session.user_id) {
    res.render("login", templateVars);
  } else {
    res.render("urls_new", templateVars);
  }
});


app.get("/urls/:shortURL", (req, res) => {
  let sURL = req.params.shortURL;
  let userDatabase = urlsForUser(req.session.user_id);
  if (!req.session.user_id) {
    res.send("You're not logged in yet! Please login or register an account to modify urls!");
  } else if (!userDatabase[sURL]) {
    res.send("You don't have access to this url!");
  } else {
    let templateVars = { 
      urlDatabase: urlDatabase,
      urlVisitors: urlVisitors,
      user: users[req.session.user_id],
      shortURL: req.params.shortURL, 
      longURL: userDatabase[req.params.shortURL].longURL
    };
    res.render("urls_show", templateVars);
  }
});


app.post("/urls/:shortURL", (req, res) => { // reminder: this is the code block for editing the long urls
  let userDatabase = urlsForUser(req.session.user_id);
  let sURL = req.params.shortURL;
  if (!req.session.user_id) {
    res.send("Cannot edit url!");
  } else {
    userDatabase[sURL].longURL = req.body.longURL;
  }
  res.redirect("/urls");
});


// this route redirects to long URL site by clicking on the generated short URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;

  if (!req.session.user_id) {
    if (!req.session.guest_id) {
      req.session.guest_id = generateRandomString(9);
      let visitor = generateViewers(req.session.guest_id); // creates visitor profile such that list of visitors with time stamp will appear on urls_show page
      urlDatabase[req.params.shortURL].uniqueVisit++;
      urlVisitors[visitor.id] = visitor;
    } else {
      let visitor = generateViewers(req.session.guest_id);
      urlVisitors[visitor.id] = visitor;
    }
  } else {
    let visitor = generateViewers(req.session.user_id);
    if (!checkVisitorCookie(req.session.user_id, urlVisitors)) { //checks the urlVisitors history to makesure user only counts towards unique visitor once
      urlDatabase[req.params.shortURL].uniqueVisit++;
      urlVisitors[visitor.id] = visitor;
    } else {
      let visitor = generateViewers(req.session.user_id);
      urlVisitors[visitor.id] = visitor;
   }
  }  
  urlDatabase[req.params.shortURL].totalVisit++;
  res.redirect(`http://${longURL}`);
});
    

app.delete("/urls/:shortURL", (req, res) => {
  let userDatabase = urlsForUser(req.session.user_id);

  if(userDatabase) {
    if (!req.session.user_id) {
      res.send("Cannot delete url!");
    } else {
      delete urlDatabase[req.params.shortURL];
    }
  }
  res.redirect("/urls");
});



/* ------------------------------- register ------------------------------ */

app.get("/register", (req, res) => {
  let templateVars = {
    user: req.session.user_id,
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
    req.session.user_id = newUser.id;
  }
  console.log(users);
  res.redirect("/urls");
});





app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});