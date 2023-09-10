const express = require("express");
const app = express();
app.use(express.json());
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3008, () => {
      console.log("Server is running at http:/localhost:3010/");
    });
  } catch (e) {
    console.log(e.message);
  }
};

initializeDBAndServer();

const checkRequestsQueries = async (request, response, next) => {
  const { search_q, category, priority, status, date } = request.query;
  const { todoId } = request.params;
  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryIsInArray = categoryArray.includes(category);
    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

const categoryArray = ["HOME","WORK","LEARNING"];
const priorityArray = ["HIGH","MEDIUM","LOW"];
const statusArray = ["TO DO","IN PROGRESS","DONE"];

//first middleware function for queries
const checkQueries = async(request ,response, next)=>{
    const {search_q, priority, category, status, date} = request.query;
    if (priority!==undefined){
        if(priorityArray.includes(priority)){
            request.priority = priority;
        }
        else{
            response.status(400);
            response.send("Invalid Todo Priority");
            return;
        }
    }
    if (category!==undefined){
        if(categoryArray.includes(category)){
            request.category = category;
        }
        else{
            response.status(400);
            response.send("Invalid Todo category");
            return;
        }
    }
    if (status!==undefined){
        if(statusArray.includes(status)){
            request.status = status;
        }
        else{
            response.status(400);
            response.send("Invalid Todo Priority");
            return;
        }
    }
    if (date!==undefined){
        try{
            const myDate = new Date(date);
            const result = new Date(`${myDate.getFullYear()}=${myDate.getMonth() + 1}-${myDate.getDate()}`);
            const formatDate = format(result,'yyyy-MM-dd');
            console.log(formatDate);
            const isValidDate = isValid(result);
            console.log(isValidDate);
            if(isValidDate === true){
                request.date = formatDate;
            }
            else{
                response.status(400);
                response.send("Invalid Due Date");
                return;
            }
        }
        catch (e) {
            console.log(e.message)
        }
    }
    request.search_q = search_q;
    next();
}

const checkRequestsBody = (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;

  if (category !== undefined) {
    categoryArray = ["WORK", "HOME", "LEARNING"];
    categoryIsInArray = categoryArray.includes(category);

    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    priorityArray = ["HIGH", "MEDIUM", "LOW"];
    priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
      console.log(formatedDate);
      const result = toDate(new Date(formatedDate));
      const isValidDate = isValid(result);
      console.log(isValidDate);
      if (isValidDate === true) {
        request.dueDate = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todo = todo;
  request.id = id;

  request.todoId = todoId;

  next();
};

//Get Todos API-1
app.get("/todos/", checkRequestsQueries, async (request, response) => {
  const { status = "", search_q = "", priority = "", category = "" } = request;
  console.log(status, search_q, priority, category);
  const getTodosQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate 
        FROM 
            todo
        WHERE 
        todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%' 
        AND status LIKE '%${status}%' AND category LIKE '%${category}%';`;

  const todosArray = await db.all(getTodosQuery);
  response.send(todosArray);
});

//GET Todo API-2
app.get("/todos/:todoId", checkRequestsQueries, async (request, response) => {
  const { todoId } = request;

  const getTodosQuery = `
        SELECT 
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
        FROM 
            todo            
        WHERE 
            id = ${todoId};`;

  const todo = await db.get(getTodosQuery);
  response.send(todo);
});

//GET Agenda API-3
app.get("/agenda/", checkRequestsQueries, async (request, response) => {
  const { date } = request;
  console.log(date, "a");

  const selectDuaDateQuery = `
        SELECT
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
        FROM 
            todo
        WHERE 
            due_date = '${date}'
        ;`;

  const todosArray = await db.all(selectDuaDateQuery);

  if (todosArray === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    response.send(todosArray);
  }
});

//Add Todo API-4
app.post("/todos/", checkRequestsBody, async (request, response) => {
  const { id, todo, category, priority, status, dueDate } = request;

  const addTodoQuery = `
        INSERT INTO 
            todo (id, todo, priority, status, category, due_date)
        VALUES
            (
                ${id},
               '${todo}',
               '${priority}',
               '${status}',
               '${category}',
               '${dueDate}'
            )
        ;`;

  const createUser = await db.run(addTodoQuery);
  console.log(createUser);
  response.send("Todo Successfully Added");
});

//Update Todo API-5
app.put("/todos/:todoId/", checkRequestsBody, async (request, response) => {
  const { todoId } = request;

  const { priority, todo, status, category, dueDate } = request;

  let updateTodoQuery = null;

  console.log(priority, todo, status, dueDate, category);
  switch (true) {
    case status !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                status = '${status}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
      break;
    case priority !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                priority = '${priority}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
      break;
    case todo !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                todo = '${todo}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case category !== undefined:
      const updateCategoryQuery = `
            UPDATE
                todo
            SET 
                category = '${category}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateCategoryQuery);
      response.send("Category Updated");
      break;
    case dueDate !== undefined:
      const updateDateQuery = `
            UPDATE
                todo
            SET 
                due_date = '${dueDate}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateDateQuery);
      response.send("Due Date Updated");
      break;
  }
});

//Delete Todo API-6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
            DELETE FROM 
                todo
            WHERE 
               id=${todoId}
     ;`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
