//Закрытие и открытие бургер-меню
document.addEventListener("DOMContentLoaded", () => {

const burger = document.getElementById("burger");
const sidebar = document.getElementById("sidebar");

burger.addEventListener("click", () => {
    sidebar.classList.toggle("closed");
});

});

//Раскрытие карточки с заметкой
const collapsed = document.querySelector(".note-collapsed");
const expanded = document.querySelector(".note-expanded");

collapsed.addEventListener("click", () => {
    collapsed.style.display = "none";
    expanded.style.display = "flex";
});