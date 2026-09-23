const copy = document.querySelector(".copy-email");
copy?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(copy.dataset.email);
    copy.textContent = "Email copied";
    document.querySelector("#copy-status").textContent =
      "Email address copied to clipboard.";
    setTimeout(() => {
      copy.textContent = "Copy email address";
    }, 2500);
  } catch {
    document.querySelector("#copy-status").textContent =
      "Copy unavailable. Select the email address above to copy it, or open it to write an email.";
    copy.textContent = "Select the email above to copy";
  }
});
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
    .querySelectorAll("main section[id]")
    .forEach((section) => observer.observe(section));
}
