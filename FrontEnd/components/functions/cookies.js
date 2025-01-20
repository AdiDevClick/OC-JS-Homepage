/**
 *
 * @param {string} name Le nom du cookie.
 * @param {string} value La valeur à sauvegarder.
 * @param {number} days Un chiffre représentant le nombre de jours avant expiration.
 * @param {object} cookieOptions Un objet passant les paramètres de la requête
 */
export function setCookie(name, value, days, cookieOptions) {
    // Name
    const cookieName = `${name}=${value ?? ""}`;
    // Expiry
    let date = new Date(Date.now() + days * (24 * 60 * 60 * 1000));
    date = "; expires=" + date.toUTCString();
    // Security
    if (!cookieOptions) {
        cookieOptions = {
            secure: true,
            samesite: "strict",
            httpOnly: true,
            path: "/",
        };
    }

    // Set options string
    const options = Object.entries(cookieOptions)
        .map((k) => {
            if (typeof k[1] == "boolean") return k[0];
            return `${k[0]}=${k[1]}`;
        })
        .join("; ");

    document.cookie = cookieName + "; " + options + date;
}

export function getCookie(name) {
    let cookieArr = document.cookie.split(";");

    for (let i = 0; i < cookieArr.length; i++) {
        let cookiePair = cookieArr[i].split("=");

        if (name == cookiePair[0].trim()) {
            return decodeURIComponent(cookiePair[1]);
        }
    }

    return null;
}

export function setSession(sessionName, items) {
    sessionStorage.setItem(sessionName, JSON.stringify(items));
}

export function setLocalStorage(sessionName, items) {
    localStorage.setItem(sessionName, JSON.stringify(items));
}
