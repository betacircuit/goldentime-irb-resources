"use strict";

// The HTML retains the first real link even when JavaScript is unavailable.
// New resources are maintained in links.json; no page layout changes are needed.
async function loadResources() {
  const list = document.getElementById("resource-list");
  const count = document.getElementById("resource-count");
  try {
    const response = await fetch("/links.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("Could not load resources");
    const data = await response.json();
    if (!Array.isArray(data.resources)) throw new Error("Invalid resources");

    const entries = data.resources.map((resource, index) => {
      if (!resource || typeof resource.title !== "string" || !resource.title.trim()) {
        throw new Error("Invalid title");
      }
      const url = new URL(resource.url);
      if (url.protocol !== "https:") throw new Error("Only HTTPS resources are supported");

      const row = document.createElement("li");
      row.className = "resource";
      const number = document.createElement("span");
      number.className = "resource-number";
      number.setAttribute("aria-hidden", "true");
      number.textContent = String(index + 1).padStart(2, "0");

      const content = document.createElement("div");
      content.className = "resource-content";
      const type = document.createElement("p");
      type.className = "resource-type";
      type.textContent = resource.type || "자료";
      const heading = document.createElement("h3");
      heading.textContent = resource.title;
      content.append(type, heading);
      if (resource.description) {
        const description = document.createElement("p");
        description.className = "resource-description";
        description.textContent = resource.description;
        content.append(description);
      }
      const domain = document.createElement("span");
      domain.className = "resource-domain";
      domain.textContent = url.hostname;
      content.append(domain);

      const link = document.createElement("a");
      link.className = "resource-link";
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", `${resource.title} 자료 열기 (새 탭)`);
      link.textContent = "자료 열기 ";
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("viewBox", "0 0 20 20");
      icon.setAttribute("fill", "none");
      icon.setAttribute("aria-hidden", "true");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M11.5 3.5h5v5M16.5 3.5l-8 8M8.5 4.5h-4v12h12v-4");
      path.setAttribute("stroke", "currentColor");
      path.setAttribute("stroke-width", "1.4");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      icon.append(path);
      link.append(icon);
      row.append(number, content, link);
      return row;
    });

    if (!entries.length) throw new Error("No resources");
    list.replaceChildren(...entries);
    count.textContent = String(entries.length).padStart(2, "0");
  } catch (error) {
    document.getElementById("load-notice").hidden = false;
    console.error("Resource list could not be updated.");
  }
}
loadResources();
