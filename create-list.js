const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");

const request = window.indexedDB.open("ToDoListDatabase", 1);

let db;

// listens for errors that might occurr while attempting to open the database
request.onerror = (event) => {
    console.error(`Database error: ${event.target.errorCode}`);
};

request.onupgradeneeded = (event) => {
    const db = event.target.result;
    const objectStore = db.objectStore("tasks", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("task", "task", { unique: false });
};

// listens for the successful opening of the database
request.onsuccess = (event) => {
    console.log("Database opened successfully")
    // db now holds reference to the opened database
    db = event.target.result;

    //create renderList function and populate from the database using get/getAll

    //also save done true/false to DB and only populate not done
};

function addTask() {
    if(inputBox.value === '') {
        alert("You must write something!");
    } else {
        let li = document.createElement("li");
        // what type of element are we creating? "li" - a list item element <li>
        li.innerHTML = inputBox.value;
        // now we need to say where this list item shoud be displayed: display in this container
        listContainer.appendChild(li);
        let span = document.createElement("span");
        span.innerHTML = "\u00d7";
        li.appendChild(span);
        addTaskToDB(inputBox.value);
    }
    // now we want to make sure that the text box is empty
    inputBox.value = "";
    // saveData();
};

function addTaskToDB(task) {
    const transaction = db.transaction("tasks", "readwrite");
    const objectStore = transaction.objectStore("tasks");
    const request = objectStore.add({ task: task })
        request.onsuccess = () => {
            console.log("Task added to the database");
        };

        request.onerror = (event) => {
            console.error(`Error adding task to the database: ${event.target.error}`);
        };
};

listContainer.addEventListener("click", function(e){
    if(e.target.tagName === "LI"){
        e.target.classList.toggle("checked");
        saveData();
    } else if(e.target.tagName === "SPAN"){
        e.target.parentElement.remove();
        saveData();
    }
}, false);

// function saveData() {
//     localStorage.setItem("data", listContainer.innerHTML);
// }

// function showTask(){
//     listContainer.innerHTML = localStorage.getItem("data");
// }

// showTask();
