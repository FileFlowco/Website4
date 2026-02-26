"use strict";

/* ===============================
   GLOBAL HELPERS
   =============================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ===============================
   THEME SYSTEM
   =============================== */

const THEME_KEY = "studio.theme";

function getInitialTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  if(saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

applyTheme(getInitialTheme());

const themeBtn = $("#themeBtn");
if(themeBtn){
  themeBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

/* ===============================
   REVEAL ANIMATIONS
   =============================== */

const revealEls = $$(".reveal");
if(revealEls.length){
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting) e.target.classList.add("in");
    });
  }, { threshold: 0.15 });

  revealEls.forEach(el => io.observe(el));
}

/* ===============================
   LEAD STORAGE (SHARED ACROSS PAGES)
   =============================== */

const LEADS_KEY = "studio.leads.v1";

function loadLeads(){
  try{
    const raw = localStorage.getItem(LEADS_KEY);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }catch{
    return [];
  }
}

function saveLeads(leads){
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

function addLead(lead){
  const leads = loadLeads();
  leads.push(lead);
  saveLeads(leads);
  return leads.length;
}

/* ===============================
   LEAD FORM (CONTACT PAGE)
   =============================== */

const leadForm = $("#leadForm");
if(leadForm){
  leadForm.addEventListener("submit", async e => {
    e.preventDefault();

    const fd = new FormData(leadForm);
    const lead = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      company: String(fd.get("company") || "").trim(),
      budget: String(fd.get("budget") || "").trim(),
      message: String(fd.get("message") || "").trim(),
      page: location.pathname,
      userAgent: navigator.userAgent
    };

    if(lead.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) || lead.message.length < 12){
      alert("Invalid form data");
      return;
    }

    addLead(lead);

    const endpoint = document.querySelector('meta[name="lead-endpoint"]')?.content?.trim();
    if(endpoint){
      try{
        await fetch(endpoint,{
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body:JSON.stringify(lead)
        });
      }catch{}
    }

    leadForm.reset();
    alert("Lead saved");
  });
}

/* ===============================
   COMMAND PALETTE (ALL PAGES)
   =============================== */

const commands = [
  { label:"Go Home", action:() => location.href = "./index.html" },
  { label:"Go Systems", action:() => location.href = "./systems.html" },
  { label:"Go Process", action:() => location.href = "./process.html" },
  { label:"Go Intelligence", action:() => location.href = "./intelligence.html" },
  { label:"Go Contact", action:() => location.href = "./contact.html" },
  { label:"Toggle Theme", action:() => themeBtn?.click() }
];

function openCommandPalette(){
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,.55)";
  overlay.style.zIndex = "999";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";

  const box = document.createElement("div");
  box.style.background = "var(--bg1)";
  box.style.border = "1px solid var(--stroke)";
  box.style.borderRadius = "18px";
  box.style.width = "min(520px,90vw)";
  box.style.padding = "12px";

  const list = document.createElement("div");
  list.style.display = "flex";
  list.style.flexDirection = "column";
  list.style.gap = "8px";

  commands.forEach(cmd => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = cmd.label;
    btn.onclick = () => {
      document.body.removeChild(overlay);
      cmd.action();
    };
    list.appendChild(btn);
  });

  box.appendChild(list);
  overlay.appendChild(box);
  overlay.onclick = e => {
    if(e.target === overlay) document.body.removeChild(overlay);
  };

  document.body.appendChild(overlay);
}

document.addEventListener("keydown", e => {
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  if((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k"){
    e.preventDefault();
    openCommandPalette();
  }
});
