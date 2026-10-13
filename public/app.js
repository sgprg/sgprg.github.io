// The links and all panels remain readable if scripting is unavailable.
const tabGroups = [];
for (const group of document.querySelectorAll("[data-tab-group]")) {
  const list = [...group.querySelectorAll("[data-tab-list]")].find(
    (item) => item.closest("[data-tab-group]") === group,
  );
  if (!list) continue;
  const tabs = [...list.querySelectorAll("a[href^='#']")];
  const panels = tabs.map((tab) => document.getElementById(tab.hash.slice(1)));
  if (!tabs.length || panels.some((panel) => !panel)) continue;
  const vertical = list.dataset.tabOrientation === "vertical";
  list.setAttribute("role", "tablist");
  list.setAttribute("aria-orientation", vertical ? "vertical" : "horizontal");
  function select(index) {
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
  }
  tabs.forEach((tab, i) => {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[i].id);
    panels[i].setAttribute("role", "tabpanel");
    panels[i].setAttribute("aria-labelledby", tab.id);
    panels[i].tabIndex = 0;
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      select(i);
      history.replaceState(null, "", tab.hash);
    });
    tab.addEventListener("keydown", (event) => {
      const next = vertical ? "ArrowDown" : "ArrowRight";
      const previous = vertical ? "ArrowUp" : "ArrowLeft";
      let index;
      if (event.key === next) index = (i + 1) % tabs.length;
      else if (event.key === previous) index = (i - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") index = 0;
      else if (event.key === "End") index = tabs.length - 1;
      else if (event.key === " ") index = i;
      if (index === undefined) return;
      event.preventDefault();
      select(index);
      tabs[index].focus();
      history.replaceState(null, "", tabs[index].hash);
    });
  });
  const initial = panels.findIndex((panel) => panel.id === group.dataset.defaultPanel);
  select(initial < 0 ? 0 : initial);
  group.classList.add("tabs-ready");
  tabGroups.push({ panels, select });
}
function revealHash() {
  const target = document.getElementById(location.hash.slice(1));
  if (!target) return;
  for (const { panels, select } of tabGroups) {
    const index = panels.findIndex((panel) => panel === target || panel.contains(target));
    if (index >= 0) select(index);
  }
}
revealHash();
window.addEventListener("hashchange", revealHash);

const links = [...document.querySelectorAll("nav a")];
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          for (const link of links) {
            if (link.hash === `#${entry.target.id}`)
              link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          }
        }
    },
    { rootMargin: "-15% 0px -55% 0px" },
  );
  document
    .querySelectorAll("main > section[id]")
    .forEach((section) => observer.observe(section));
}
