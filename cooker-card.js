const VERSION = "0.1.0";

function classify(state) {
  const s = (state || "").toLowerCase();
  if (/error|fault/.test(s)) return "error";
  if (/paused/.test(s)) return "paused";
  if (/completed|finish/.test(s)) return "done";
  if (/cooking|preheat|busy|updating|scheduling|keep warm/.test(s)) return "active";
  return "idle";
}

const CLASS_COLOR = {
  error: "#e53935",
  paused: "#f5a623",
  done: "#43a047",
  idle: null, // foloseste accentul din config
  active: null, // foloseste accentul din config
};

class CookerCard extends HTMLElement {
  setConfig(config) {
    if (!config?.entity) throw new Error("Definește entitatea de stare (status) a aparatului");
    this.config = {
      name: "Aparat bucătărie",
      room: "",
      icon: "mdi:pot-steam",
      accent: "#ff8a00",
      selects: [],
      switches: [],
      actions: [],
      ...config,
    };
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) { this._hass = hass; this.render(); }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, rows: 7, min_columns: 6, min_rows: 6 }; }

  state() { return this._hass?.states[this.config.entity]; }
  primaryEntity() {
    const id = this.config.primary?.entity;
    return id ? this._hass?.states[id] : undefined;
  }
  leftTimeMinutes() {
    const id = this.config.left_time;
    const s = id ? this._hass?.states[id] : undefined;
    const v = Number(s?.state);
    if (!s || !Number.isFinite(v)) return null;
    return s.attributes.unit_of_measurement === "s" ? v / 60 : v;
  }

  async setPrimary(delta) {
    const p = this.primaryEntity();
    if (!p || !this.config.primary) return;
    const step = Number(p.attributes.step) || 1;
    const min = Number(p.attributes.min) ?? -Infinity;
    const max = Number(p.attributes.max) ?? Infinity;
    const next = Math.min(max, Math.max(min, Number(p.state) + delta * step));
    await this._hass.callService("number", "set_value", { entity_id: p.entity_id, value: next });
  }
  selectOption(entity_id, option) {
    return this._hass.callService("select", "select_option", { entity_id, option });
  }
  toggleSwitch(entity_id) {
    return this._hass.callService("switch", "toggle", { entity_id });
  }
  pressButton(entity_id) {
    return this._hass.callService("button", "press", { entity_id });
  }

  render() {
    const s = this.state();
    if (!s || !this.shadowRoot) return;
    const cls = classify(s.state);
    const ACCENT = CLASS_COLOR[cls] || this.config.accent;
    const active = cls === "active";

    const p = this.primaryEntity();
    const pVal = p ? Number(p.state) : null;
    const pMin = p ? Number(p.attributes.min ?? 0) : 0;
    const pMax = p ? Number(p.attributes.max ?? 100) : 100;
    const pUnit = this.config.primary?.unit ?? p?.attributes?.unit_of_measurement ?? "";
    const pct = p ? Math.max(0, Math.min(100, ((pVal - pMin) / (pMax - pMin)) * 100)) : 0;

    const leftMin = this.leftTimeMinutes();
    const fault = this.config.fault ? this._hass?.states[this.config.fault] : undefined;
    const hasFault = fault && fault.state && !/none|ok|^0$/i.test(fault.state);

    this.shadowRoot.innerHTML = `<style>
      :host{display:block;height:100%}ha-card{height:100%;box-sizing:border-box;overflow:hidden;position:relative;padding:20px;border-radius:26px;background:linear-gradient(160deg,var(--ha-card-background,var(--card-background-color)) 30%,color-mix(in srgb,${ACCENT} 12%,var(--ha-card-background,var(--card-background-color))));transition:background .5s ease}
      ha-card:before{content:"";position:absolute;width:280px;height:280px;border-radius:50%;right:-110px;top:-130px;background:${ACCENT};filter:blur(58px);opacity:${active ? ".22" : ".08"};animation:${active ? "breathe 2.4s ease-in-out infinite" : "none"}}@keyframes breathe{50%{transform:scale(1.22);opacity:.32}}
      .head,.title,.status,.controls,.facts,.selects,.switches,.actions{display:flex;align-items:center}.head{position:relative;justify-content:space-between}.title{gap:11px}.title ha-icon{--mdc-icon-size:30px;color:${ACCENT}}.title strong{display:block;font-size:18px}.title small{opacity:.62}.status{gap:7px;padding:7px 12px;border-radius:99px;font-weight:700;background:color-mix(in srgb,${ACCENT} 15%,transparent);color:${ACCENT}}.status i{width:9px;height:9px;border-radius:50%;background:currentColor;animation:${active ? "pulse 1.5s infinite" : "none"}}@keyframes pulse{70%{box-shadow:0 0 0 10px transparent}0%{box-shadow:0 0 0 0 currentColor}}
      .dial{position:relative;width:190px;height:190px;margin:14px auto 8px;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 32% 26%,color-mix(in srgb,var(--card-background-color) 100%,white 6%),color-mix(in srgb,var(--card-background-color) 84%,black 10%));box-shadow:0 1px 0 rgba(255,255,255,.35) inset,0 -8px 16px rgba(0,0,0,.14) inset,0 10px 24px rgba(0,0,0,.16)}
      .ring{position:absolute;inset:9px;border-radius:50%;background:conic-gradient(from 225deg,${ACCENT} calc(${pct} * .75%),color-mix(in srgb,var(--secondary-text-color) 16%,transparent) 0 75%,transparent 0);mask:radial-gradient(circle,transparent 60%,#000 61%);transition:background .7s ease}
      .center{text-align:center;z-index:1}.val{font-size:46px;font-weight:300;line-height:1}.val sup{font-size:16px}.caption{font-size:12px;opacity:.64;margin-top:5px}
      .controls{position:absolute;inset:50% -2px auto;transform:translateY(-50%);justify-content:space-between}.ctl{border:0;width:44px;height:44px;border-radius:50%;background:var(--card-background-color);color:var(--primary-text-color);font-size:22px;cursor:pointer;transition:.2s;box-shadow:0 2px 6px rgba(0,0,0,.14),0 0 0 1px color-mix(in srgb,var(--secondary-text-color) 14%,transparent) inset}.ctl:active{transform:scale(.9)}
      .facts{justify-content:center;gap:26px;margin:8px 0 12px;flex-wrap:wrap}.fact{text-align:center}.fact b{display:block;font-size:15px;color:${hasFault ? "#e53935" : "inherit"}}.fact span{font-size:11px;opacity:.62}
      .selects{gap:8px;flex-wrap:wrap;margin-bottom:10px}.selects label{display:flex;flex-direction:column;gap:3px;font-size:10px;opacity:.62;flex:1;min-width:110px}select{font:inherit;font-size:13px;padding:7px 8px;border-radius:10px;border:1px solid color-mix(in srgb,var(--secondary-text-color) 22%,transparent);background:var(--card-background-color);color:var(--primary-text-color)}
      .switches{gap:8px;flex-wrap:wrap;margin-bottom:10px}.chip{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:99px;border:0;font-size:12px;font-weight:600;cursor:pointer;background:color-mix(in srgb,var(--secondary-text-color) 9%,transparent);color:var(--primary-text-color)}.chip.on{background:${ACCENT};color:#fff}
      .actions{gap:9px}.act{flex:1;border:0;border-radius:14px;padding:10px 8px;background:color-mix(in srgb,var(--secondary-text-color) 9%,transparent);color:var(--primary-text-color);font-weight:700;cursor:pointer;font-size:13px}.act.primary{color:#fff;background:${ACCENT}}.act ha-icon{--mdc-icon-size:16px;vertical-align:middle;margin-right:4px}
    </style><ha-card>
      <div class="head"><div class="title"><ha-icon icon="${this.config.icon}"></ha-icon><div><strong>${this.config.name}</strong><small>${this.config.room}</small></div></div><div class="status"><i></i>${s.state}</div></div>
      ${p ? `<div class="dial"><div class="ring"></div><div class="controls"><button class="ctl minus">−</button><button class="ctl plus">+</button></div><div class="center"><div class="val">${Number.isFinite(pVal) ? pVal : "—"}<sup>${pUnit}</sup></div><div class="caption">${this.config.primary?.label || "setare"}</div></div></div>` : ""}
      <div class="facts">
        ${leftMin != null ? `<div class="fact"><b>${leftMin.toFixed(0)} min</b><span>Timp rămas</span></div>` : ""}
        ${hasFault ? `<div class="fact"><b>${fault.state}</b><span>Eroare</span></div>` : ""}
      </div>
      <div class="selects">${this.config.selects.map((sel, i) => {
        const es = this._hass.states[sel.entity];
        if (!es) return "";
        const opts = (es.attributes.options || []).map((o) => `<option value="${o}" ${o === es.state ? "selected" : ""}>${o}</option>`).join("");
        return `<label>${sel.name}<select data-sel="${i}">${opts}</select></label>`;
      }).join("")}</div>
      <div class="switches">${this.config.switches.map((sw, i) => {
        const es = this._hass.states[sw.entity];
        if (!es) return "";
        return `<button class="chip ${es.state === "on" ? "on" : ""}" data-sw="${i}">${sw.name}</button>`;
      }).join("")}</div>
      <div class="actions">${this.config.actions.map((a, i) => `<button class="act ${a.primary ? "primary" : ""}" data-act="${i}">${a.icon ? `<ha-icon icon="${a.icon}"></ha-icon>` : ""}${a.name}</button>`).join("")}</div>
    </ha-card>`;

    if (p) {
      this.shadowRoot.querySelector(".minus").onclick = () => this.setPrimary(-1);
      this.shadowRoot.querySelector(".plus").onclick = () => this.setPrimary(1);
    }
    this.shadowRoot.querySelectorAll("[data-sel]").forEach((el) => {
      const cfg = this.config.selects[Number(el.dataset.sel)];
      el.onchange = () => this.selectOption(cfg.entity, el.value);
    });
    this.shadowRoot.querySelectorAll("[data-sw]").forEach((el) => {
      const cfg = this.config.switches[Number(el.dataset.sw)];
      el.onclick = () => this.toggleSwitch(cfg.entity);
    });
    this.shadowRoot.querySelectorAll("[data-act]").forEach((el) => {
      const cfg = this.config.actions[Number(el.dataset.act)];
      el.onclick = () => this.pressButton(cfg.entity);
    });
  }
}

customElements.define("cooker-card", CookerCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "cooker-card", name: "Cooker Card", description: "Card animat pentru aparate de bucătărie (air fryer, rice cooker etc.)" });
console.info(`%c COOKER-CARD %c v${VERSION} `, "color:white;background:#ff8a00;font-weight:700", "color:#ff8a00;background:white");
