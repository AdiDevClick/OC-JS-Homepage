import { fetchJSON } from "../functions/api.js";
import { createElement } from "../functions/dom.js";
import { UniqueSet } from "./UniqueSet.js";

export class Filters {
    /** @type {HTMLElement} */
    #worksTarget;
    /** @type {HTMLElement} */
    #filtersTarget;
    /** @type {object} */
    #worksElements;
    /** @type {HTMLTemplateElement} */
    #worksTemplate;
    /** @type {MapIterator} */
    #categories;
    /** @type {MapIterator} */
    #works;
    /** @type {Promise} */
    #response;

    /** @param {HTMLElement} element */
    constructor(element) {
        // Filters elements
        this.#filtersTarget = document.querySelector(
            element.dataset.filters_target
        );

        // Projects elements
        this.#worksTarget = document.querySelector(element.dataset.work_target);
        this.#worksTemplate = document.querySelector(
            this.#worksTarget.dataset.template
        );
        this.#worksElements = JSON.parse(this.#worksTarget.dataset.elements);

        // Inits
        this.#initCategories();
        this.#initWorks();
    }

    /**
     * Sauvegarde les catégories de filtres récupérés via
     * l'API dans une Map() array.
     * Affiche les catégories à l'utilisateur
     */
    async #initCategories() {
        const response = await this.#fetchItems(
            "http://localhost:5678/api/categories"
        );

        // Create categories Map() array from the response
        this.#categories = new UniqueSet((element) => element.name, response);

        // Display elements
        this.#displayCategories(this.#categories.values());
    }

    /**
     * Permet de retourner une promesse contenant la Query SQL
     * @param {string} url Endpoint URL
     * @param {object|array} options Objet ou Array à passer si nécéssaire
     * @returns
     */
    async #fetchItems(url, options = {}) {
        try {
            const response = await fetchJSON(url, { options });

            if (!response.ok && response.ok !== undefined) {
                throw new Error(`Erreur HTTP ! Status : ${response.status}`, {
                    cause: {
                        status: response.status,
                        message: response.message,
                        ok: response.ok,
                    },
                });
            }

            return response;
        } catch (error) {
            console.log(error.cause);
        }
    }

    /**
     * Iterate toutes les catégories et crer un élément pour chacunes.
     * Le filtre par défaut "Tous" sera créé.
     * @param {object} categories
     */
    #displayCategories(categories) {
        // Create every categories
        categories.forEach((category) => {
            this.#createFilter(category);
        });

        // Create a default filter "all"
        this.#createFilter({ name: "Tous", id: 0 }, { class: "active" });
    }

    /**
     * Sauvegarde les projets récupérés via
     * l'API dans une Map() array.
     * Affiche les différents projets à l'utilisateur
     */
    async #initWorks() {
        const response = await this.#fetchItems(
            "http://localhost:5678/api/works"
        );

        // Create works Map() array from the response
        this.#works = new UniqueSet((element) => element.id, response);

        // Display elements
        this.#displayWorks(this.#works.values());
    }

    /**
     * Crer un "click" event et toggle la classe ".active"
     * quand l'élément est actif.
     * Quand le filtre est cliqué, seuls les éléments associés seront display.
     * @param {HTMLElement} element
     */
    #createListener(element) {
        element.addEventListener("click", (e) => {
            const filterButton = e.currentTarget;
            this.#categories.values().forEach((element) => {
                if (
                    e.currentTarget !== element.li &&
                    element.li.classList.contains("active")
                )
                    element.li.classList.remove("active");
            });

            filterButton.classList.add("active");

            // Hide non-filtered work and display the asked ones
            this.#displayFilteredWork(filterButton);
        });
    }

    /**
     * Appelle la fonction génératrice de projets pour chaques
     * item passé en paramètre.
     * @param {array} images
     */
    #displayWorks(works) {
        // Create every projects
        works.forEach((work) => {
            this.#displayWork(work);
        });
    }

    /**
     * Génère un li qui intègre un bouton sur le DOM.
     * Un "click" event sera créé pour chaques éléments.
     * L'élément sera enregistré dans le Map() array #categories.
     * @param {object} element Objet contenant l'ID et le texte qui seront intégrés à l'élément créé
     * @param {object} options Objet contenant des attributs pouvant être ajoutés à l'élément créé
     */
    #createFilter(element, options = {}) {
        const listElement = createElement("li", { ...options, id: element.id });
        const button = createElement("button", {
            type: "button",
        });
        button.innerText = element.name;

        // Create EventListener
        this.#createListener(listElement);

        listElement.append(button);

        // Update the Map() array && append elements
        if (element.name === "Tous") {
            // Save the new element inside the Map() array
            this.#categories.set(element.name, {
                id: element.id,
                name: element.name,
                li: listElement,
            });
            this.#filtersTarget.prepend(listElement);
        } else {
            // Save the new element inside the Map() array
            this.#categories.set(element.name, { li: listElement });
            this.#filtersTarget.append(listElement);
        }
    }

    /**
     * Ajout les différents éléments au DOM
     * en prenant en compte les éléments des datasets.
     * Une fois créés, ces éléments sont sauvegardés dans le Map() array #worksTarget
     * @param {object} elements
     */
    #displayWork(elements) {
        const template =
            this.#worksTemplate.content.firstElementChild.cloneNode(true);

        for (const [key, value] of Object.entries(elements)) {
            for (const [element, selector] of Object.entries(
                this.#worksElements
            )) {
                if (element === "title") {
                    template.querySelector(selector).innerText =
                        elements[element];
                }

                if (element === "imageUrl") {
                    template.querySelector(selector).src = elements[element];
                }

                template.dataset.category = elements["categoryId"];
            }

            // Saving element in the Map() array
            this.#works.set(elements.id, { work: template });

            this.#worksTarget.append(template);
        }
    }

    /**
     * Supprime le contenu de la #worksTarget et reappend
     * sur le DOM les différents projets
     * @param {HTMLElement} filterButton
     */
    #displayFilteredWork(filterButton) {
        // Hide content
        this.#worksTarget.classList.add("hidden");

        // On transition(opacity) end
        this.#worksTarget.addEventListener("transitionend", (e) => {
            // Delete content
            this.#worksTarget.innerHTML = "";

            // Reappend new content
            this.#works.forEach((element) => {
                if (
                    element.categoryId.toString() === filterButton.id.toString()
                ) {
                    this.#worksTarget.append(element.work);
                }

                if (filterButton.id.toString() === "0") {
                    this.#worksTarget.append(element.work);
                }
            });

            // Show content
            this.#worksTarget.classList.remove("hidden");
        });
    }
}
