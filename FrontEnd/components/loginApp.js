import { LoginHandler } from "./models/LoginHandler.js";

const form = document.querySelector("form");

const onReady = function (form) {
    new LoginHandler(form);
};

window.addEventListener("DOMContentLoaded", onReady(form));
