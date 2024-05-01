let todos = [
  { id: 1, title: "Buy groceries" },
  { id: 2, title: "Clean the house" },
  { id: 3, title: "Walk the dog" },
];

document.addEventListener("DOMContentLoaded", () => {
  displayTodos();
});

function addTodo() {
  const input = document.getElementById("todoInput");
  const title = input.value.trim();
  if (title) {
    const newTodo = {
      id: todos.length + 1, // Simple ID assignment
      title: title,
    };
    todos.push(newTodo);
    displayTodos();
    input.value = ""; // Clear the input after adding
  } else {
    alert("Please enter a todo.");
  }
}

function displayTodos() {
  const list = document.getElementById("todoList");
  list.innerHTML = ""; // Clear existing todos before redisplaying
  todos.forEach((todo) => {
    const li = document.createElement("li");
    li.textContent = todo.title;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete";
    deleteBtn.onclick = () => handleDelete(todo.id);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

async function handleDelete(id) {
  const userName = document.getElementById("userNameDropdown").value;
  const allowed = await canDeleteTodo(userName, id);

  if (!allowed) {
    alert("You are not authorized to delete this todo.");
    return;
  }

  todos = todos.filter((todo) => todo.id !== id);
  displayTodos();
}
async function canDeleteTodo(userName, todoId) {
  const payload = {
    requestId: "unique_request_id",
    includeMeta: false,
    principal: {
      id: userName,
      policyVersion: "default",
      roles: userName === "CPO" || userName === "CTO" ? ["admin"] : ["user"],
      attr: {},
      scope: "acme.corp",
    },
    resources: [
      {
        actions: ["delete"],
        resource: {
          kind: "todos", // Make sure this matches the 'kind' defined in your policies
          policyVersion: "default", // Use the policy version set in your Cerbos configuration
          id: todoId.toString(),
          attr: {
            owner: "bugs_bunny",
            public: false,
            flagged: false,
          },
        },
      },
    ],
    auxData: {
      jwt: {
        token:
          "eyJhbGciOiJFUzM4NCIsImtpZCI6IjE5TGZaYXRFZGc4M1lOYzVyMjNndU1KcXJuND0iLCJ0eXAiOiJKV1QifQ.eyJhdWQiOlsiY2VyYm9zLWp3dC10ZXN0cyJdLCJjdXN0b21BcnJheSI6WyJBIiwiQiIsIkMiXSwiY3VzdG9tSW50Ijo0MiwiY3VzdG9tTWFwIjp7IkEiOiJBQSIsIkIiOiJCQiIsIkMiOiJDQyJ9LCJjdXN0b21TdHJpbmciOiJmb29iYXIiLCJleHAiOjE5NDk5MzQwMzksImlzcyI6ImNlcmJvcy10ZXN0LXN1aXRlIn0.WN_tOScSpd_EI-P5EI1YlagxEgExSfBjAtcrgcF6lyWj1lGpR_GKx9goZEp2p_t5AVWXN_bjz_sMUmJdJa4cVd55Qm1miR-FKu6oNRHnSEWdMFmnArwPw-YDJWfylLFX", // JWT token if needed for your authorization logic
        keySetId: "my-keyset",
      },
    },
  };

  try {
    const response = await fetch(`http://localhost:3592/api/check/resources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Error from Cerbos:", data);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("Response from Cerbos:", data);
    return data.results[0].actions.delete === "EFFECT_ALLOW";
  } catch (error) {
    console.error("Error sending request to Cerbos:", error);
    return false;
  }
}
