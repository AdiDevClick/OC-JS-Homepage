import { fetchTemplate } from "./functions/api.js";
import { createButtonNearTitle } from "./functions/dom.js";
import { ModalGallery } from "./models/ModalGallery.js";

let loggedUser = localStorage.getItem("user");
loggedUser = JSON.parse(loggedUser);

if (loggedUser && loggedUser.token) {
    try {
        let modal;
        const loginBtn = document.querySelector("#loginbtn");
        loginBtn.innerHTML = "logout";

        loginBtn.addEventListener("click", onLogOut);

        const iconTemplate = await fetchTemplate(
            "../templates/modal-template.html",
            "#edit-button-layout"
        );

        // Creating edit button
        createButtonNearTitle("#portfolio", iconTemplate);

        // Handle user interactions
        const editButton = document.querySelector(".icon");

        editButton.addEventListener("click", (e) => {
            // e.preventDefault();
            if (!modal) {
                modal = new ModalGallery(loggedUser);
            } else {
                modal.test;
            }
        });
    } catch (error) {
        console.log(error);
    }
}

function onLogOut() {
    localStorage.clear("user");
    window.location.reload();
}
