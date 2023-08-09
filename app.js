const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format } = require("date-fns");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const camelCase = (obj) => {
  var newObj = {};
  for (d in obj) {
    if (obj.hasOwnProperty(d)) {
      newObj[
        d.replace(/(\_\w)/g, function (k) {
          return k[1].toUpperCase();
        })
      ] = obj[d];
    }
  }
  return newObj;
};
const initialize = async (request, response) => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  app.listen(3000, () => {
    console.log("Server is running at http://localhost:3000/");
  });
};
initialize();
const nowDate = new Date();
const scenarios = (request, response, next) => {
  try {
    const {
      category = "",
      priority = "",
      status = "",
      date = "",
    } = request.query;
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    if (categoryArray.includes(category) && category !== "") {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (priorityArray.includes(priority) && priority !== "") {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (statusArray.includes(status) && status !== "") {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (
      date !== "" &&
      format(date).toString() !== format(nowDate, "yyyy-MM-dd").toString()
    ) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      next();
    }
  } catch (e) {
    console.log(`${e.message}`);
  }
};

// API 1
app.get("/todos/", scenarios, async (request, response) => {
  try {
    console.log("start of API 1");
    const {
      search_q = "",
      priority = "",
      status = "",
      category = "",
      date = "",
    } = request.query;
    if (date !== "") {
      date = format(date, "yyyy-MM-dd").toString();
    }
    const getQuery = `SELECT * FROM todo WHERE todo LIKE %'${search_q}'%
    priority='${priority}' AND status='${status}' AND category = '${category}' AND date = '${date}';`;
    const x = await db.all(getQuery);
    response.send(x);
  } catch (e) {
    console.log(`${e.message}`);
  }
});
