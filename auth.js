const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const authBtn = document.getElementById("authBtn");

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

const authMessage = document.getElementById("authMessage");

let isLogin = true;

// переключение вкладок
loginTab.addEventListener("click", () => {
    isLogin = true;

    loginTab.classList.add("active-tab");
    registerTab.classList.remove("active-tab");

    authBtn.textContent = "Войти";
});

registerTab.addEventListener("click", () => {
    isLogin = false;

    registerTab.classList.add("active-tab");
    loginTab.classList.remove("active-tab");

    authBtn.textContent = "Зарегистрироваться";
});

// auth
authBtn.addEventListener("click", () => {

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        authMessage.textContent = "Заполните поля";
        return;
    }

    // регистрация
    if (!isLogin) {

        const user = {
            email,
            password
        };

        localStorage.setItem("user", JSON.stringify(user));

        authMessage.textContent = "Аккаунт создан";

        return;
    }

    // вход
    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (!savedUser) {
        authMessage.textContent = "Пользователь не найден";
        return;
    }

    if (
        savedUser.email === email &&
        savedUser.password === password
    ) {

        localStorage.setItem("isAuth", "true");

        window.location.href = "html_main.html";

    } else {
        authMessage.textContent = "Неверные данные";
    }

});