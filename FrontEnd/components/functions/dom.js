/**
 * Permet de céer un élément avec les attributs de son choix
 * ex : createElement('li', {
 *      class: 'myClass',
 *      role: 'myRole'
 * })
 * @param {string} tagName
 * @param {object} attributes
 * @returns
 */
export function createElement(tagName = "", attributes = {}) {
    const element = document.createElement(tagName);
    for (const [attribute, value] of Object.entries(attributes)) {
        if (value !== null) {
            element.setAttribute(attribute, value);
        }
    }
    return element;
}

/**
 * Crer un bouton ainsi que le texte associé à côté d'un titre.
 * Utilise un template.
 * @param {string} target - string d'un selecteur
 * @param {HTMLTemplateElement} template - Le Fragment du template
 */
export function createButtonNearTitle(target, template) {
    const icon = template.content.firstElementChild.cloneNode(true);
    const section = document.querySelector(target);
    const title = section.querySelector("h2");
    const titleWrapper = createElement("div", {
        class: "logged-user",
    });
    titleWrapper.append(title, icon);
    section.prepend(titleWrapper);
}
