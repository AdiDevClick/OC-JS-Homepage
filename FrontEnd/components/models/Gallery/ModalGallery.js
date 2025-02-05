import { fetchJSON, fetchTemplate } from "../../functions/api.js";
import { createElement, wait } from "../../functions/dom.js";
import { UniqueSet } from "../UniqueSet.js";
import {
    categoryError,
    emptyImg,
    notAllowedFile,
    notLogged,
    postError,
    titleError,
} from "./gallerySettings.js";

/**
 * @typedef {object} User
 * @property {number} id - L'ID de l'utilisateur
 * @property {string} token - Le token fourni par le serveur pour l'authentification
 */

/**
 * @typedef {object} Gallery
 * @property {Function} works - Récupère l'iterateur de projets.
 * @property {Function} categories - Récupère l'iterateur de catégories.
 * @property {Function} displayWork - Affiche le projet sur la splashscreen.
 * @property {PropertyKey} worksTemplate - Récupère le template pour les projets.
 * @property {PropertyKey} worksTarget - Récupère la target qui recevra l'élément.
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
    /** @type {HTMLElement} */
    #modalContainer;
    /** @type {HTMLElement} */
    #content;
    /** @type {HTMLElement} */
    #HTMLMain = document.querySelector("main");
    /** @type {MutationObserver} */
    #observer;
    /** @type {AbortController} */
    #controller;
    /** @type {MapIterator} */
    #errorsFound = new UniqueSet();
    /** @type {SetIterator} */
    #validInputs = new Set();
    /** @type {number} */
    #fileSize = 4;
    #allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];
    /** @type {string} */
    #imgURL = "";
    #handleObserver = (mutationList) => {
        mutationList.forEach((mutation) => {
            // console.log(mutation.addedNodes[0] instanceof HTMLFormElement);
            if (
                mutation.addedNodes.length > 0 &&
                mutation.addedNodes[0].tagName === "FORM"
            ) {
                // this.#validInputs = new Set();
                const form = mutation.addedNodes[0];
                let alert = this.#modal.querySelector(".error");
                if (!alert) {
                    alert = createElement("p", {
                        class: "error",
                    });
                }

                // Create select option categories
                this.#createModalCategories(category);

                // Events
                title.addEventListener(
                    "input",
                    (e) => {
                        try {
                            if (e.target.value.toString().trim() === "") {
                                throw new Error(titleError);
                            }
                            alert.remove();

                            this.#errorsFound.delete(e.target);
                            this.#checkValidity(
                                this.#validInputs,
                                "title",
                                "add"
                            );

                            e.target.removeAttribute("style");
                        } catch (error) {
                            this.#displayErrorMessage(error, alert, e.target);
                            this.#errorsFound.set(e.target, error.message);
                            this.#checkValidity(
                                this.#validInputs,
                                "title",
                                "delete",
                                e.target
                            );
                        }
                    },
                    { signal: this.#controller.signal }
                );

                category.addEventListener(
                    "change",
                    (e) => {
                        try {
                            if (e.target.value == 0) {
                                throw new Error(categoryError);
                            }
                            alert.remove();

                            this.#errorsFound.delete(e.target);
                            this.#checkValidity(
                                this.#validInputs,
                                "category",
                                "add"
                            );

                            e.target.removeAttribute("style");
                        } catch (error) {
                            this.#displayErrorMessage(error, alert, e.target);
                            this.#errorsFound.set(e.target, error.message);
                            this.#checkValidity(
                                this.#validInputs,
                                "category",
                                "delete",
                                e.target
                            );
                        }
                    },
                    { signal: this.#controller.signal }
                );

                file.addEventListener(
                    "change",
                    (e) => {
                        try {
                            if (e.target.files.length === 0) {
                                throw new Error(emptyImg);
                            }

                            const file = e.target.files[0];

                            // Check file size & type
                            this.#fileChecker(file);

                            alert.remove();
                            e.target.parentElement.removeAttribute("style");

                            // Create URL to add to the background: url()
                            this.#imgURL = URL.createObjectURL(file);
                            e.currentTarget.classList.add("filled");
                            e.target.parentElement.style.backgroundImage = `url(${
                                this.#imgURL
                            })`;

                            this.#errorsFound.delete(
                                e.currentTarget.parentElement
                            );
                            this.#checkValidity(
                                this.#validInputs,
                                "file",
                                "add"
                            );
                        } catch (error) {
                            this.#displayErrorMessage(
                                error,
                                alert,
                                e.target,
                                e.target.parentElement
                            );
                            this.#errorsFound.set(
                                e.currentTarget.parentElement,
                                error.message
                            );
                            this.#checkValidity(
                                this.#validInputs,
                                "file",
                                "delete",
                                e.currentTarget.parentElement
                            );
                        }
                    },
                    { signal: this.#controller.signal }
                );

                button.addEventListener(
                    "click",
                    (e) => {
                        if (this.#validInputs.size == 3)
                            this.#onSubmit(e, form, alert);
                    },
                    { signal: this.#controller.signal }
                );

                // Validity check in order to re-enable button
                document.addEventListener(
                    "validity",
                    (e) => {
                        if (this.#validInputs.size == 3) {
                            button.removeAttribute("disabled");
                        } else {
                            if (!button.getAttribute("disabled"))
                                button.disabled = true;
                        }

                        if (this.#errorsFound.size() > 0) {
                            alert.innerText = this.#errorsFound
                                .entries()
                                .next().value[1];

                            this.#content.append(alert);
                            // this.#displayErrorMessage(
                            //     errorFounds.entries().next().value[1],
                            //     alert,
                            //     e.detail
                            // );
                        }
                    },
                    { signal: this.#controller.signal }
                );
            }
        });
    };

    /**
     * @param {Gallery[]} filterModule - Instance de la classe Gallery.
     * @param {User[]} user - Un objet représentant l'utilisateur.
     */
    constructor(filterModule, user) {
        this.#filterModule = filterModule;
        this.#user = user;

        if (!this.#checkUser()) {
            window.location = "index.html";
            throw new Error(notLogged);
        }

        // Init modal
        this.#initModal();
    }

    /**
     * Initialise la création de la modale
     * Applique les event listeners initiaux
     */
    async #initModal() {
        // const target = document.querySelector("main");
        let modal = this.#HTMLMain.querySelector("#modal-layout");
        if (!modal) {
            modal = await fetchTemplate(
                "../templates/modal-template.html",
                "#modal-layout"
            );
            this.#HTMLMain.append(modal);
        }

        this.#modal = modal.content.firstElementChild.cloneNode(true);
        this.#modal.removeAttribute("aria-hidden");
        this.#modal.setAttribute("aria-modal", true);
        this.#content = this.#modal.querySelector(".modal__content");

        this.#HTMLMain.append(this.#modal);

        // Create listeners
        this.#initListeners(this.#modal, this.#modal.dataset.elements);

        // Display works
        this.#addWorks();

        // Create mutation obs
        this.#createObs(this.#content);

        return this.#modal;
    }

    /**
     * Envoi un formData au serveur contenant image/category/title.
     * Lorsque l'envoi est correcte, le Projet sera affiché sur la page.
     * @param {SubmitEvent} e
     * @param {HTMLFormElement} form
     * @param {HTMLElement} alert - Le conteneur de l'alerte
     * @param {number} retries - Le nombre d'essais en cas de failure
     * @param {number} delay - Le délai entre chaque retry
     * @returns
     */
    async #onSubmit(e, form, alert, retries = 3, delay = 1000) {
        e.preventDefault();
        const datas = new FormData(form);
        for (const data of datas) {
            try {
                if (data[0] === "image") {
                    this.#fileChecker(data[1]);
                    // const img = this.#imgURL.split(window.location.href)[1];
                    // const img =
                    //     "http://localhost:5678/images/" +
                    //     this.#imgURL.split(window.location.href)[1];
                    // datas.delete("file");
                    // datas.set(
                    //     "image",
                    //     `image=@${img}.png;type=${data[1].type}`
                    // );
                    // datas.set("image", data[1].name);
                    // datas.set("image", img + ".png");
                }

                if (data[0] === "category" && data[1] == 0) {
                    throw new Error(categoryError);
                }

                if (data[0] === "title" && data[1].toString().trim() === "") {
                    throw new Error(titleError);
                }
            } catch (error) {
                this.#displayErrorMessage(error, alert, e.target);
                return false;
                //     e.currentTarget.parentElement,
                //     error.message
                // );
                // this.#checkValidity(
                //     this.#validInputs,
                //     "file",
                //     "delete",
                //     e.currentTarget.parentElement
                // );
            }
        }

        if (this.#errorsFound.size() != 0 && this.#validInputs.size != 3) {
            return;
        }

        try {
            const response = await fetchJSON(
                "http://localhost:5678/api/works",
                {
                    method: "POST",
                    headers: {
                        Authorization: "Bearer " + this.#user.token,
                    },
                    body: datas,
                }
            );

            if (!response.ok && response.ok !== undefined) {
                throw new Error(postError);
            }

            // Saving the new item
            this.#filterModule.works().set(response.id, response);

            // Display the item to the user
            this.#filterModule.displayWork(
                response,
                this.#filterModule.worksTemplate,
                this.#filterModule.worksTarget,
                "work"
            );
            const work = this.#filterModule.works().get(response.id);

            work.work.scrollIntoView({ behavior: "smooth", block: "center" });
            await wait(200);
            // let lastKnownScrollPosition = 0;
            // let ticking = false;
            work.work.focus();
            // document.addEventListener(
            //     "scrollend",
            //     () => {
            //         // lastKnownScrollPosition = window.scrollY;
            //     },
            //     { once: true }
            // );
            this.#modalContainer.style.position = "absolute";
            this.#modalContainer.style.inset = "0";
            const workOffsets = work.work.getBoundingClientRect();

            const leftPosition =
                this.#modalContainer.offsetLeft - work.work.offsetLeft;

            this.#modalContainer.style.transform = `translate3d(-${leftPosition}px, ${workOffsets.top}px, 100px) scale(0)`;
            this.#modalContainer.style.opacity = "0";

            this.#modalContainer.addEventListener(
                "transitionend",
                () => {
                    // Clear listeners and iterators
                    this.#controller.abort();
                    this.#validInputs.clear();
                    this.#errorsFound.clear();

                    this.#closeModal(this.#modal);
                    // work.work.style.scale = "1.05";
                    work.work.style.animation = "bounce 0.5s ease";
                },
                {
                    once: true,
                }
            );
        } catch (error) {
            if (retries > 0) {
                // await new Promise((res) => setTimeout(res, delay));
                await wait(delay, "Attente pour un nouvel essai");
                // Exponential backoff
                return this.#onSubmit(e, form, alert, retries - 1, delay * 2);
            }
            this.#displayErrorMessage(error, alert, e.target);
        }
    }

    /**
     * Crer un Mutation Obs qui vérifie les children
     * @param {HTMLElement} element - L'élément à observer
     */
    #createObs(element) {
        this.#observer = new MutationObserver(this.#handleObserver);
        this.#observer.observe(element, { childList: true });
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
        const button = modal.querySelector(".js-button");

        // Close Button
        if (currentTarget.classList.contains("js-close")) {
            this.#closeModal(modal);
        }

        // Arrow Button
        if (currentTarget.classList.contains("js-arrow")) {
            // let content = document.querySelector("#modal-layout")
            this.#content.classList.add("hidden");
            this.#content.addEventListener(
                "transitionend",
                () => {
                    const errorMessage = modal.querySelector(".error");
                    if (errorMessage) {
                        this.#controller.abort();
                        this.#validInputs.clear();
                        this.#errorsFound.clear();
                    }
                    this.#controller.abort();
                    // Hide content
                    this.#content.innerHTML = "";
                    // Display works
                    this.#addWorks();

                    button.innerText = "Ajouter une photo";
                    button.removeAttribute("disabled");

                    this.#initListeners(modal, this.#modal.dataset.elements);

                    this.#content.classList.remove("hidden");
                },
                { once: true }
            );
        }

        // Add picture Button
        if (currentTarget.classList.contains("js-button")) {
            // let content = document.querySelector("#modal-add-picture-layout");
            this.#content.classList.add("hidden");
            this.#content.addEventListener(
                "transitionend",
                async () => {
                    this.#content.innerHTML = "";

                    let formTemplate = modal.querySelector(
                        "#modal-add-picture-layout"
                    );

                    if (!formTemplate) {
                        formTemplate = await fetchTemplate(
                            "../templates/modal-template.html",
                            "#modal-add-picture-layout"
                        );
                        this.#HTMLMain.append(formTemplate);
                    }
                    const template =
                        formTemplate.content.firstElementChild.cloneNode(true);

                    this.#content.append(template);
                    this.#content.classList.remove("hidden");
                    button.innerText = "Valider";
                    button.disabled = true;
                },
                { once: true }
            );
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
        this.#modalContainer.removeEventListener(
            "click",
            this.#stopPropagation
        );
        modal.remove();
    }

    #stopPropagation(e) {
        e.stopPropagation();
    }

    /**
     * Crer les différentes catégorie du formulaire
     */
    #createModalCategories(categories) {
        // Create every categories from DB
        this.#filterModule.categories().forEach((element) => {
            if (element.name !== "Tous") {
                const option = createElement("option", {
                    value: element.id,
                });
                option.innerText = element.name;
                categories.append(option);
            }
        });

        // Create default & empty choice
        const emptyOption = createElement("option", {
            value: 0,
            selected: "",
        });
        categories.prepend(emptyOption);
    }

    /**
     * Crer un event qui vérifie quand l'iterator est solicité.
     * @param {Array} iterator - L'itérator
     * @param {string} name - Le nom à rajouter
     * @param {string} type - La commande à exécuter : "add" ou "delete"
     */
    #checkValidity(iterator, name, type, input = null) {
        if (type === "add") iterator.add(name);
        if (type === "delete") iterator.delete(name);
        const event = new CustomEvent("validity", {
            detail: input,
        });

        document.dispatchEvent(event);
    }

    /**
     * Ajoute l'alerte et display le message d'erreur
     * avec un effet
     * @param {string} error - L'erreur à afficher
     * @param {HTMLElement} alert - Le conteneur de l'alerte
     * @param {HTMLElement} input
     * @param {HTMLElement} previewTarget - Pour l'input file seulement. L'élément qui recevra l'effet boxshadow
     */
    #displayErrorMessage(error, alert, input, previewTarget = null) {
        this.#content.append(alert);
        alert.innerText = error.message;
        alert.style.margin = "unset";

        input.value = "";
        input.classList.remove("filled");

        if (previewTarget) {
            previewTarget.removeAttribute("style");
            previewTarget.style.boxShadow = "0px 4px 14px rgb(255 0 0 / 29%)";
        }

        input.style.boxShadow = "0px 4px 14px rgb(255 0 0 / 29%)";
    }

    /**
     * Utilise la fonction displayWork de Gallery
     * pour afficher les projets
     */
    async #addWorks() {
        // const target = document.querySelector("main");

        let template = await fetchTemplate(
            "../templates/modal-template.html",
            "#modal-preview-layout"
        );

        this.#HTMLMain.append(template);

        this.#filterModule
            .works()
            .values()
            .forEach((work) => {
                const displayedWork = this.#filterModule.displayWork(
                    work,
                    template,
                    this.#content,
                    "preview"
                );
                // const trashIcon = work.querySelector(".icon");
                displayedWork.querySelector(".icon").addEventListener(
                    "click",
                    (e) => {
                        this.#onDelete(e, work);
                    },
                    {
                        once: true,
                    }
                );
            });
    }

    /**
     * Supprime l'élément HTML du DOM,
     * de l'itérator et de la Database.
     * @param {PointerEvent} e
     * @param {HTMLElement} element - L'élement HTML à supprimer
     */
    async #onDelete(e, element) {
        e.preventDefault();

        try {
            // Delete from DB
            const response = await fetch(
                "http://localhost:5678/api/works/" + element.id,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: "Bearer " + this.#user.token,
                    },
                }
            );

            if (!response.ok && response.ok !== undefined) {
                throw new Error("Error");
            }

            // Update user feedback
            element.preview.remove();
            element.work.remove();
            // Update Map() iterator
            this.#filterModule.works().delete(element.id);
        } catch (error) {
            console.log(error.message);
        }
    }

    /**
     * Target tous les éléments passés en paramètre et applique
     * un "click" event
     * @param {HTMLElement} modal - Le HTML de la modale
     * @param {string} elements - Un string de selectors
     */
    #initListeners(modal, elements) {
        this.#controller = new AbortController();
        this.#elements = modal.querySelectorAll(elements);

        // Create listeners on all elements
        this.#elements.forEach((elem) => {
            elem.addEventListener("click", (e) => this.#onClick(e, modal), {
                once: true,
                signal: this.#controller.signal,
            });
        });

        // Close modal on outside modal click
        modal.addEventListener("click", () => this.#closeModal(modal), {
            once: true,
            signal: this.#controller.signal,
        });

        // Sets the stopPropagation for outside click
        this.#modalContainer = modal.querySelector(".js-modal-stop");

        this.#modalContainer.addEventListener("click", this.#stopPropagation, {
            signal: this.#controller.signal,
        });
    }

    /**
     * Vérifie que le fichier à la bonne taille
     * Vérifie que le fichier est autorisé
     * @param {object} file - L'objet contenant les informations du fichier
     */
    #fileChecker(file) {
        if (!this.#allowedFileTypes.includes(file.type)) {
            throw new Error(notAllowedFile);
        }

        if (file.size > this.#fileSize * 1024 * 1024) {
            throw new Error(`Votre image ne peut dépasser ${fileSize}MB`);
        }
    }

    /**
     * Recréer la modale si nécessaire
     */
    get initModal() {
        this.#initModal();
    }
}
