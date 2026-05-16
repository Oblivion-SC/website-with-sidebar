/**
 * SoundNotes - Main Application Logic
 * 
 * Функционал:
 * - Управление заметками (создание, чтение, обновление, удаление)
 * - Система ярлыков и корзины
 * - Настройки темы и отображения
 * - Авторизация и профиль пользователя
 * - Drag & Drop для изменения порядка заметок
 * 
 * Цветовая схема: официальная палитра SoundCloud
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // ===== ПРОВЕРКА АВТОРИЗАЦИИ =====
    const isAuth = localStorage.getItem("isAuth");
    if (!isAuth) {
        window.location.href = "auth.html";
    }

    // ===== ПЕРЕМЕННЫЕ СОСТОЯНИЯ =====
    let notes = [];              // Массив всех заметок
    let trash = [];              // Массив удалённых заметок (корзина)
    let labels = [];             // Массив ярлыков
    let currentLabelId = null;   // ID текущего выбранного ярлыка для фильтрации
    let draggedNoteId = null;    // ID перетаскиваемой заметки (для Drag & Drop)
    let pendingDeleteId = null;  // ID заметки, ожидающей подтверждения удаления
    let currentNoteForLabel = null; // ID заметки, к которой добавляем ярлык

    // ===== DOM-ЭЛЕМЕНТЫ: ЭКРАНЫ =====
    const notesScreen = document.getElementById("notesScreen");
    const trashScreen = document.getElementById("trashScreen");
    const settingsScreen = document.getElementById("settingsScreen");
    const helpScreen = document.getElementById("helpScreen");
    const labelsScreen = document.getElementById("labelsScreen");
    const labelNotesScreen = document.getElementById("labelNotesScreen");

    // ===== DOM-ЭЛЕМЕНТЫ: НАВИГАЦИЯ =====
    const burger = document.getElementById("burger");
    const sidebar = document.getElementById("sidebar");
    const trashBtn = document.getElementById("trashBtn");
    const notesBtn = document.getElementById("notesBtn");
    const settingsBtn = document.getElementById("settingsBtn");
    const helpBtn = document.getElementById("helpBtn");
    const labelsBtn = document.getElementById("labelsBtn");

    // ===== DOM-ЭЛЕМЕНТЫ: РЕДАКТОР ЗАМЕТОК (ОСНОВНОЙ ЭКРАН) =====
    const collapsed = document.querySelector(".note-collapsed");
    const expanded = document.getElementById("expandedNote");
    const closeBtn = document.getElementById("closeNote");
    const addBtn = document.getElementById("addNote");
    const titleInput = document.getElementById("noteTitle");
    const textInput = document.getElementById("noteText");

    // ===== DOM-ЭЛЕМЕНТЫ: РЕДАКТОР ЗАМЕТОК (ЭКРАН ЯРЛЫКА) =====
    const collapsedLabel = document.querySelector(".note-collapsed-label");
    const expandedLabel = document.getElementById("expandedNoteLabel");
    const closeBtnLabel = document.getElementById("closeNoteLabel");
    const addBtnLabel = document.getElementById("addNoteLabel");
    const titleInputLabel = document.getElementById("noteTitleLabel");
    const textInputLabel = document.getElementById("noteTextLabel");

    // ===== DOM-ЭЛЕМЕНТЫ: ОТОБРАЖЕНИЕ =====
    const notesGrid = document.getElementById("notesGrid");
    const trashGrid = document.getElementById("trashGrid");
    const labelNotesGrid = document.getElementById("labelNotesGrid");
    const searchInput = document.getElementById("searchInput");

    // ===== DOM-ЭЛЕМЕНТЫ: МОДАЛЬНЫЕ ОКНА =====
    const confirmModal = document.getElementById("confirmModal");
    const modalCancel = document.getElementById("modalCancel");
    const modalConfirm = document.getElementById("modalConfirm");
    const modalNoteText = document.getElementById("modalNoteText");
    const addLabelModal = document.getElementById("addLabelModal");
    const modalLabelSelect = document.getElementById("modalLabelSelect");
    const modalAddLabelCancel = document.getElementById("modalAddLabelCancel");
    const modalAddLabelConfirm = document.getElementById("modalAddLabelConfirm");

    // ===== DOM-ЭЛЕМЕНТЫ: ПРОФИЛЬ =====
    const profileWrapper = document.querySelector(".profile-wrapper");
    const profileBtn = document.getElementById("profileBtn");
    const profileDropdown = document.getElementById("profileDropdown");
    const profileEmail = document.getElementById("profileEmail");
    const profileLetter = document.getElementById("profileLetter");
    const profileAvatar = document.getElementById("profileAvatar");
    const avatarInput = document.getElementById("avatarInput");
    const removeAvatarBtn = document.getElementById("removeAvatarBtn");
    const openTrashBtn = document.getElementById("openTrashBtn");

    // ===== DOM-ЭЛЕМЕНТЫ: НАСТРОЙКИ =====
    const detailsToggle = document.getElementById("detailsToggle");
    const confirmDeleteToggle = document.getElementById("confirmDeleteToggle");

    // ===== DOM-ЭЛЕМЕНТЫ: ЯРЛЫКИ =====
    const newLabelInput = document.getElementById("newLabelInput");
    const createLabelBtn = document.getElementById("createLabelBtn");
    const backToLabelsBtn = document.getElementById("backToLabelsBtn");
    const deleteCurrentLabelBtn = document.getElementById("deleteCurrentLabelBtn");

    // ===== ИНИЦИАЛИЗАЦИЯ: ЗАГРУЗКА ДАННЫХ =====
    loadFromStorage();
    loadSettings();
    loadAvatar();
    
    const savedSearch = localStorage.getItem("search") || "";
    searchInput.value = savedSearch;
    renderNotes(savedSearch);
    renderTrash();

    // ===== БОКС: БУРГЕР-МЕНЮ =====
    burger.addEventListener("click", () => {
        sidebar.classList.toggle("closed");
    });

    // ===== АВТОРИЗАЦИЯ: ВЫХОД ИЗ АККАУНТА =====
    document.querySelectorAll("#logoutBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            localStorage.removeItem("isAuth");
            window.location.href = "auth.html";
        });
    });

    // ===== ПРОФИЛЬ: ЗАГРУЗКА ДАННЫХ =====
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser) {
        profileEmail.textContent = savedUser.email;
        profileLetter.textContent = savedUser.email[0].toUpperCase();
    }

    // ===== ПРОФИЛЬ: ОТКРЫТИЕ/ЗАКРЫТИЕ МЕНЮ =====
    profileBtn.addEventListener("click", () => {
        profileDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
        if (!profileWrapper.contains(e.target)) {
            profileDropdown.classList.add("hidden");
        }
    });

    // ===== ПРОФИЛЬ: КОРЗИНА ИЗ МЕНЮ =====
    openTrashBtn.addEventListener("click", () => {
        showScreen(trashScreen);
        renderTrash();
        profileDropdown.classList.add("hidden");
    });

    // ===== АВАТАР: ЗАГРУЗКА =====
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

    // ===== АВАТАР: ЗАГРУЗКА ФАЙЛА =====
    avatarInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Файл слишком большой. Максимальный размер: 2MB");
            return;
        }

        if (!file.type.match(/image\/(png|jpg|jpeg|gif|webp)/)) {
            alert("Поддерживаются только изображения: PNG, JPG, JPEG, GIF, WebP");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target.result;
            const img = new Image();
            img.onload = () => {
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

    // ===== АВАТАР: УДАЛЕНИЕ =====
    removeAvatarBtn.addEventListener("click", () => {
        localStorage.removeItem("profileAvatar");
        loadAvatar();
        profileDropdown.classList.add("hidden");
    });

    // ===== РЕДАКТОР: ОТКРЫТИЕ/ЗАКРЫТИЕ (ОСНОВНОЙ ЭКРАН) =====
    collapsed.addEventListener("click", () => {
        collapsed.style.display = "none";
        expanded.style.display = "flex";
        titleInput.focus();
    });

    closeBtn.addEventListener("click", () => {
        expanded.style.display = "none";
        collapsed.style.display = "block";
        clearInputs();
    });

    // ===== РЕДАКТОР: ДОБАВЛЕНИЕ ЗАМЕТКИ (ОСНОВНОЙ ЭКРАН) =====
    addBtn.addEventListener("click", () => {
        const title = titleInput.value.trim();
        const text = textInput.value.trim();

        if (!title && !text) return;

        const note = {
            id: Date.now(),
            order: Date.now(),
            title: escapeHtml(title),
            text: escapeHtml(text),
            labels: [] // Обязательно добавляем поле labels
        };

        notes.push(note);
        saveToStorage();
        renderNotes(searchInput.value);

        clearInputs();
        expanded.style.display = "none";
        collapsed.style.display = "block";
    });

    // ===== РЕДАКТОР: ОТКРЫТИЕ/ЗАКРЫТИЕ (ЭКРАН ЯРЛЫКА) =====
    collapsedLabel.addEventListener("click", () => {
        collapsedLabel.style.display = "none";
        expandedLabel.style.display = "flex";
        titleInputLabel.focus();
    });

    closeBtnLabel.addEventListener("click", () => {
        expandedLabel.style.display = "none";
        collapsedLabel.style.display = "block";
        clearInputs();
    });

    // ===== РЕДАКТОР: ДОБАВЛЕНИЕ ЗАМЕТКИ С ЯРЛЫКОМ =====
    addBtnLabel.addEventListener("click", () => {
        const title = titleInputLabel.value.trim();
        const text = textInputLabel.value.trim();

        if (!title && !text) return;

        const note = {
            id: Date.now(),
            order: Date.now(),
            title: escapeHtml(title),
            text: escapeHtml(text),
            labels: currentLabelId ? [currentLabelId] : []
        };

        notes.push(note);
        saveToStorage();
        renderLabelNotes(searchInput.value);
        renderNotes(searchInput.value);

        clearInputs();
        expandedLabel.style.display = "none";
        collapsedLabel.style.display = "block";
    });

    // ===== ПОИСК: DEBOUNCE ФУНКЦИЯ =====
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // ===== ПОИСК: ЭКРАНИРОВАНИЕ СПЕЦСИМВОЛОВ ДЛЯ REGEXP =====
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ===== ПОИСК: ПОДСВЕТКА НАЙДЕННОГО ТЕКСТА =====
    function highlightText(text, query) {
        if (!query || !text) return text || "";
        const safeQuery = escapeRegExp(query);
        const regex = new RegExp(`(${safeQuery})`, "gi");
        // Экранируем текст перед заменой, чтобы не ломать HTML
        const escapedText = escapeHtml(text);
        return escapedText.replace(regex, `<span class="highlight">$1</span>`);
    }

    // ===== НАСТРОЙКИ: ПРОВЕРКА "ПОКАЗЫВАТЬ ПОДРОБНОСТИ" =====
    function isDetailsEnabled() {
        const settings = JSON.parse(localStorage.getItem("settings")) || {};
        return settings.details || false;
    }

    // ===== РЕНДЕРИНГ: СПИСОК ЗАМЕТОК =====
    function renderNotes(filter = "") {
        notesGrid.innerHTML = "";
        
        const filtered = notes.filter(note => {
            const searchText = ((note.title || "") + " " + (note.text || "")).toLowerCase();
            return searchText.includes(filter.toLowerCase());
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

            // ===== DRAG & DROP: ИСПРАВЛЕННАЯ ЛОГИКА =====
            el.addEventListener("dragstart", (e) => {
                draggedNoteId = note.id;
                // Сохраняем ID в dataTransfer для надёжности
                e.dataTransfer.setData("text/plain", note.id);
                el.classList.add("dragging");
            });
            
            el.addEventListener("dragend", () => {
                el.classList.remove("dragging");
                draggedNoteId = null;
            });
            
            el.addEventListener("dragover", (e) => {
                e.preventDefault(); // Обязательно для разрешения drop
                el.classList.add("drag-over");
            });
            
            el.addEventListener("dragleave", () => {
                el.classList.remove("drag-over");
            });
            
            el.addEventListener("drop", (e) => {
                e.preventDefault();
                el.classList.remove("drag-over");
                
                // Получаем ID из dataTransfer (надёжнее замыкания)
                const draggedId = Number(e.dataTransfer.getData("text/plain") || draggedNoteId);
                const targetId = Number(el.dataset.id);
                
                // Валидация
                if (!draggedId || !targetId || draggedId === targetId) return;
                
                const draggedIndex = notes.findIndex(n => n.id === draggedId);
                const targetIndex = notes.findIndex(n => n.id === targetId);
                
                if (draggedIndex === -1 || targetIndex === -1) {
                    console.warn("Drag&Drop error: note not found", { draggedId, targetId });
                    return;
                }
                
                // Перемещаем элемент в массиве
                const [draggedItem] = notes.splice(draggedIndex, 1);
                notes.splice(targetIndex, 0, draggedItem);
                
                // Обновляем порядок
                notes.forEach((n, idx) => n.order = idx);
                
                // Сохраняем и перерисовываем
                saveToStorage();
                renderNotes(searchInput.value);
            });
            // ===== КОНЕЦ DRAG & DROP =====

            // Подготовка текста с подсветкой поиска
            const title = note.title || "Без названия";
            const text = note.text || "";
            const titleHtml = highlightText(title, filter);
            const textHtml = highlightText(text, filter);
            
            // Генерация HTML для ярлыков
            let labelsHtml = "";
            if (note.labels && Array.isArray(note.labels) && note.labels.length) {
                labelsHtml = `<div class="note-labels">${note.labels.map(labelId => {
                    const label = labels.find(l => l.id == labelId);
                    return label ? `<span class="label-tag" data-label-id="${label.id}">${escapeHtml(label.name)}</span>` : '';
                }).join('')}</div>`;
            }

            // Формирование HTML карточки
            if (detailsEnabled) {
                el.innerHTML = `
                    <h3>${titleHtml}</h3>
                    <p class="note-text expanded">${textHtml}</p>
                    ${labelsHtml}
                    <div class="note-card-actions">
                        <button class="delete-btn" data-id="${note.id}">Удалить</button>
                        <button class="add-label-btn" data-id="${note.id}">+ Ярлык</button>
                    </div>
                `;
            } else {
                el.innerHTML = `
                    <h3>${titleHtml}</h3>
                    <p class="note-text truncated">${textHtml}</p>
                    ${labelsHtml}
                    <div class="note-card-actions">
                        <button class="delete-btn" data-id="${note.id}">Удалить</button>
                        <button class="add-label-btn" data-id="${note.id}">+ Ярлык</button>
                    </div>
                `;
            }
            notesGrid.appendChild(el);
        });
    }

    // ===== НАСТРОЙКИ: ПРОВЕРКА "ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ" =====
    function isConfirmDeleteEnabled() {
        const settings = JSON.parse(localStorage.getItem("settings")) || {};
        return settings.confirmDelete !== false;
    }

    // ===== УДАЛЕНИЕ: ФУНКЦИЯ УДАЛЕНИЯ ЗАМЕТКИ =====
    function deleteNoteById(id) {
        const index = notes.findIndex(n => n.id === id);
        if (index !== -1) {
            const [removed] = notes.splice(index, 1);
            trash.push(removed);
            saveToStorage();
        }
        renderNotes(searchInput.value);
        if (currentLabelId) renderLabelNotes(searchInput.value);
    }

    // ===== ОБРАБОТЧИК: КЛИКИ ПО КАРТОЧКАМ ЗАМЕТОК =====
    notesGrid.addEventListener("click", (e) => {
        // Удаление заметки
        if (e.target.classList.contains("delete-btn")) {
            const id = Number(e.target.dataset.id);
            if (isConfirmDeleteEnabled()) {
                const note = notes.find(n => n.id === id);
                if (note) {
                    const preview = note.title || (note.text || "").replace(/<[^>]*>/g, '') || "Без названия";
                    modalNoteText.textContent = `Вы уверены, что хотите удалить заметку "${preview.substring(0, 50)}${preview.length > 50 ? '...' : ''}"?`;
                }
                pendingDeleteId = id;
                confirmModal.style.display = "flex";
                confirmModal.classList.remove("hidden");
            } else {
                deleteNoteById(id);
            }
        }
        
        // Добавление ярлыка к заметке
        if (e.target.classList.contains("add-label-btn")) {
            const id = Number(e.target.dataset.id);
            currentNoteForLabel = id;
            modalLabelSelect.innerHTML = '<option value="">Выберите ярлык</option>';
            labels.forEach(label => {
                const option = document.createElement("option");
                option.value = label.id;
                option.textContent = escapeHtml(label.name);
                modalLabelSelect.appendChild(option);
            });
            addLabelModal.style.display = "flex";
            addLabelModal.classList.remove("hidden");
        }
        
        // Клик по ярлыку для фильтрации
        if (e.target.classList.contains("label-tag")) {
            const labelId = Number(e.target.dataset.labelId);
            const label = labels.find(l => l.id == labelId);
            if (label) {
                currentLabelId = labelId;
                searchInput.value = "";
                renderLabelNotes();
                localStorage.setItem("search", "");
                showScreen(labelNotesScreen);
                if (backToLabelsBtn) backToLabelsBtn.style.display = "inline-block";
                if (deleteCurrentLabelBtn) deleteCurrentLabelBtn.style.display = "inline-block";
            }
        }
    });

    // ===== МОДАЛЬНОЕ ОКНО: ОТМЕНА УДАЛЕНИЯ =====
    modalCancel.addEventListener("click", () => {
        confirmModal.style.display = "none";
        confirmModal.classList.add("hidden");
        pendingDeleteId = null;
    });

    // ===== МОДАЛЬНОЕ ОКНО: ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ =====
    modalConfirm.addEventListener("click", () => {
        if (pendingDeleteId !== null) {
            deleteNoteById(pendingDeleteId);
            if (currentLabelId) renderLabelNotes();
        }
        confirmModal.style.display = "none";
        confirmModal.classList.add("hidden");
        pendingDeleteId = null;
    });

    // Закрытие модального окна при клике вне его
    confirmModal.addEventListener("click", (e) => {
        if (e.target === confirmModal) {
            confirmModal.style.display = "none";
            confirmModal.classList.add("hidden");
            pendingDeleteId = null;
        }
    });

    // ===== МОДАЛЬНОЕ ОКНО: ДОБАВЛЕНИЕ ЯРЛЫКА - ОТМЕНА =====
    modalAddLabelCancel.addEventListener("click", () => {
        addLabelModal.style.display = "none";
        addLabelModal.classList.add("hidden");
        currentNoteForLabel = null;
    });

    // ===== МОДАЛЬНОЕ ОКНО: ДОБАВЛЕНИЕ ЯРЛЫКА - ПОДТВЕРЖДЕНИЕ =====
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
        addLabelModal.classList.add("hidden");
        currentNoteForLabel = null;
    });

    // ===== КОРЗИНА: РЕНДЕРИНГ =====
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
            const text = (note.text || "").replace(/<[^>]*>/g, '');
            
            el.innerHTML = `
                <h3>${escapeHtml(note.title || "Без названия")}</h3>
                <p class="note-text ${textClass}">${escapeHtml(text)}</p>
                <button class="restore-btn" data-id="${note.id}">Восстановить</button>
                <button class="delete-forever-btn" data-id="${note.id}">Удалить навсегда</button>
            `;
            trashGrid.appendChild(el);
        });
    }

    // ===== КОРЗИНА: ОБРАБОТЧИКИ КНОПОК =====
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

    // ===== ЯРЛЫКИ: РЕНДЕРИНГ СПИСКА =====
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
        
        // Обработчики для элементов списка
        document.querySelectorAll(".label-name").forEach(el => {
            el.addEventListener("click", (e) => {
                const id = Number(el.dataset.id);
                currentLabelId = id;
                searchInput.value = "";
                renderLabelNotes();
                localStorage.setItem("search", "");
                showScreen(labelNotesScreen);
                if (backToLabelsBtn) backToLabelsBtn.style.display = "inline-block";
                if (deleteCurrentLabelBtn) deleteCurrentLabelBtn.style.display = "inline-block";
            });
        });
        
        document.querySelectorAll(".delete-label-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = Number(btn.dataset.id);
                deleteLabelById(id);
            });
        });
    }

    // ===== ЯРЛЫКИ: УДАЛЕНИЕ ЯРЛЫКА =====
    function deleteLabelById(labelId) {
        labels = labels.filter(l => l.id !== labelId);
        
        notes.forEach(note => {
            if (note.labels && Array.isArray(note.labels)) {
                note.labels = note.labels.filter(l => l !== labelId);
            }
        });
        
        saveToStorage();
        
        if (currentLabelId === labelId) {
            currentLabelId = null;
            showScreen(labelsScreen);
        }
        
        renderLabelsList();
        renderNotes(searchInput.value);
    }

    // ===== ЯРЛЫКИ: РЕНДЕРИНГ ЗАМЕТОК ПО ЯРЛЫКУ =====
    function renderLabelNotes(filter = "") {
        if (!labelNotesGrid) return;
        labelNotesGrid.innerHTML = "";
        
        if (!currentLabelId) return;
        
        const label = labels.find(l => l.id == currentLabelId);
        if (!label) {
            labelNotesGrid.innerHTML = `<p class="empty-state">Ярлык не найден</p>`;
            return;
        }
        
        let filteredNotes = notes.filter(note => 
            note.labels && Array.isArray(note.labels) && note.labels.includes(currentLabelId)
        );
        
        if (filter) {
            filteredNotes = filteredNotes.filter(note => {
                const text = ((note.title || "") + " " + (note.text || "")).toLowerCase();
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

            // ===== DRAG & DROP (аналогично renderNotes) =====
            el.addEventListener("dragstart", (e) => {
                draggedNoteId = note.id;
                e.dataTransfer.setData("text/plain", note.id);
                el.classList.add("dragging");
            });
            
            el.addEventListener("dragend", () => {
                el.classList.remove("dragging");
                draggedNoteId = null;
            });
            
            el.addEventListener("dragover", (e) => {
                e.preventDefault();
                el.classList.add("drag-over");
            });
            
            el.addEventListener("dragleave", () => {
                el.classList.remove("drag-over");
            });
            
            el.addEventListener("drop", (e) => {
                e.preventDefault();
                el.classList.remove("drag-over");
                
                const draggedId = Number(e.dataTransfer.getData("text/plain") || draggedNoteId);
                const targetId = Number(el.dataset.id);
                
                if (!draggedId || !targetId || draggedId === targetId) return;
                
                const draggedIndex = notes.findIndex(n => n.id === draggedId);
                const targetIndex = notes.findIndex(n => n.id === targetId);
                
                if (draggedIndex === -1 || targetIndex === -1) return;
                
                const [draggedItem] = notes.splice(draggedIndex, 1);
                notes.splice(targetIndex, 0, draggedItem);
                
                notes.forEach((n, idx) => n.order = idx);
                saveToStorage();
                
                renderLabelNotes(searchInput.value);
                renderNotes(searchInput.value);
            });

            const title = note.title || "Без названия";
            const text = note.text || "";
            const titleHtml = highlightText(title, filter);
            const textHtml = highlightText(text, filter);
            
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

    // ===== ЯРЛЫКИ: УДАЛЕНИЕ ЗАМЕТКИ С ЭКРАНА ЯРЛЫКА =====
    labelNotesGrid.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn-label")) {
            const id = Number(e.target.dataset.id);
            if (isConfirmDeleteEnabled()) {
                const note = notes.find(n => n.id === id);
                if (note) {
                    const preview = note.title || (note.text || "").replace(/<[^>]*>/g, '') || "Без названия";
                    modalNoteText.textContent = `Вы уверены, что хотите удалить заметку "${preview.substring(0, 50)}${preview.length > 50 ? '...' : ''}"?`;
                }
                pendingDeleteId = id;
                confirmModal.style.display = "flex";
                confirmModal.classList.remove("hidden");
            } else {
                deleteNoteById(id);
                renderLabelNotes();
            }
        }
        
        if (e.target.classList.contains("remove-label-btn")) {
            const id = Number(e.target.dataset.id);
            const note = notes.find(n => n.id === id);
            if (note && currentLabelId && Array.isArray(note.labels)) {
                note.labels = note.labels.filter(l => l !== currentLabelId);
                saveToStorage();
                renderLabelNotes(searchInput.value);
                renderNotes(searchInput.value);
            }
        }
    });

    // ===== НАВИГАЦИЯ: ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ =====
    function showScreen(screen) {
        [notesScreen, trashScreen, settingsScreen, helpScreen, labelsScreen, labelNotesScreen].forEach(s => {
            if (s) s.style.display = "none";
        });
        if (screen) screen.style.display = "block";
    }

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

    // ===== ЯРЛЫКИ: КНОПКИ НАВИГАЦИИ =====
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

    // ===== ЯРЛЫКИ: СОЗДАНИЕ НОВОГО ЯРЛЫКА =====
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
                name: escapeHtml(name)
            };
            labels.push(newLabel);
            saveToStorage();
            renderLabelsList();
            newLabelInput.value = "";
        });
    }

    // ===== НАСТРОЙКИ: ЗАГРУЗКА =====
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
            if (themeRadio) {
                themeRadio.checked = true;
                applyTheme(settings.theme);
            }
        }
    }

    // ===== НАСТРОЙКИ: СОХРАНЕНИЕ =====
    function saveSettings() {
        const settings = {
            details: detailsToggle.checked,
            confirmDelete: confirmDeleteToggle.checked,
            theme: document.querySelector('input[name="theme"]:checked')?.id || "darkTheme"
        };
        localStorage.setItem("settings", JSON.stringify(settings));
        applyTheme(settings.theme);
        renderNotes(searchInput.value);
        if (trashScreen.style.display !== "none") {
            renderTrash();
        }
    }

    // ===== НАСТРОЙКИ: ПРИМЕНЕНИЕ ТЕМЫ =====
    function applyTheme(themeId) {
        document.body.classList.remove("light-theme", "dark-theme");
        
        if (themeId === "lightTheme") {
            document.body.classList.add("light-theme");
        } else if (themeId === "darkTheme") {
            document.body.classList.add("dark-theme");
        } else if (themeId === "systemTheme") {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.body.classList.add("dark-theme");
            } else {
                document.body.classList.add("light-theme");
            }
        }
    }

    detailsToggle?.addEventListener("change", saveSettings);
    confirmDeleteToggle?.addEventListener("change", saveSettings);

    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener("change", saveSettings);
    });

    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            const settings = JSON.parse(localStorage.getItem("settings")) || {};
            if (settings.theme === "systemTheme") {
                applyTheme("systemTheme");
            }
        });
    }

    // ===== LOCALSTORAGE: СОХРАНЕНИЕ =====
    function saveToStorage() {
        localStorage.setItem("notes", JSON.stringify(notes));
        localStorage.setItem("trash", JSON.stringify(trash));
        localStorage.setItem("labels", JSON.stringify(labels));
        localStorage.setItem("search", searchInput.value);
    }

    // ===== LOCALSTORAGE: ЗАГРУЗКА =====
    function loadFromStorage() {
        notes = JSON.parse(localStorage.getItem("notes")) || [];
        trash = JSON.parse(localStorage.getItem("trash")) || [];
        labels = JSON.parse(localStorage.getItem("labels")) || [];
        
        // Гарантируем, что у всех заметок есть поле labels как массив
        notes.forEach(note => {
            if (!note.labels || !Array.isArray(note.labels)) {
                note.labels = [];
            }
        });
    }

    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
    function clearInputs() {
        if (titleInput) titleInput.value = "";
        if (textInput) textInput.value = "";
        if (titleInputLabel) titleInputLabel.value = "";
        if (textInputLabel) textInputLabel.value = "";
    }

    function escapeHtml(str) {
        if (!str) return "";
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ===== ПОИСК: ОБРАБОТЧИК ВВОДА =====
    const handleSearch = debounce((value) => {
        if (labelNotesScreen.style.display === "block") {
            renderLabelNotes(value);
        } else if (notesScreen.style.display === "block") {
            renderNotes(value);
        }
        localStorage.setItem("search", value);
    }, 300);

    searchInput.addEventListener("input", (e) => {
        handleSearch(e.target.value);
    });

}); // End of DOMContentLoaded