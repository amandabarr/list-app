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
  listContainer.innerHTML = "";

  request.onsuccess = (event) => {
    const tasks = event.target.result;
    tasks.forEach((task) => {
      let li = document.createElement("li");
      li.innerHTML = task.task;
      li.setAttribute("id", task.id);
      console.log(task, task.id);

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
    renderTasks();
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

      // const textContentWithoutX = Array.from(e.target.childNodes)
      //   .filter((node) => node.nodeName !== "SPAN")
      //   .map((node) => node.textContent)
      //   .join("");
      // console.log(textContentWithoutX);
      // mark the task as DONE and print the task name to the console

      const transaction = db.transaction("tasks", "readwrite");
      const objectStore = transaction.objectStore("tasks");
      console.log(objectStore);
      const id = e.target.getAttribute("id");
      const taskName = e.target.getAttribute("task");
      console.log(id);
      console.log("Task id: ", id, "Task name: ", taskName);
      const request = objectStore.get(Number(id));
      console.log(request);

      request.onsuccess = (event) => {
        const task = request.result;
        console.log(task);
        task.done = true;

        const updateRequest = objectStore.put(task);

        updateRequest.onsuccess = () => {
          console.log("Task updated successfully");
        };
        updateRequest.onerror = (event) => {
          console.error(`Error updating task: $event.target.error}`);
        };
      };

      // objectStore.openCursor().onsuccess = (event) => {
      //   const cursor = event.target.result;
      //   if (cursor) {
      //     const task = cursor.value;

      //     if (task.task === textContentWithoutX) {
      //       task.done = true;

      //       const request = cursor.update(task);
      //       request.onsuccess = () => {
      //         console.log("Updated task done status");

      //         cursor.continue();
      //       };
      //     } else {
      //       // move to the next task if the current one does not match
      //       cursor.continue();
      //     }
      //   }
      // };

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
      // get method returns an object selected by a specified key from an object store in the database, in this case the "key" id
      request.onsuccess = (event) => {
        const task = request.result;
        // in previous cursor example, I set task to cursor.value(), so task was set to the value of the current cursor
        // debugger;
        task.visible = false;

        objectStore.put(task);
        // renderTasks();
        e.target.parentElement.remove();
      };
    }
  },
  false,
);
