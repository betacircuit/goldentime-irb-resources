"use strict";

// The HTML retains the resource links even when JavaScript is unavailable.
// New resources are maintained in links.json; no page layout changes are needed.
async function loadResources() {
  const list = document.getElementById("resource-list");
  const count = document.getElementById("resource-count");
  try {
    const response = await fetch("/links.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("Could not load resources");
    const data = await response.json();
    if (!Array.isArray(data.resources)) throw new Error("Invalid resources");

    const entries = data.resources.map(resource => {
      if (!resource || typeof resource.title !== "string" || !resource.title.trim()) {
        throw new Error("Invalid title");
      }
      const pending = resource.status === "pending" && !resource.url;
      let url;
      let localResource = false;
      if (!pending) {
        if (typeof resource.url !== "string") throw new Error("Invalid resource URL");
        const localPath = resource.url.startsWith("/") && !resource.url.startsWith("//");
        url = new URL(resource.url, window.location.origin);
        localResource = localPath && url.origin === window.location.origin;
        if (!localResource && url.protocol !== "https:") throw new Error("Only local paths and HTTPS resources are supported");
      }

      const row = document.createElement("li");
      row.className = "resource";
      const heading = document.createElement("h3");
      if (pending) {
        heading.textContent = resource.title;
        heading.setAttribute("aria-label", `${resource.title} (업로드 예정)`);
        row.append(heading);
        return row;
      }

      const link = document.createElement("a");
      link.className = "resource-title";
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", `${resource.title} (새 탭)`);
      link.textContent = resource.title;
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
      heading.append(link);
      row.append(heading);
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
