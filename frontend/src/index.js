import "./styles/output.css";

document.addEventListener("DOMContentLoaded", () => {
  alert("Application started");
});

// NOTE:  MAKESHIFT ROUTING (since we cant use react router)
window.router = {
  // handle page load and backwards forwwards navigation
  init: () => {
    window.addEventListener("popstate", router.handleRoute);
    router.handleRoute();
  },

  // IMPORTANT: add navigation paths here
  handleRoute: () => {
    const path = window.location.pathname;
    console.log("Current Path:", path);

    switch (path) {
      case "/":
        loadContent("/src/pages/home.html");
        break;
      case "/registration":
        loadContent("/src/pages/registrations.html");
        break;
      default:
        loadContent("./pages/home.html");
    }
  },

  navigateTo: (path) => {
    window.history.pushState({}, "", path);
    router.handleRoute();
  },
};

// helper function to load HTML file where user path is
async function loadContent(url) {
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`HTTP error! status : ${response.status}`);
    const html = await response.text();
    document.getElementById("content").innerHTMl = html;
    console.log("Content loaded from:", url);
  } catch (err) {
    console.error("Error loading page:", err);
    document.getElementById("content").innerHTML =
      "<p> ERROR loading page </p>";
  }
}

// init router on page load
document.addEventListener("DOMContentLoaded", () => {
  console.log("page loaded, initializing router");
  router.init();
});
