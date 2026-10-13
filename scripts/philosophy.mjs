import { escapeHtml as e } from "./profile.mjs";

const number = (index) => String(index + 1).padStart(2, "0");
const lines = (text) => e(text).replace(/\n/g, "<br>");
const direction = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5"/></svg>';

export function renderPhilosophy(p) {
  let step = 0;
  return `<section class="vectors-band" id="philosophy" aria-labelledby="philosophy-title">
  <div class="page-width" data-tab-group>
    <div class="philosophy-bar">
      <p class="eyebrow" id="philosophy-title">A working philosophy</p>
      <div class="philosophy-tabs" data-tab-list aria-label="Working philosophy">
        <a id="tab-vectors" href="#philosophy-vectors">Five vectors</a>
        <a id="tab-interviews" href="#philosophy-interviews">PM interviews</a>
        <a id="tab-growth" href="#philosophy-growth">PM growth</a>
      </div>
    </div>
    <div id="philosophy-vectors" class="philosophy-panel">
      <div class="vectors-layout">
        <div class="vectors-intro"><h2 id="vectors-title">Five vectors.<br>Every decision.</h2><p>I use these five lenses to question a design, evaluate a platform and decide what to build next.</p></div>
        <ol class="vectors">${p.vectors.map((v, i) => `<li><span>${number(i)}</span><h3>${e(v.name)}</h3><p>${e(v.description)}</p></li>`).join("")}</ol>
      </div>
    </div>
    <div id="philosophy-interviews" class="philosophy-panel">
      <div class="philosophy-heading"><h2>${lines(p.interviewTitle)}</h2><p>${e(p.interviewIntro)}</p></div>
      <div class="interview-journey">${p.interviewJourney.map((phase) => {
        const start = step + 1;
        return `<section class="journey-phase" aria-labelledby="journey-phase-${start}">
          <div class="journey-phase-heading"><h3 id="journey-phase-${start}">${e(phase.name)}</h3>${direction}</div>
          <ol start="${start}">${phase.steps.map((item) => `<li><span class="journey-number" aria-hidden="true">${number(step++)}</span><div><h4>${e(item.name)}</h4><p>${e(item.description)}</p></div></li>`).join("")}</ol>
        </section>`;
      }).join("")}</div>
    </div>
    <div id="philosophy-growth" class="philosophy-panel">
      <div class="philosophy-heading"><h2>${lines(p.growthTitle)}</h2><p>${e(p.growthIntro)}</p></div>
      <div class="growth-workspace" data-tab-group data-default-panel="growth-layer-1">
        <div class="growth-stack" data-tab-list data-tab-orientation="vertical" aria-label="Layers of PM growth">
          ${p.growthLayers.map((layer, i) => `<a id="tab-growth-${i + 1}" href="#growth-layer-${i + 1}" class="growth-layer"><span class="layer-number">${number(i)}</span><span><strong>${e(layer.name)}</strong><span class="layer-summary">${e(layer.summary)}</span></span>${direction}</a>`).reverse().join("")}
        </div>
        <div class="growth-practices">${p.growthLayers.map((layer, i) => `<section id="growth-layer-${i + 1}" class="growth-detail" aria-labelledby="growth-heading-${i + 1}"><h3 id="growth-heading-${i + 1}"><span>${number(i)}</span> ${e(layer.name)}</h3>${layer.practices.map((practice) => `<article><h4>${e(practice.name)}</h4><p>${e(practice.description)}</p><div class="practice-tip"><span>Try this</span><p>${e(practice.tip)}</p></div></article>`).join("")}</section>`).join("")}</div>
      </div>
    </div>
  </div>
</section>`;
}
