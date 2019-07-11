const emailLookup = function(database, emailAdress) {
  let ids = Object.values(database);
  for (let user of ids) {
    if (user.email === emailAdress) {
      return user.id;
    } 
  }
  return undefined;
};

module.exports = { emailLookup };