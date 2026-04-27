document.addEventListener("DOMContentLoaded", () => {
    
    //Закрытие и открытие бургер-меню
    const burger = document.getElementById("burger");
    const sidebar = document.getElementById("sidebar");

    burger.addEventListener("click", () => {
        sidebar.classList.toggle("closed");
    });
    
    let notes = [];
    let trash = [];
    const notesScreen = document.getElementById("notesScreen");
    const trashScreen = document.getElementById("trashScreen");

    const trashBtn = document.getElementById("trashBtn");
    const notesBtn = document.querySelector(".chapter"); // "Заметки"

    const collapsed = document.querySelector(".note-collapsed");
    const expanded = document.getElementById("expandedNote");

    const closeBtn = document.getElementById("closeNote");
    const addBtn = document.getElementById("addNote");

    const titleInput = document.getElementById("noteTitle");
    const textInput = document.getElementById("noteText");

    const notesGrid = document.getElementById("notesGrid");

    // Открытие
    collapsed.addEventListener("click", () => {
        collapsed.style.display = "none";
        expanded.style.display = "flex";
    });

    // Закрытие
    closeBtn.addEventListener("click", () => {
        expanded.style.display = "none";
        collapsed.style.display = "block";

        clearInputs();
    });

    // Добавление заметки
    addBtn.addEventListener("click", () => {

        const title = titleInput.value.trim();
        const text = textInput.value.trim();

        if (!title && !text) return;

        const note = {
            id: Date.now(),
            title,
            text
        };

        notes.push(note);
        renderNotes();

        // сброс
        clearInputs();
        expanded.style.display = "none";
        collapsed.style.display = "block";
    });

    function renderNotes() {
        notesGrid.innerHTML = "";

        notes.forEach(note => {
            const el = document.createElement("div");
            el.classList.add("note-card");

            el.innerHTML = `
                <h3>${note.title || "Без названия"}</h3>
                <p>${note.text}</p>
                <button class="delete-btn" data-id="${note.id}">Удалить</button>
            `;

            notesGrid.appendChild(el);
        });
    }

    // удаление → в корзину
    notesGrid.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn")) {

            const id = Number(e.target.dataset.id);

            const index = notes.findIndex(n => n.id === id);

            if (index !== -1) {
                const [removed] = notes.splice(index, 1);
                trash.push(removed);
                saveToStorage();
            }

            renderNotes();
        }
    });

    const trashGrid = document.getElementById("trashGrid");

    function renderTrash() {
        trashGrid.innerHTML = "";

        trash.forEach(note => {
            const el = document.createElement("div");
            el.classList.add("note-card");

            el.innerHTML = `
                <h3>${note.title || "Без названия"}</h3>
                <p>${note.text}</p>
                <button class="restore-btn" data-id="${note.id}">Восстановить</button>
                <button class="delete-forever-btn" data-id="${note.id}">Удалить навсегда</button>
            `;

            trashGrid.appendChild(el);
        });
    }

    trashGrid.addEventListener("click", (e) => {
        const id = Number(e.target.dataset.id);

        // восстановление
        if (e.target.classList.contains("restore-btn")) {
            const index = trash.findIndex(n => n.id === id);

            if (index !== -1) {
                const [restored] = trash.splice(index, 1);
                notes.push(restored);
            }

            saveToStorage();
            renderTrash();
            renderNotes();
        }

        // удалить навсегда
        if (e.target.classList.contains("delete-forever-btn")) {
            trash = trash.filter(n => n.id !== id);

            saveToStorage();
            renderTrash();
        }
    });

    // перенесение в корзину
    trashBtn.addEventListener("click", () => {
        notesScreen.style.display = "none";
        trashScreen.style.display = "block";
        renderTrash();
    });

    notesBtn.addEventListener("click", () => {
        notesScreen.style.display = "block";
        trashScreen.style.display = "none";
    });

    //LocalStorage
    function saveToStorage() {
        localStorage.setItem("notes", JSON.stringify(notes));
        localStorage.setItem("trash", JSON.stringify(trash));
    }

    function loadFromStorage() {
        notes = JSON.parse(localStorage.getItem("notes")) || [];
        trash = JSON.parse(localStorage.getItem("trash")) || [];
    }

    function clearInputs() {
        titleInput.value = "";
        textInput.value = "";
    }

    loadFromStorage();
    renderNotes();
    renderTrash();
});