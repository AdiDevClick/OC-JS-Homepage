import { fetchTemplate } from "../../functions/api.js";

/**
 * @typedef {object} User
 * @property {number} id
 * @property {string} token
 */

/**
 * @typedef {object} Gallery
 * @property {Function} works
 * @property {Function} displayWork
 */
export class ModalGallery {
    /** @type {Gallery} */
    #filterModule;
    /** @type {User[]} */
    #user;
    /** @type {Array<NodeList>} */
    #elements;
    /** @type {HTMLElement} */
    #modal;

    /**
     * @param {Gallery[]} filterModule - Instance de la classe Gallery.
     * @param {User[]} user - Un objet représentant l'utilisateur.
     */
    constructor(filterModule, user) {
        this.#filterModule = filterModule;
        this.#user = user;

        if (!this.#checkUser()) {
            window.location = "index.html";
            throw new Error("Veuillez vous connecter");
        }

        // Init modal
        this.#initModal();
    }

    /**
     * Initialise la création de la modale
     * Applique les event listeners initiaux
     */
    async #initModal() {
        const target = document.querySelector("main");
        let modal = target.querySelector("#modal-layout");
        if (!modal) {
            modal = await fetchTemplate(
                "../templates/modal-template.html",
                "#modal-layout"
            );
            target.append(modal);
        }

        this.#modal = modal.content.firstElementChild.cloneNode(true);
        this.#modal.removeAttribute("aria-hidden");
        this.#modal.setAttribute("aria-modal", true);
        target.append(this.#modal);

        // Create listeners
        this.#initListeners(this.#modal, this.#modal.dataset.elements);

        // Display works
        this.#addWorks();
        return this.#modal;
    }

    /**
     * Vérifie que l'utilisateur à les droits
     * pour créer la modale
     * @returns {boolean}
     */
    #checkUser() {
        let user = localStorage.getItem("user");
        if (!user) return false;
        user = JSON.parse(user);
        if (this.#user.token === user.token) return true;
        return false;
    }

    /**
     * Vérifie les différents éléments cliqués.
     * Chaque élément aura une fonction différente.
     * @param {PointerEvent} event
     * @param {HTMLElement} modal - La modale
     */
    #onClick(event, modal) {
        event.preventDefault();
        const currentTarget = event.currentTarget;

        // Close Button
        if (currentTarget.classList.contains("js-close")) {
            this.#closeModal(modal);
        }

        // Arrow Button
        if (currentTarget.classList.contains("js-arrow")) {
            console.log(event.target);
        }

        // Add picture Button
        if (currentTarget.classList.contains("js-button")) {
            const content = modal.querySelector(".modal__content");
            console.log(content);
        }
    }

    /**
     * Supprime la modale du DOM
     * @param {HTMLElement} modal - La modale
     * @returns
     */
    #closeModal(modal) {
        if (modal === null) return;
        modal.setAttribute("aria-hidden", true);
        modal.removeAttribute("aria-modal");
        modal
            .querySelector(".js-modal-stop")
            .removeEventListener("click", this.#stopPropagation);
        modal.remove();
    }

    #stopPropagation(e) {
        e.stopPropagation();
    }

    /**
     * Utilise la fonction displayWork de Gallery
     * pour afficher les projets
     */
    async #addWorks() {
        const content = this.#modal.querySelector(".modal__content");
        let template = await fetchTemplate(
            "../templates/modal-template.html",
            "#modal-preview-layout"
        );

        this.#filterModule.works().forEach((work) => {
            this.#filterModule.displayWork(work, template, content);
        });
    }

    /**
     * Target tous les éléments passé en paramètre et applique
     * un "click" event
     * @param {HTMLElement} modal - Le HTML de la modale
     * @param {string} elements - Un string de selectors
     */
    #initListeners(modal, elements) {
        this.#elements = modal.querySelectorAll(elements);

        this.#elements.forEach((elem) => {
            elem.addEventListener("click", (e) => this.#onClick(e, modal));
        });
        modal.addEventListener("click", () => this.#closeModal(modal), {
            once: true,
        });
        modal
            .querySelector(".js-modal-stop")
            .addEventListener("click", this.#stopPropagation);
    }

    /**
     * Recréer la modale si nécessaire
     */
    get initModal() {
        this.#initModal();
    }
}
