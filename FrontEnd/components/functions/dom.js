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
