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
  const objectStore = db.createObjectStore("tasks", {
    keyPath: "id",
    autoIncrement: true,
  });
  objectStore.createIndex("task", "task", { unique: false });
  objectStore.createIndex("done", "done", { unique: false });
  objectStore.createIndex("visible", "visible", { unique: false });
};

// listens for the successful opening of the database
request.onsuccess = (event) => {
  console.log("Database opened successfully");
  // db now holds reference to the opened database
  db = event.target.result;

  renderTasks();
};

// Render tasks from the database
function renderTasks() {
  const transaction = db.transaction("tasks", "readonly");
  const objectStore = transaction.objectStore("tasks");
  const request = objectStore.getAll();

  request.onsuccess = (event) => {
    const tasks = event.target.result;
    tasks.forEach((task) => {
      let li = document.createElement("li");
      li.innerHTML = task.task;
      li.setAttribute("id", task.id);

      let span = document.createElement("span");
      span.className = "close";
      span.innerHTML = "\u00d7";
      li.appendChild(span);

      if (task.done) {
        li.classList.add("checked");
        doneListContainer.appendChild(li);
      } else if (task.visible) {
        listContainer.appendChild(li);
      }
    });
  };

  request.onerror = (event) => {
    console.error(
      `Error fetching tasks from the database: ${event.target.error}`,
    );
  };
}

// eslint-disable-next-line no-unused-vars
function addTask() {
  if (inputBox.value === "") {
    alert("You must write something!");
  } else {
    let li = document.createElement("li");
    // what type of element are we creating? "li" - a list item element <li>
    li.innerHTML = inputBox.value;
    // now we need to say where this list item shoud be displayed: display in this container
    listContainer.appendChild(li);
    let span = document.createElement("span");
    // add a class name to the span so we can target the x to close
    span.className = "close";
    span.innerHTML = "\u00d7";
    li.appendChild(span);
    addTaskToDB(inputBox.value);
  }
  // now we want to make sure that the text box is empty
  inputBox.value = "";
}

function addTaskToDB(task) {
  const transaction = db.transaction("tasks", "readwrite");
  // objectStore method refers to existing object store within the DB
  const objectStore = transaction.objectStore("tasks");
  // when adding the new task, it will also be marked as not done

  const request = objectStore.add({ task: task, done: false, visible: true });
  request.onsuccess = () => {
    console.log("Task: " + task + " added to the database");
    const task_request = db.transaction("tasks").objectStore("tasks").getAll();
    task_request.onsuccess = () => {
      const tasks = task_request.result;
      console.table(tasks);
    };
  };

  request.onerror = (event) => {
    console.error(`Error adding task to the database: ${event.target.error}`);
  };
}

listContainer.addEventListener(
  "click",
  function (e) {
    if (e.target.tagName === "LI") {
      e.target.classList.toggle("checked");
      console.log("This item is now checked");

      const textContentWithoutX = Array.from(e.target.childNodes)
        .filter((node) => node.nodeName !== "SPAN")
        .map((node) => node.textContent)
        .join("");
      console.log(textContentWithoutX);
      // mark the task as DONE and print the task name to the console

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
      };

      request.onerror = (event) => {
        console.error(
          `Error editing task in the database: ${event.target.error}`,
        );
      };
    } else if (e.target.tagName === "SPAN") {
      const transaction = db.transaction("tasks", "readwrite");
      const objectStore = transaction.objectStore("tasks");
      const id = Number(e.target.parentElement.getAttribute("id"));
      console.log("Task id: ", id);
      const request = objectStore.get(id);
      // get method returns an object selevted by a specified key from an object store in the database, in this case the "key"
      request.onsuccess = () => {
        const task = request.result;
        // in previous cursor example, I set task to cursor.value(), so task was set to the value of the current cursor
        task.visible = false;
        objectStore.put(task);
        e.target.parentElement.remove();
      };

      //       const id = e.target.parentElement.getAttribute("id");
      // const request = objectStore.get(id)
      // request.onsuccess = function (params) {
      //       const task = console.log(request.result);
      //       task.visible = true;
      //       objectStore.put(task, id);
    }

    // objectStore.openCursor().onsuccess = (event) => {
    //   const cursor = event.target.result;
    //   if (cursor) {
    //     const task = cursor.value;
    //     const listItem = e.target.parentElement;
    //     const textContentWithoutX = Array.from(listItem.childNodes)
    //       .filter((node) => node.nodeName !== "SPAN")
    //       .map((node) => node.textContent)
    //       .join("");

    //     if (task.task === textContentWithoutX) {
    //       task.visible = false;
    //       e.target.parentElement.remove();

    //       const updateRequest = cursor.update(task);
    //       updateRequest.onsuccess = () => {
    //         console.log("This item is now removed");
    //         cursor.continue();
    //       };

    //       updateRequest.onerror = (event) => {
    //         console.error(
    //           `Error updating task visibility in the database: ${event.event.target.error}`,
    //         );
    //       };
    //     }
    //   } else {
    //     cursor.continue();
    //   }
    // };
    // objectStore.delete(task);
    // saveData();
  },
  false,
);
