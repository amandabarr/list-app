const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const doneListContainer = document.getElementById("done-list-container");

const request = window.indexedDB.open("ToDoListDatabase", 1);

let db;

// listens for errors that might occurr while attempting to open the database
request.onerror = (event) => {
    console.error(`Database error: ${event.target.errorCode}`);
};

request.onupgradeneeded = (event) => {
    const db = event.target.result;
    // use createObjectStore method to create a new object store in DB
    const objectStore = db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("task", "task", { unique: false });
    // keep track of whether task is completed or not
    objectStore.createIndex("done", "done", { unique: false });
};

// listens for the successful opening of the database
request.onsuccess = (event) => {
    console.log("Database opened successfully")
    // db now holds reference to the opened database
    db = event.target.result;

    //create renderList function and populate from the database using get/getAll
    // function renderList () {
    //     const transaction = db.transaction("tasks", "readwrite");
    //     // console.log(transaction);
    //     const store = transaction.objectStore("tasks");
    //     const taskIndex = store.index("task");
    //     const taskQuery = taskIndex.getAll();

    //     taskQuery.onsuccess = (event) => {
    //         const result = event.target.result;
    //         if (result) {
    //             console.log(`This is the result of event.target.result: ${result}`);
    //             // Show result in DOM
    //         } else {
    //             console.log("No task found with that ID");
    //         }
    //     };

    //     taskQuery.onerror = (event) => {
    //         console.error("Error fetching task:", event.target.error);
    //     };
    // }

    // renderList();

    console.log(request.result);

    // testing printing DONE items -
    function renderDoneItems () {
        db.transaction("tasks").objectStore("tasks").getAll().onsuccess = (event) => {
            const tasks = event.target.result;

            tasks.forEach((task) => {
                let li = document.createElement("li");

                if (task.done == true) {
                    li.classList.add("checked");
                    li.innerHTML = task.task;
                    doneListContainer.appendChild(li);
                } else {
                    li.innerHTML = task.task;
                    listContainer.appendChild(li);
                }
            })

        };

    }


    renderDoneItems();

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
    // objectStore method refers to existing object store within the DB
    const objectStore = transaction.objectStore("tasks");
    // when adding the new task, it will also be marked as not done
    console.log("The current task is: " + task + " done: " + objectStore.getAll());
    // following: https://dev.to/pandresdev/get-data-from-indexeddb-7hg
    const request = objectStore.add({ task: task, done: false })
        request.onsuccess = () => {
            console.log("Task: " + task + " added to the database");
            const task_request = db.transaction("tasks").objectStore("tasks").getAll();
            task_request.onsuccess = () => {
                const tasks = task_request.result;
                console.table(tasks);
            }
        };

        request.onerror = (event) => {
            console.error(`Error adding task to the database: ${event.target.error}`);
        };
};

listContainer.addEventListener("click", function(e){

    if(e.target.tagName === "LI"){
        e.target.classList.toggle("checked");
        console.log("This item is now checked");

        const textContentWithoutX = Array.from(e.target.childNodes).filter(node => node.nodeName !== 'SPAN').map(node => node.textContent).join('');
        console.log(textContentWithoutX);
        // mark the task as DONE

        const transaction = db.transaction("tasks", "readwrite");
        const objectStore = transaction.objectStore("tasks");

        objectStore.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const task = cursor.value;

                if (task.task === textContentWithoutX) {
                    task.done = true;

                    const request = cursor.update(task);
                    request.onsuccess = () => {

                        console.log("Updated task done status");

                        cursor.continue();
                    };

                } else {
                    // move to the next task if the current one does not match
                    cursor.continue();
                }
            }
        }

        request.onerror = (event) => {
            console.error(`Error editing task in the database: ${event.target.error}`);
        };

        // saveData();
    } else if(e.target.tagName === "SPAN"){
        e.target.parentElement.remove();
        console.log("This item is now removed");
        // objectStore.delete(task);
        // saveData();
    }
}, false);


// function saveData() {
//     localStorage.setItem("data", listContainer.innerHTML);
// }

// function showTask(){
//     listContainer.innerHTML = localStorage.getItem("data");
// }

// showTask();

