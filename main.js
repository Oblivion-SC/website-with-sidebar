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
    const settingsScreen = document.getElementById("settingsScreen");
    const helpScreen = document.getElementById("helpScreen");

    const trashBtn = document.getElementById("trashBtn");
    const notesBtn = document.getElementById("notesBtn");
    const settingsBtn = document.getElementById("settingsBtn");
    const helpBtn = document.getElementById("helpBtn");

    const collapsed = document.querySelector(".note-collapsed");
    const expanded = document.getElementById("expandedNote");

    const closeBtn = document.getElementById("closeNote");
    const addBtn = document.getElementById("addNote");

    const titleInput = document.getElementById("noteTitle");
    const textInput = document.getElementById("noteText");

    const notesGrid = document.getElementById("notesGrid");
    const searchInput = document.getElementById("searchInput");

    // Модальное окно подтверждения удаления
    const confirmModal = document.getElementById("confirmModal");
    const modalCancel = document.getElementById("modalCancel");
    const modalConfirm = document.getElementById("modalConfirm");
    const modalNoteText = document.getElementById("modalNoteText");
    
    let pendingDeleteId = null;

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

    //Поиск
    const handleSearch = debounce((value) => {
        renderNotes(value);
    }, 300);

    searchInput.addEventListener("input", (e) => {
        const value = e.target.value;
        handleSearch(value);

        localStorage.setItem("search", value);
    });

    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function highlightText(text, query) {
        if (!query) return text;

        const safeQuery = escapeRegExp(query);

        const regex = new RegExp(`(${query})`, "gi");
        return text.replace(regex, `<span class="highlight">$1</span>`);
    }

    // Проверка, включены ли подробности
    function isDetailsEnabled() {
        const settings = JSON.parse(localStorage.getItem("settings")) || {};
        return settings.details || false;
    }

    function renderNotes(filter = "") {
        notesGrid.innerHTML = "";

        const filtered = notes.filter(note => {
            const text = (note.title + " " + note.text).toLowerCase();
            return text.includes(filter.toLowerCase());
        });

        //Нет заметок
        if (filtered.length === 0) {
            notesGrid.innerHTML = `
                <p class="empty-state">Нет заметок</p>
            `;
            return;
        }

        const detailsEnabled = isDetailsEnabled();

        filtered.forEach(note => {
            const el = document.createElement("div");
            el.classList.add("note-card");

            const titleHtml = highlightText(note.title || "Без названия", filter);
            const textHtml = highlightText(note.text, filter);

            if (detailsEnabled) {
                // Показываем текст полностью
                el.innerHTML = `
                    <h3>${titleHtml}</h3>
                    <p class="note-text expanded">${textHtml}</p>
                    <button class="delete-btn" data-id="${note.id}">Удалить</button>
                `;
            } else {
                // Обрезаем текст до 3 строк
                el.innerHTML = `
                    <h3>${titleHtml}</h3>
                    <p class="note-text truncated">${textHtml}</p>
                    <button class="delete-btn" data-id="${note.id}">Удалить</button>
                `;
            }

            notesGrid.appendChild(el);
        });
    }

    // Проверка, нужно ли подтверждение удаления
    function isConfirmDeleteEnabled() {
        const settings = JSON.parse(localStorage.getItem("settings")) || {};
        return settings.confirmDelete !== false; // по умолчанию true
    }

    // Функция удаления заметки
    function deleteNoteById(id) {
        const index = notes.findIndex(n => n.id === id);
        if (index !== -1) {
            const [removed] = notes.splice(index, 1);
            trash.push(removed);
            saveToStorage();
        }
        renderNotes();
    }

    // удаление → в корзину
    notesGrid.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn")) {

            const id = Number(e.target.dataset.id);

            if (isConfirmDeleteEnabled()) {
                // Показываем модальное окно
                const note = notes.find(n => n.id === id);
                if (note) {
                    const preview = note.title || note.text || "Без названия";
                    modalNoteText.textContent = `Вы уверены, что хотите удалить заметку "${preview.substring(0, 50)}${preview.length > 50 ? '...' : ''}"?`;
                }
                pendingDeleteId = id;
                confirmModal.style.display = "flex";
            } else {
                // Удаляем сразу
                deleteNoteById(id);
            }
        }
    });

    // Закрытие модального окна
    modalCancel.addEventListener("click", () => {
        confirmModal.style.display = "none";
        pendingDeleteId = null;
    });

    // Подтверждение удаления
    modalConfirm.addEventListener("click", () => {
        if (pendingDeleteId !== null) {
            deleteNoteById(pendingDeleteId);
        }
        confirmModal.style.display = "none";
        pendingDeleteId = null;
    });

    // Закрытие модального окна по клику вне его
    confirmModal.addEventListener("click", (e) => {
        if (e.target === confirmModal) {
            confirmModal.style.display = "none";
            pendingDeleteId = null;
        }
    });

    const trashGrid = document.getElementById("trashGrid");

    function renderTrash() {
        trashGrid.innerHTML = "";

        //Корзина пуста
        if (trash.length === 0) {
            trashGrid.innerHTML = `
                <p class="empty-state">Корзина пуста</p>
            `;
            return;
        }

        const detailsEnabled = isDetailsEnabled();

        trash.forEach(note => {
            const el = document.createElement("div");
            el.classList.add("note-card");

            const textClass = detailsEnabled ? "expanded" : "truncated";

            el.innerHTML = `
                <h3>${note.title || "Без названия"}</h3>
                <p class="note-text ${textClass}">${note.text}</p>
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

    // Переключение экранов
    function showScreen(screen) {
        notesScreen.style.display = "none";
        trashScreen.style.display = "none";
        settingsScreen.style.display = "none";
        helpScreen.style.display = "none";
        screen.style.display = "block";
    }

    // перенесение в корзину
    trashBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showScreen(trashScreen);
        renderTrash();
    });

    notesBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showScreen(notesScreen);
        renderNotes(searchInput.value);
    });

    // Настройки
    settingsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showScreen(settingsScreen);
    });

    // Справка
    helpBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showScreen(helpScreen);
    });

    // ===== ЛОГИКА НАСТРОЕК =====
    const detailsToggle = document.getElementById("detailsToggle");
    const confirmDeleteToggle = document.getElementById("confirmDeleteToggle");

    // Загрузка сохранённых настроек
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem("settings")) || {};
        
        if (settings.details !== undefined) {
            detailsToggle.checked = settings.details;
        }
        
        if (settings.confirmDelete !== undefined) {
            confirmDeleteToggle.checked = settings.confirmDelete;
        }

        if (settings.theme) {
            const themeRadio = document.getElementById(settings.theme);
            if (themeRadio) themeRadio.checked = true;
            applyTheme(settings.theme);
        }
    }

    function saveSettings() {
        const settings = {
            details: detailsToggle.checked,
            confirmDelete: confirmDeleteToggle.checked,
            theme: document.querySelector('input[name="theme"]:checked')?.id || "darkTheme"
        };
        localStorage.setItem("settings", JSON.stringify(settings));
        applyTheme(settings.theme);
        
        // Перерисовываем заметки при изменении настройки "подробности"
        renderNotes(searchInput.value);
        if (trashScreen.style.display !== "none") {
            renderTrash();
        }
    }

    function applyTheme(themeId) {
        document.body.classList.remove("light-theme", "dark-theme");
        
        if (themeId === "lightTheme") {
            document.body.classList.add("light-theme");
        } else if (themeId === "darkTheme") {
            document.body.classList.add("dark-theme");
        } else if (themeId === "systemTheme") {
            // Использовать системную тему Windows
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.body.classList.add("dark-theme");
            } else {
                document.body.classList.add("light-theme");
            }
        }
    }

    detailsToggle.addEventListener("change", saveSettings);
    confirmDeleteToggle.addEventListener("change", saveSettings);

    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener("change", saveSettings);
    });

    // Отслеживание изменения системной темы
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const settings = JSON.parse(localStorage.getItem("settings")) || {};
        if (settings.theme === "systemTheme") {
            applyTheme("systemTheme");
        }
    });

    loadSettings();

    //LocalStorage
    function saveToStorage() {
        localStorage.setItem("notes", JSON.stringify(notes));
        localStorage.setItem("trash", JSON.stringify(trash));
        localStorage.setItem("search", searchInput.value);
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

    const savedSearch = localStorage.getItem("search") || "";
    searchInput.value = savedSearch;
    
    renderNotes(savedSearch);
    renderTrash();
});