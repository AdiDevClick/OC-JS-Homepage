import { fetchJSON } from "../functions/api.js";
import { setLocalStorage } from "../functions/cookies.js";
import { createElement } from "../functions/dom.js";

export class LoginHandler {
    /** @type {HTMLFormElement} */
    #form;

    /** @type {HTMLFormElement} */
    constructor(form) {
        this.#form = form;
        this.#form.addEventListener("submit", this.#onSubmit);
    }

    /**
     * Vérifie que l'utilisateur soit bien enregistré
     * Renvoi l'utilisateur à la page d'accueil quand tout est correcte
     * @param {SubmitEvent} event
     */
    async #onSubmit(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const datas = new FormData(form);

        let errorCount = 0;
        let email;
        let password;

        for (let [key, value] of datas) {
            value = value.toString().trim();
            if (value === "") {
                errorCount++;
            }
            if (key === "email") {
                email = value.toLowerCase();
            } else {
                password = value;
            }
        }

        const authData = {
            email: email,
            password: password,
        };
        // const authData = {
        //     email: "sophie.bluel@test.tld",
        //     password: "S0phie",
        // };
        try {
            if (errorCount > 0) {
                throw new Error("", {
                    cause: {
                        message: "Veuillez renseigner tous les champs",
                    },
                });
            }

            const response = await fetchJSON(
                "http://localhost:5678/api/users/login",
                {
                    method: "POST",
                    json: authData,
                }
            );

            if (!response.ok && response.ok !== undefined) {
                throw new Error(`HTTP Error ! Status : ${response.status}`, {
                    cause: {
                        status: response.status,
                        message: "Erreur dans l’identifiant ou le mot de passe",
                        ok: response.ok,
                    },
                });
            }

            // Saves API token
            setLocalStorage("user", response);

            // Delete login page from history
            window.history.replaceState({}, document.title, "index.html");
            // Go to new page
            window.location.reload();
        } catch (error) {
            let errorContainer = document.querySelector(".error");
            const main = document.querySelector("#contact");

            if (!errorContainer) {
                errorContainer = createElement("p", {
                    class: "error",
                });
                main.append(errorContainer);
            }

            // Show error msg
            errorContainer.innerText = error.cause.message;
        }
    }
}
