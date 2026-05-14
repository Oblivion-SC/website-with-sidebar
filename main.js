document.addEventListener("DOMContentLoaded", () => {
    const isAuth = localStorage.getItem("isAuth");

    if (!isAuth) {
        window.location.href = "auth.html";
    }

    //Закрытие и открытие бургер-меню
    const burger = document.getElementById("burger");
    const sidebar = document.getElementById("sidebar");

    burger.addEventListener("click", () => {
        sidebar.classList.toggle("closed");
    });
    
    let notes = [];
    let trash = [];
    let labels = [];
    let currentLabelId = null;

    const notesScreen = document.getElementById("notesScreen");
    const trashScreen = document.getElementById("trashScreen");
    const settingsScreen = document.getElementById("settingsScreen");
    const helpScreen = document.getElementById("helpScreen");
    const labelsScreen = document.getElementById("labelsScreen");
    const labelNotesScreen = document.getElementById("labelNotesScreen");

    const trashBtn = document.getElementById("trashBtn");
    const notesBtn = document.getElementById("notesBtn");
    const settingsBtn = document.getElementById("settingsBtn");
    const helpBtn = document.getElementById("helpBtn");
    const labelsBtn = document.getElementById("labelsBtn");

    const collapsed = document.querySelector(".note-collapsed");
    const expanded = document.getElementById("expandedNote");

    const closeBtn = document.getElementById("closeNote");
    const addBtn = document.getElementById("addNote");

    const titleInput = document.getElementById("noteTitle");
    const textInput = document.getElementById("noteText");

    const collapsedLabel = document.querySelector(".note-collapsed-label");
    const expandedLabel = document.getElementById("expandedNoteLabel");
    const closeBtnLabel = document.getElementById("closeNoteLabel");
    const addBtnLabel = document.getElementById("addNoteLabel");
    const titleInputLabel = document.getElementById("noteTitleLabel");
    const textInputLabel = document.getElementById("noteTextLabel");

    const notesGrid = document.getElementById("notesGrid");
    const searchInput = document.getElementById("searchInput");
    const labelNotesGrid = document.getElementById("labelNotesGrid");

    // Модальное окно подтверждения удаления
    const confirmModal = document.getElementById("confirmModal");
    const modalCancel = document.getElementById("modalCancel");
    const modalConfirm = document.getElementById("modalConfirm");
    const modalNoteText = document.getElementById("modalNoteText");
    
    let pendingDeleteId = null;
    let draggedNoteId = null;

    const addLabelModal = document.getElementById("addLabelModal");
    const modalLabelSelect = document.getElementById("modalLabelSelect");
    const modalAddLabelCancel = document.getElementById("modalAddLabelCancel");
    const modalAddLabelConfirm = document.getElementById("modalAddLabelConfirm");
    let currentNoteForLabel = null;

    //Авторизация
    const logoutBtns = document.querySelectorAll("#logoutBtn");

    logoutBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            localStorage.removeItem("isAuth");
            window.location.href = "auth.html";
        });
    });

    //Профиль
    const profileWrapper = document.querySelector(".profile-wrapper");
    const profileBtn = document.getElementById("profileBtn");
    const profileDropdown = document.getElementById("profileDropdown");
    const profileEmail = document.getElementById("profileEmail");
    const profileLetter = document.getElementById("profileLetter");
    const profileAvatar = document.getElementById("profileAvatar");
    const avatarInput = document.getElementById("avatarInput");
    const removeAvatarBtn = document.getElementById("removeAvatarBtn");
    const openTrashBtn = document.getElementById("openTrashBtn");
    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (savedUser) {
        // email
        profileEmail.textContent = savedUser.email;

        // первая буква
        profileLetter.textContent = savedUser.email[0].toUpperCase();
    }

    // Загрузка аватара
    function loadAvatar() {
        const savedAvatar = localStorage.getItem("profileAvatar");
        if (savedAvatar) {
            profileAvatar.src = savedAvatar;
            profileAvatar.classList.remove("hidden");
            profileLetter.classList.add("hidden");
        } else {
            profileAvatar.classList.add("hidden");
            profileLetter.classList.remove("hidden");
        }
    }

    // Загрузка фото
    avatarInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Проверка размера (макс 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert("Файл слишком большой. Максимальный размер: 2MB");
            return;
        }

        // Проверка типа файла
        if (!file.type.match(/image\/(png|jpg|jpeg|gif|webp)/)) {
            alert("Поддерживаются только изображения: PNG, JPG, JPEG, GIF, WebP");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target.result;
            
            // Создаем изображение для проверки размеров
            const img = new Image();
            img.onload = () => {
                // Оптимизация размера если нужно (макс 300x300)
                if (img.width > 300 || img.height > 300) {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    
                    const ratio = Math.min(300 / img.width, 300 / img.height);
                    canvas.width = img.width * ratio;
                    canvas.height = img.height * ratio;
                    
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const optimizedData = canvas.toDataURL("image/jpeg", 0.8);
                    
                    localStorage.setItem("profileAvatar", optimizedData);
                } else {
                    localStorage.setItem("profileAvatar", imageData);
                }
                
                loadAvatar();
                profileDropdown.classList.add("hidden");
            };
            img.src = imageData;
        };
        reader.readAsDataURL(file);
    });

    // Удаление фото
    removeAvatarBtn.addEventListener("click", () => {
        localStorage.removeItem("profileAvatar");
        loadAvatar();
        profileDropdown.classList.add("hidden");
    });

    loadAvatar();

    //Открытие / закрытие профиля
    profileBtn.addEventListener("click", () => {
        profileDropdown.classList.toggle("hidden");
    });

    //Закрытие профиля при клике вне меню
    document.addEventListener("click", (e) => {
        if (!profileWrapper.contains(e.target)) {
            profileDropdown.classList.add("hidden");
        }
    });

    //Кнопка корзины в профиле
    openTrashBtn.addEventListener("click", () => {
        notesScreen.style.display = "none";
        trashScreen.style.display = "block";
        renderTrash();
        profileDropdown.classList.add("hidden");
    });

    // Открытие карточки заметки
    collapsed.addEventListener("click", () => {
        collapsed.style.display = "none";
        expanded.style.display = "flex";
    });

    // Закрытие карточки заметки
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
            order: Date.now(),
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
        if (labelNotesScreen.style.display === "block") {
            renderLabelNotes(value);
        } else if (notesScreen.style.display === "block") {
            renderNotes(value);
        }
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
        if (filtered.length === 0) {
            notesGrid.innerHTML = `<p class="empty-state">Нет заметок</p>`;
            return;
        }
        const detailsEnabled = isDetailsEnabled();
        filtered.forEach(note => {
            const el = document.createElement("div");
            el.classList.add("note-card");
            el.setAttribute("draggable", true);
            el.dataset.id = note.id;

            // Drag & Drop
            el.addEventListener("dragstart", () => {
                draggedNoteId = note.id;
                el.classList.add("dragging");
            });
            el.addEventListener("dragend", () => {
                el.classList.remove("dragging");
            });
            el.addEventListener("dragover", (e) => {
                e.preventDefault();
                el.classList.add("drag-over");
            });
            el.addEventListener("dragleave", () => {
                el.classList.remove("drag-over");
            });
            el.addEventListener("drop", () => {
                el.classList.remove("drag-over");
                const draggedIndex = notes.findIndex(n => n.id == draggedNoteId);
                const targetIndex = notes.findIndex(n => n.id == note.id);
                if (draggedIndex === -1 || targetIndex === -1) return;
                const draggedItem = notes[draggedIndex];
                notes.splice(draggedIndex, 1);
                notes.splice(targetIndex, 0, draggedItem);
                notes.forEach((n, idx) => n.order = idx);
                saveToStorage();
                renderNotes(searchInput.value);
            });

            const titleHtml = highlightText(note.title || "Без названия", filter);
            const textHtml = highlightText(note.text, filter);
            // Генерация HTML ярлыков для карточки
            let labelsHtml = "";
            if (note.labels && note.labels.length) {
                labelsHtml = `<div class="note-labels">${note.labels.map(labelId => {
                    const label = labels.find(l => l.id == labelId);
                    return label ? `<span class="label-tag" data-label-id="${label.id}">${escapeHtml(label.name)}</span>` : '';
                }).join('')}</div>`;
            }
            if (detailsEnabled) {
                el.innerHTML = `
                    <h3>${titleHtml}</h3>
                    <p class="note-text expanded">${textHtml}</p>
                    ${labelsHtml}
                    <button class="delete-btn" data-id="${note.id}">Удалить</button>
                    <button class="add-label-btn" data-id="${note.id}">+ Ярлык</button>
                `;
            } else {
                el.innerHTML = `
                    <h3>${titleHtml}</h3>
                    <p class="note-text truncated">${textHtml}</p>
                    ${labelsHtml}
                    <button class="delete-btn" data-id="${note.id}">Удалить</button>
                    <button class="add-label-btn" data-id="${note.id}">+ Ярлык</button>
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
        if (currentLabelId) renderLabelNotes(); 
    }

    // удаление в корзину
    notesGrid.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn")) {
            const id = Number(e.target.dataset.id);
            if (isConfirmDeleteEnabled()) {
                const note = notes.find(n => n.id === id);
                if (note) {
                    const preview = note.title || note.text || "Без названия";
                    modalNoteText.textContent = `Вы уверены, что хотите удалить заметку "${preview.substring(0, 50)}${preview.length > 50 ? '...' : ''}"?`;
                }
                pendingDeleteId = id;
                confirmModal.style.display = "flex";
            } else {
                deleteNoteById(id);
            }
        }
        // Добавление ярлыка к заметке
        if (e.target.classList.contains("add-label-btn")) {
            const id = Number(e.target.dataset.id);
            currentNoteForLabel = id;
            // Заполняем select доступными ярлыками
            modalLabelSelect.innerHTML = '<option value="">Выберите ярлык</option>';
            labels.forEach(label => {
                const option = document.createElement("option");
                option.value = label.id;
                option.textContent = label.name;
                modalLabelSelect.appendChild(option);
            });
            addLabelModal.style.display = "flex";
        }
        // Клик по ярлыку для фильтрации
        if (e.target.classList.contains("label-tag")) {
            const labelId = Number(e.target.dataset.labelId);
            const label = labels.find(l => l.id == labelId);
            if (label) {
                currentLabelId = labelId;
                // Сброс поиска
                searchInput.value = "";
                renderLabelNotes();
                localStorage.setItem("search", "");
                showScreen(labelNotesScreen);
                document.getElementById("backToLabelsBtn").style.display = "inline-block";
                document.getElementById("deleteCurrentLabelBtn").style.display = "inline-block";
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
            // дополнительно принудительно обновим экран ярлыков, если нужно
            if (currentLabelId) renderLabelNotes();
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

     //модалка добавления ярлыка
    modalAddLabelCancel.addEventListener("click", () => {
        addLabelModal.style.display = "none";
        currentNoteForLabel = null;
    });
    modalAddLabelConfirm.addEventListener("click", () => {
        const selectedLabelId = parseInt(modalLabelSelect.value);
        if (selectedLabelId && currentNoteForLabel !== null) {
            const note = notes.find(n => n.id == currentNoteForLabel);
            if (note && !note.labels.includes(selectedLabelId)) {
                note.labels.push(selectedLabelId);
                saveToStorage();
                renderNotes(searchInput.value);
            }
        }
        addLabelModal.style.display = "none";
        currentNoteForLabel = null;
    });

    const trashGrid = document.getElementById("trashGrid");

    function renderTrash() {
        trashGrid.innerHTML = "";
        if (trash.length === 0) {
            trashGrid.innerHTML = `<p class="empty-state">Корзина пуста</p>`;
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
        if (e.target.classList.contains("restore-btn")) {
            const index = trash.findIndex(n => n.id === id);
            if (index !== -1) {
                const [restored] = trash.splice(index, 1);
                notes.push(restored);
                saveToStorage();
                renderTrash();
                renderNotes(searchInput.value);
            }
        }
        if (e.target.classList.contains("delete-forever-btn")) {
            trash = trash.filter(n => n.id !== id);
            saveToStorage();
            renderTrash();
        }
    });

    //Функции для ярлыков
    function renderLabelsList() {
        const container = document.getElementById("labelsList");
        if (!container) return;
        container.innerHTML = "";
        if (labels.length === 0) {
            container.innerHTML = `<p class="empty-state">Нет ярлыков. Создайте первый!</p>`;
            return;
        }
        labels.forEach(label => {
            const div = document.createElement("div");
            div.classList.add("label-item");
            div.innerHTML = `
                <span class="label-name" data-id="${label.id}">${escapeHtml(label.name)}</span>
                <button class="delete-label-btn" data-id="${label.id}">🗑 Удалить</button>
            `;
            container.appendChild(div);
        });
        // Клик по имени ярлыка
        document.querySelectorAll(".label-name").forEach(el => {
            el.addEventListener("click", (e) => {
                const id = Number(el.dataset.id);
                currentLabelId = id;
                // Сброс поиска
                searchInput.value = "";
                renderLabelNotes();
                localStorage.setItem("search", "");
                showScreen(labelNotesScreen);
                // Скрыть/показать кнопки на экране ярлыка
                document.getElementById("backToLabelsBtn").style.display = "inline-block";
                document.getElementById("deleteCurrentLabelBtn").style.display = "inline-block";
            });
        });
        // Клик по кнопке удаления ярлыка
        document.querySelectorAll(".delete-label-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = Number(btn.dataset.id);
                deleteLabelById(id);
            });
        });
    }

    function deleteLabelById(labelId) {
        // Удаляем ярлык из массива labels
        labels = labels.filter(l => l.id !== labelId);
        // Удаляем этот ярлык из всех заметок
        notes.forEach(note => {
            if (note.labels && note.labels.includes(labelId)) {
                note.labels = note.labels.filter(l => l !== labelId);
            }
        });
        saveToStorage();
        // Если мы находились на экране этого ярлыка, возвращаемся к списку ярлыков
        if (currentLabelId === labelId) {
            currentLabelId = null;
            showScreen(labelsScreen);
            renderLabelsList();
        }
        renderLabelsList();
        renderNotes(searchInput.value);
    }

    function renderLabelNotes(filter = "") {
        if (!labelNotesGrid) return;
        labelNotesGrid.innerHTML = "";
        if (!currentLabelId) return;
        const label = labels.find(l => l.id == currentLabelId);
        if (!label) {
            labelNotesGrid.innerHTML = `<p class="empty-state">Ярлык не найден</p>`;
            return;
        }
        // Фильтруем заметки, содержащие текущий ярлык
        let filteredNotes = notes.filter(note => note.labels && note.labels.includes(currentLabelId));
        // Применяем поиск
        if (filter) {
            filteredNotes = filteredNotes.filter(note => {
                const text = (note.title + " " + note.text).toLowerCase();
                return text.includes(filter.toLowerCase());
            });
        }
        if (filteredNotes.length === 0) {
            labelNotesGrid.innerHTML = `<p class="empty-state">Нет заметок с этим ярлыком</p>`;
            return;
        }
        const detailsEnabled = isDetailsEnabled();
        filteredNotes.forEach(note => {
            const el = document.createElement("div");
            el.classList.add("note-card");
            el.setAttribute("draggable", true);
            el.dataset.id = note.id;

            // Drag & drop (глобальный порядок)
            el.addEventListener("dragstart", () => {
                draggedNoteId = note.id;
                el.classList.add("dragging");
            });
            el.addEventListener("dragend", () => {
                el.classList.remove("dragging");
            });
            el.addEventListener("dragover", (e) => {
                e.preventDefault();
                el.classList.add("drag-over");
            });
            el.addEventListener("dragleave", () => {
                el.classList.remove("drag-over");
            });
            el.addEventListener("drop", () => {
                el.classList.remove("drag-over");
                const draggedIndex = notes.findIndex(n => n.id == draggedNoteId);
                const targetIndex = notes.findIndex(n => n.id == note.id);
                if (draggedIndex === -1 || targetIndex === -1) return;
                const draggedItem = notes[draggedIndex];
                notes.splice(draggedIndex, 1);
                notes.splice(targetIndex, 0, draggedItem);
                notes.forEach((n, idx) => n.order = idx);
                saveToStorage();
                renderLabelNotes(filter); // сохраняем текущий фильтр
                renderNotes(searchInput.value);
            });

            const titleHtml = highlightText(note.title || "Без названия", filter);
            const textHtml = highlightText(note.text, filter);
            if (detailsEnabled) {
                el.innerHTML = `
                    <h3>${titleHtml}</h3>
                    <p class="note-text expanded">${textHtml}</p>
                    <div class="note-card-actions-vertical">
                        <button class="delete-btn-label" data-id="${note.id}">Удалить</button>
                        <button class="remove-label-btn" data-id="${note.id}">Убрать ярлык</button>
                    </div>
                `;
            } else {
                el.innerHTML = `
                    <h3>${titleHtml}</h3>
                    <p class="note-text truncated">${textHtml}</p>
                    <div class="note-card-actions-vertical">
                        <button class="delete-btn-label" data-id="${note.id}">Удалить</button>
                        <button class="remove-label-btn" data-id="${note.id}">Убрать ярлык</button>
                    </div>
                `;
            }
            labelNotesGrid.appendChild(el);
        });
    }

    // Удаление заметки из экрана ярлыка
    labelNotesGrid.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn-label")) {
            const id = Number(e.target.dataset.id);
            if (isConfirmDeleteEnabled()) {
                const note = notes.find(n => n.id === id);
                if (note) {
                    const preview = note.title || note.text || "Без названия";
                    modalNoteText.textContent = `Вы уверены, что хотите удалить заметку "${preview.substring(0, 50)}${preview.length > 50 ? '...' : ''}"?`;
                }
                pendingDeleteId = id;
                confirmModal.style.display = "flex";
            } else {
                deleteNoteById(id);
                renderLabelNotes();
            }
        }
        if (e.target.classList.contains("remove-label-btn")) {
            const id = Number(e.target.dataset.id);
            const note = notes.find(n => n.id === id);
            if (note && currentLabelId) {
                // удаляем текущий ярлык из заметки
                note.labels = note.labels.filter(l => l !== currentLabelId);
                saveToStorage();
                renderLabelNotes();          // обновляем экран ярлыка
                renderNotes(searchInput.value); // обновляем главный экран
            }
        }
    });

    // Создание заметки на экране ярлыка (автоматически добавляет текущий ярлык)
    function createNoteWithCurrentLabel() {
        const title = titleInputLabel.value.trim();
        const text = textInputLabel.value.trim();
        if (!title && !text) return;
        const newNote = {
            id: Date.now(),
            order: Date.now(),
            title,
            text,
            labels: currentLabelId ? [currentLabelId] : []
        };
        notes.push(newNote);
        saveToStorage();
        clearInputs();
        expandedLabel.style.display = "none";
        collapsedLabel.style.display = "block";
        renderLabelNotes();
        renderNotes(searchInput.value);
    }

    // Обработчики для формы создания заметки на экране ярлыка
    collapsedLabel.addEventListener("click", () => {
        collapsedLabel.style.display = "none";
        expandedLabel.style.display = "flex";
    });
    closeBtnLabel.addEventListener("click", () => {
        expandedLabel.style.display = "none";
        collapsedLabel.style.display = "block";
        clearInputs();
    });
    addBtnLabel.addEventListener("click", createNoteWithCurrentLabel);

    // --- Навигация между экранами ---
    trashBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showScreen(trashScreen);
        renderTrash();
    });
    notesBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showScreen(notesScreen);
        const savedSearch = localStorage.getItem("search") || "";
        searchInput.value = savedSearch;
        renderNotes(savedSearch);
    });
    settingsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showScreen(settingsScreen);
    });
    helpBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showScreen(helpScreen);
    });
    labelsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showScreen(labelsScreen);
        renderLabelsList();
    });

    // Кнопки на экране ярлыков
    const backToLabelsBtn = document.getElementById("backToLabelsBtn");
    const deleteCurrentLabelBtn = document.getElementById("deleteCurrentLabelBtn");
    if (backToLabelsBtn) {
        backToLabelsBtn.addEventListener("click", () => {
            currentLabelId = null;
            showScreen(labelsScreen);
            renderLabelsList();
        });
    }
    if (deleteCurrentLabelBtn) {
        deleteCurrentLabelBtn.addEventListener("click", () => {
            if (currentLabelId) {
                if (confirm("Удалить этот ярлык? Он исчезнет из всех заметок.")) {
                    deleteLabelById(currentLabelId);
                    currentLabelId = null;
                    showScreen(labelsScreen);
                    renderLabelsList();
                }
            }
        });
    }

    // Создание нового ярлыка
    const newLabelInput = document.getElementById("newLabelInput");
    const createLabelBtn = document.getElementById("createLabelBtn");
    if (createLabelBtn) {
        createLabelBtn.addEventListener("click", () => {
            const name = newLabelInput.value.trim();
            if (!name) return;
            if (labels.some(l => l.name.toLowerCase() === name.toLowerCase())) {
                alert("Такой ярлык уже существует");
                return;
            }
            const newLabel = {
                id: Date.now(),
                name: name
            };
            labels.push(newLabel);
            saveToStorage();
            renderLabelsList();
            newLabelInput.value = "";
        });
    }

    // Переключение экранов
    function showScreen(screen) {
        notesScreen.style.display = "none";
        trashScreen.style.display = "none";
        settingsScreen.style.display = "none";
        helpScreen.style.display = "none";
        labelsScreen.style.display = "none";
        labelNotesScreen.style.display = "none";
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

    //ЛОГИКА НАСТРОЕК
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
        localStorage.setItem("labels", JSON.stringify(labels));
        localStorage.setItem("search", searchInput.value);
    }

    function loadFromStorage() {
        notes = JSON.parse(localStorage.getItem("notes")) || [];
        trash = JSON.parse(localStorage.getItem("trash")) || [];
        labels = JSON.parse(localStorage.getItem("labels")) || [];
        // Убедимся, что у каждой заметки есть поле labels (массив)
        notes.forEach(note => {
            if (!note.labels) note.labels = [];
        });
    }

    function clearInputs() {
        titleInput.value = "";
        textInput.value = "";
        titleInputLabel.value = "";
        textInputLabel.value = "";
    }


    loadFromStorage();

    const savedSearch = localStorage.getItem("search") || "";
    searchInput.value = savedSearch;
    
    renderNotes(savedSearch);
    renderTrash();

     // Вспомогательная функция для экранирования HTML
    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
});