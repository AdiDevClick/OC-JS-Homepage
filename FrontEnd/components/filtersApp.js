import { Filters } from "./models/Filters.js";

const onReady = () => {
    const gallery = document.querySelector("#portfolio");
    new Filters(gallery);
};

if (window.readyState !== "loading") {
    onReady();
} else {
    window.addEventListener("DOMContentLoaded", onReady);
}
