import "./styles/output.css";

if (process.env.DEBUG) {
  document.addEventListener("DOMContentLoaded", () => {
    alert("Application started");
  });
}

// NOTE:  MAKESHIFT ROUTING (since we cant use react router)
const router = {
  // handle page load and backwards forwwards navigation
  init: () => {
    window.addEventListener("popstate", router.handleRoute);
    router.handleRoute();
  },

  // IMPORTANT: add navigation paths here
  handleRoute: () => {
    const path = window.location.pathname;
    switch (path) {
      case "/":
        loadContent("./pages/index.html");
        break;
      case "/registration":
        loadContent("./pages/registrations.html");
        break;
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
    const html = await response.text();
    document.getElementById("content").innerHTMl = html;
  } catch (err) {
    if (process.env.DEBUG) {
      console.error("Error loading page:", err);
      alert("ERROR loading HTML page", err);
    }
  }
}

// init router on page load
document.addEventListener("DOMContentLoaded", router.init);
