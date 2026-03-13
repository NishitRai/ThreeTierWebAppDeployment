db = db.getSiblingDB("appdb");

db.createUser({
  user: "appuser",
  pwd: "apppass",
  roles: [
    { role: "readWrite", db: "appdb" }
  ]
});