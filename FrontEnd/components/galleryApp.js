import { Gallery } from "./models/Gallery/Gallery.js";
import { fetchTemplate } from "./functions/api.js";
import { createButtonNearTitle } from "./functions/dom.js";
import { ModalGallery } from "./models/Gallery/ModalGallery.js";

const onReady = async () => {
    // Non logged-user
    const gallery = document.querySelector("#portfolio");
    const filterModule = new Gallery(gallery);

    let loggedUser = localStorage.getItem("user");
    loggedUser = JSON.parse(loggedUser);

    // Admin user
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

            // Handle admin user interactions
            const editButton = document.querySelector(".icon");
            editButton.addEventListener("click", (e) => {
                if (!modal) {
                    modal = new ModalGallery(filterModule, loggedUser);
                } else {
                    modal.initModal;
                }
            });
        } catch (error) {
            console.log(error);
        }
    }
};

/**
 * Déconnecte l'utilisateur
 */
function onLogOut() {
    localStorage.clear("user");
    window.location.reload();
}

if (window.readyState !== "loading") {
    onReady();
} else {
    window.addEventListener("DOMContentLoaded", onReady);
}
