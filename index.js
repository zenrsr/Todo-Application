const express = require("express")
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname,"todoApplication.db");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3");
const {toDate} = require("date-fns");
const {isValid} = require("date-fns");
const {format} = require("date-fns")

let db = null;

const startServer = async()=>{
    try{
        db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });
    app.listen(3010,()=>{
        console.log("Server is running at http://localhost:3010/");
    })
    }
    catch (e) {
        console.log(e.message);
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

//second middleware function for queries
const checkBodies = async(request, response, next)=>{
    const {id, todo, priority, category, status, dueDate} = request.body;
    const {todoId} = request.params;
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
    if (dueDate!==undefined){
        try{
            const myDate = new Date(dueDate);
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
    request.todoId = todoId;
    request.todo = todo;
    request.id = id;
    next();
}

// API 1
app.get("/todos/", checkQueries,async(request, response)=>{
    try{
        const {search_q="", priority="", status="", category=""} = request;
        console.log(search_q);
        const getQuery = `
             SELECT
                   id,
                   todo,
                   priority,
                   status,
                   category,
                   due_date as dueDate
                   FROM todo WHERE 
                          todo LIKE '%${search_q}%' and  
                          priority LIKE '%${priority}%' and 
                          statuS LIKE '%${status}%' and 
                          category LIKE '%${category}%';`;
        const result = await db.all(getQuery);
        response.send(result);
    }
    catch (e) {
        console.log(e.message);
    }
})

// API 2
app.get("/todos/:todoId/",checkQueries, async(request,response)=>{
    try{
        const{todoId} = request.params;
        const getQuery = `SELECT * FROM todo WHERE id=${todoId};`;
        const result = await db.get(getQuery);
        response.send(result);
    }
    catch(e){
        console.log(e.message);
    }
})

// API 3
app.get("/agenda/",checkQueries, async (request, response) => {
    try {
        const { date } = request;
        const getQuery = `SELECT id, todo, priority, status, category, due_date as dueDate FROM todo 
                                 WHERE due_date LIKE '%${date}%';`;
        const result = await db.all(getQuery);
        response.send(result);
    } catch (e) {
        console.log(e.message);
    }
})

// API 4
app.post("/todos/",checkBodies, async(request, response)=>{
    try{
        const {id,todo,priority,status,category,dueDate} = request;
        const getQuery = `
            INSERT INTO todo (id,todo,priority,status,category,due_date)
            VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
        const result = await db.run(getQuery);
        response.send("Todo Successfully Added");
    }
    catch(e){
        console.log(e.message);
    }
})

// API 5
app.put("/todos/:todoId/",checkBodies, async(request, response)=>{
    try{
        const {status,category,priority,todo,dueDate} = request;
        const {todoId} = request.params;
        let getQuery = null;
        if(status!==undefined){
            getQuery = `UPDATE todo SET status='${status}' WHERE id=${todoId};`;
            await db.run(getQuery);
            response.send("Status Updated");
        }
        if(category!==undefined){
            getQuery = `UPDATE todo SET category='${category}' WHERE id=${todoId};`;
            await db.run(getQuery);
            response.send("Category Updated");
        }
        if(todo!==undefined){
            getQuery = `UPDATE todo SET todo='${todo}' WHERE id=${todoId};`;
            await db.run(getQuery);
            response.send("Todo Updated");
        }
        if(priority!==undefined){
            getQuery = `UPDATE todo SET priority='${priority}' WHERE id=${todoId};`;
            await db.run(getQuery);
            response.send("Priority Updated");
        }
        if(dueDate!==undefined){
            getQuery = `UPDATE todo SET due_date='${dueDate}' WHERE id=${todoId};`;
            await db.run(getQuery);
            response.send("Due Date Updated");
        }
    }
    catch (e) {
        console.log(e.message);
    }
})

// API 6
app.delete("/todos/:todoId/", async(request, response)=>{
    try{
        const{todoId} = request.params;
        const getQuery = `DELETE FROM todo WHERE id=${todoId};`;
        await db.run(getQuery);
        response.send("Todo Deleted");
    }
    catch(e){
        console.log(e.message);
    }
})