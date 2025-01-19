/**
 * Fetch API au format JSON
 * @param {string} url Adresse du endpoint
 * @param {json?: object} options Si un array est passé en paramètre,
 * il sera transformé en object
 * @returns {Promise}
 */
export async function fetchJSON(url = "", options = {}) {
    let headers = {
        Accept: "application/json",
        ...options.headers,
    };

    if (options.json) {
        Array.isArray(options.json)
            ? (options.body = Object.fromEntries(options.json))
            : (options.body = JSON.stringify(options.json));
        headers["Content-Type"] = "application/json; charset=UTF-8";
    }

    try {
        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            throw new Error(
                `HTTP Error ! Status : ${response.status} - ${response.message}`,
                {
                    cause: {
                        status: response.status,
                        message: response.message,
                        ok: response.ok,
                    },
                }
            );
        }

        return response.json();
    } catch (error) {
        return error.cause;
    }
}
