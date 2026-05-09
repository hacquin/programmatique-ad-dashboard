import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Line
} from "recharts";
import * as Papa from "papaparse";
import logoNuru from "./logo.nuru.png";

// =====================================================================
// NURU THEME
// =====================================================================
const NURU = {
  bg: "#0d0b08", bgGrad: "linear-gradient(180deg, #0d0b08 0%, #141110 50%, #0d0b08 100%)",
  card: "#1a1714", cardBorder: "#2a2520",
  gold: "#c4a962", goldLight: "#d4be7a", goldDark: "#a08840", goldMuted: "rgba(196,169,98,0.15)",
  red: "#c43030", redMuted: "rgba(196,48,48,0.15)",
  green: "#4a9e6e", greenMuted: "rgba(74,158,110,0.15)",
  text: "#e8dcc8", textMuted: "#8a7e6d", textDark: "#5c5347",
};
const PIE_PALETTE = ["#c4a962", "#d4815a", "#7a9e5c", "#5a8fb8", "#b86a9e", "#8b7ec8", "#c45a5a"];
const RADAR_PALETTE = ["#f5d742", "#ef4444", "#38bdf8", "#4ade80", "#c084fc", "#fb923c"];
const CHART_GOLD = NURU.gold;
const CHART_GOLD_FILL = "rgba(196,169,98,0.2)";

// =====================================================================
// FORMAT TAXONOMY (kept for demo mode + future multi-channel)
// =====================================================================
const FORMAT_CONFIG = {
  Display: { label: "Display", subFormats: [
    { name: "Medium Rectangle 300x250", size: "300x250" }, { name: "Leaderboard 728x90", size: "728x90" },
    { name: "Half-Page 300x600", size: "300x600" }, { name: "Wide Skyscraper 160x600", size: "160x600" },
    { name: "Mobile Banner 320x50", size: "320x50" }, { name: "Billboard 970x250", size: "970x250" },
  ], description: "Bannieres standards IAB. HTML5 supporte. Tous devices." },
  Native: { label: "Native", subFormats: [
    { name: "In-Feed", size: "1200x627" }, { name: "In-Ad", size: "800x600" }, { name: "Content Recommendation", size: "600x600" },
  ], description: "Annonces integrees au contenu editorial. Headline max 55 car., Body max 120 car." },
  Video: { label: "Video", subFormats: [
    { name: "In-Stream Pre-Roll", size: "16:9" }, { name: "In-Stream Mid-Roll", size: "16:9" },
    { name: "Native Outstream", size: "16:9" }, { name: "Native Video", size: "16:9" }, { name: "In-App Interstitial", size: "Fullscreen" },
  ], description: "MP4, 15-30s recommande. Resolution HD. Max 150MB." },
  CTV: { label: "Connected TV", subFormats: [
    { name: "CTV Pre-Roll", size: "1920x1080" }, { name: "CTV Mid-Roll", size: "1920x1080" }, { name: "CTV Post-Roll", size: "1280x720" },
  ], description: "Spots 15-30s sur ecrans TV. HD 1080p recommande. VAST 2.0/3.0." },
  Audio: { label: "Audio", subFormats: [
    { name: "Audio Pre-Roll", size: "15s" }, { name: "Audio Mid-Roll", size: "30s" }, { name: "Audio Post-Roll", size: "15s" },
  ], description: "MP3/OGG, 15-30s. 128-160 kbps. VAST 2.0+. Non-skippable." },
  "In-Game": { label: "In-Game", subFormats: [
    { name: "Blended Display", size: "Standard IAB" }, { name: "Blended Video", size: "3-12s" },
  ], description: "Formats non-cliquables integres au gameplay." }
};
const ALL_FORMATS = Object.keys(FORMAT_CONFIG);

const CREATIVE_AXES = ["Axe creatif 1", "Axe creatif 2", "Axe creatif 3", "Axe creatif 4", "Axe creatif 5"];

// =====================================================================
// LEXIQUE
// =====================================================================
const LEXIQUE = [
  { term: "Impression", def: "Nombre de fois ou une publicite a ete affichee sur l'ecran d'un utilisateur." },
  { term: "Clic", def: "Action d'un utilisateur qui clique sur une publicite." },
  { term: "CTR (Click-Through Rate)", def: "Taux de clic. Pourcentage d'impressions ayant genere un clic. Formule : Clics / Impressions x 100." },
  { term: "CPM (Cost Per Mille)", def: "Cout pour 1 000 impressions. Indicateur standard du cout d'achat media." },
  { term: "CPC (Cost Per Click)", def: "Cout par clic. Montant moyen paye pour chaque clic. Formule : Depenses / Clics." },
  { term: "CPA (Cost Per Acquisition)", def: "Cout par conversion. Montant moyen paye pour obtenir une conversion." },
  { term: "CPV (Cost Per View)", def: "Cout par vue complete d'une video." },
  { term: "CPL (Cost Per Listen)", def: "Cout par ecoute complete d'un format audio." },
  { term: "VCR (Video Completion Rate)", def: "Taux de completion video. Pourcentage de vues ayant ete regardees jusqu'au bout." },
  { term: "LTR (Listen-Through Rate)", def: "Taux d'ecoute complete d'un format audio." },
  { term: "Viewability", def: "Pourcentage d'impressions reellement visibles a l'ecran selon les standards IAB (50% du format visible pendant 1 seconde minimum, 2 secondes pour la video)." },
  { term: "Quartiles (Q25, Q50, Q75, Q100)", def: "Points de mesure de la progression d'une video : 25%, 50%, 75% et 100% de la duree." },
  { term: "Reach", def: "Nombre d'utilisateurs uniques exposes a la publicite." },
  { term: "Frequence", def: "Nombre moyen de fois ou chaque utilisateur unique a vu la publicite." },
  { term: "Conversion", def: "Action souhaitee realisee par l'utilisateur apres exposition (achat, inscription, telechargement...)." },
  { term: "ROAS (Return On Ad Spend)", def: "Retour sur investissement publicitaire. Revenus generes / Depenses publicitaires." },
  { term: "DSP (Demand-Side Platform)", def: "Plateforme technologique permettant d'acheter des espaces publicitaires en temps reel (ex: StackAdapt, DV360, Xandr)." },
  { term: "RTB (Real-Time Bidding)", def: "Encheres en temps reel. Mecanisme d'achat ou chaque impression est vendue aux encheres en quelques millisecondes." },
  { term: "Native", def: "Format publicitaire qui s'integre visuellement au contenu editorial du site ou il est diffuse." },
  { term: "CTV (Connected TV)", def: "Publicite diffusee sur les televiseurs connectes via des applications de streaming." },
  { term: "In-Game", def: "Publicite integree directement dans l'environnement d'un jeu video, generalement non cliquable." },
  { term: "Axe creatif", def: "Concept ou angle de communication utilise pour une campagne. Chaque campagne peut comporter jusqu'a 5 axes creatifs differents. Un meme axe peut se decliner en plusieurs formats (Display, Video, Audio, In-Game)." },
];

// =====================================================================
// METRIC INFO — definitions affichees via le bouton "?" dans les tableaux/KPIs
// La cle est la version minuscule/normalisee de l'entete de colonne ou du label KPI.
// =====================================================================
const METRIC_INFO = {
  "impressions": { title: "Impressions", desc: "Nombre total de fois où la publicité a été chargée/diffusée sur une page. Ça ne signifie pas qu'elle a été vue — juste qu'elle a été envoyée." },
  "impr.": { title: "Impressions", desc: "Nombre total de fois où la publicité a été chargée/diffusée sur une page." },
  "impressions totales": { title: "Impressions totales", desc: "Nombre total de fois où la publicité a été chargée/diffusée, avant filtrage par la mesure de visibilité." },
  "impressions visibles": { title: "Impressions visibles", desc: "Nombre d'impressions réellement vues selon les standards IAB (50% des pixels visibles pendant 1s en display, 2s en vidéo)." },
  "mesurables": { title: "Mesurables", desc: "Nombre d'impressions que l'outil de tracking a pu analyser. Certaines impressions ne le sont pas à cause de blocages techniques (ad-blockers, iframes sécurisées…)." },
  "vues": { title: "Vues", desc: "Nombre d'impressions mesurables réellement vues selon les standards IAB : 50% des pixels visibles pendant 1s (display) ou 2s (vidéo)." },
  "viewability": { title: "Viewability", desc: "Part des impressions mesurables qui ont été réellement vues. Formule : Vues ÷ Mesurables. Mesure la qualité des emplacements." },
  "viewab.": { title: "Viewability", desc: "Part des impressions mesurables qui ont été réellement vues. Formule : Vues ÷ Mesurables." },
  "taux mesure": { title: "Taux de mesure", desc: "Part des impressions qui ont pu être analysées par l'outil de tracking. Formule : Mesurables ÷ Impressions. Mesure la fiabilité de la donnée collectée." },
  "clics": { title: "Clics", desc: "Nombre de fois où un utilisateur a cliqué sur la publicité." },
  "ctr": { title: "CTR (Click-Through Rate)", desc: "Taux de clic : pourcentage d'impressions ayant généré un clic. Formule : Clics ÷ Impressions × 100." },
  "cpm": { title: "CPM (Cost Per Mille)", desc: "Coût pour 1 000 impressions. Indicateur standard du coût d'achat média. Formule : Dépenses ÷ Impressions × 1 000." },
  "cpc": { title: "CPC (Cost Per Click)", desc: "Coût par clic : montant moyen payé pour chaque clic. Formule : Dépenses ÷ Clics." },
  "cpa": { title: "CPA (Cost Per Acquisition)", desc: "Coût par conversion : montant moyen payé pour obtenir une conversion. Formule : Dépenses ÷ Conversions." },
  "cpv": { title: "CPV (Cost Per View)", desc: "Coût par vue complète d'une vidéo. Formule : Dépenses ÷ Vues complètes." },
  "cpl": { title: "CPL (Cost Per Listen)", desc: "Coût par écoute complète d'un format audio." },
  "vcr": { title: "VCR (Video Completion Rate)", desc: "Taux de complétion vidéo : pourcentage de vues ayant été regardées jusqu'au bout (Q100)." },
  "ltr": { title: "LTR (Listen-Through Rate)", desc: "Taux d'écoute complète d'un format audio (jusqu'à la fin du spot)." },
  "depenses": { title: "Dépenses", desc: "Budget effectivement consommé sur la période, exprimé en euros nets média." },
  "dep.": { title: "Dépenses", desc: "Budget effectivement consommé sur la période." },
  "budget": { title: "Budget", desc: "Enveloppe totale allouée à la campagne ou au canal." },
  "reach": { title: "Reach", desc: "Nombre d'utilisateurs uniques exposés à la publicité (déduplication des impressions)." },
  "reach unique": { title: "Reach unique", desc: "Nombre d'utilisateurs uniques exposés à la publicité (déduplication des impressions)." },
  "frequence": { title: "Fréquence", desc: "Nombre moyen de fois où chaque utilisateur unique a vu la publicité. Formule : Impressions ÷ Reach." },
  "pacing": { title: "Pacing", desc: "Rythme de consommation du budget. 100% = dépense alignée sur le planning. <100% = sous-diffusé, >100% = sur-diffusé." },
  "conversions": { title: "Conversions", desc: "Nombre d'actions souhaitées réalisées après exposition à la publicité (achat, inscription, téléchargement…)." },
  "conv.": { title: "Conversions", desc: "Nombre d'actions souhaitées réalisées après exposition à la publicité." },
  "taux conv.": { title: "Taux de conversion", desc: "Pourcentage de clics ayant généré une conversion. Formule : Conversions ÷ Clics × 100." },
  "q25": { title: "Quartile 25 % (Q25)", desc: "Part des impressions vidéo où l'utilisateur a regardé au moins 25 % de la durée." },
  "q50": { title: "Quartile 50 % (Q50)", desc: "Part des impressions vidéo où l'utilisateur a regardé au moins 50 % de la durée." },
  "q75": { title: "Quartile 75 % (Q75)", desc: "Part des impressions vidéo où l'utilisateur a regardé au moins 75 % de la durée." },
  "q100": { title: "Quartile 100 % (Q100)", desc: "Part des impressions vidéo regardées jusqu'à la fin (équivalent au VCR)." },
  "cpm moyen": { title: "CPM moyen", desc: "Coût pour 1 000 impressions, moyen sur la période. Formule : Dépenses ÷ Impressions × 1 000." },
  "cpc moyen": { title: "CPC moyen", desc: "Coût par clic moyen sur la période. Formule : Dépenses ÷ Clics." },
  "budget total": { title: "Budget total", desc: "Enveloppe totale allouée à la campagne, toutes cibles et canaux confondus." },
  "part des clics": { title: "Part des clics", desc: "Pourcentage des clics totaux capté par un format, une taille ou un canal." },
};
const getMetricInfo = (label) => METRIC_INFO[String(label).toLowerCase().trim()];

// =====================================================================
// DATA GENERATOR (demo mode)
// =====================================================================
function generateDemoData() {
  const rows = [];
  const now = new Date(2026, 2, 20);
  const rnd = (min, max) => min + Math.random() * (max - min);
  const SITES = ["LeMonde.fr","LeFigaro.fr","20Minutes.fr","BFM.fr","LEquipe.fr","Marmiton.fr","Allocine.fr","Spotify","Deezer","YouTube","TF1+","France.tv","Molotov","Twitch","Roblox"];

  for (let d = 0; d < 90; d++) {
    const date = new Date(now); date.setDate(date.getDate() - (89 - d));
    const dateStr = date.toISOString().slice(0, 10);
    ALL_FORMATS.forEach((format) => {
      const cfg = FORMAT_CONFIG[format];
      const activeSubs = cfg.subFormats.filter(() => Math.random() > 0.3);
      if (activeSubs.length === 0) activeSubs.push(cfg.subFormats[0]);
      const hasCreative = ["Display", "Video", "Audio", "In-Game"].includes(format);
      const creativeAxis = hasCreative ? CREATIVE_AXES[Math.floor(Math.random() * CREATIVE_AXES.length)] : "";
      activeSubs.forEach((sub) => {
        let devices;
        if (format === "CTV") devices = ["CTV"];
        else if (format === "Audio") devices = ["Desktop", "Mobile"];
        else if (format === "In-Game") devices = ["Mobile", "Console"];
        else devices = ["Desktop", "Mobile", "Tablet"];
        devices.forEach((device) => {
          const isMobile = device === "Mobile";
          let sitesPool;
          if (format === "Audio") sitesPool = ["Spotify", "Deezer"];
          else if (format === "CTV") sitesPool = ["TF1+", "France.tv", "Molotov"];
          else if (format === "In-Game") sitesPool = ["Roblox", "Twitch"];
          else if (format === "Video") sitesPool = ["YouTube", "TF1+", "Twitch", "LeMonde.fr", "20Minutes.fr"];
          else sitesPool = SITES.slice(0, 7);
          const site = sitesPool[Math.floor(Math.random() * sitesPool.length)];
          let impressions, clicks, cpm, viewability, vcr, ltr, views, listens, conversions, timeOnSite, viewTime, q25, q50, q75, q100;
          vcr = 0; ltr = 0; views = 0; listens = 0; conversions = 0; timeOnSite = 0; viewTime = 0; q25 = 0; q50 = 0; q75 = 0; q100 = 0;
          switch (format) {
            case "Display": impressions = Math.round(rnd(8000, 18000) * (isMobile ? 1.3 : 1)); clicks = Math.round(impressions * rnd(0.08, 0.35) / 100); cpm = rnd(1.2, 4.5); viewability = rnd(48, 78); conversions = Math.round(clicks * rnd(0.015, 0.05)); break;
            case "Native": impressions = Math.round(rnd(5000, 14000) * (isMobile ? 1.4 : 1)); clicks = Math.round(impressions * rnd(0.3, 1.2) / 100); cpm = rnd(3.0, 8.0); viewability = rnd(55, 85); conversions = Math.round(clicks * rnd(0.03, 0.08)); timeOnSite = rnd(25, 90); break;
            case "Video": impressions = Math.round(rnd(3000, 10000) * (isMobile ? 1.2 : 1)); vcr = rnd(55, 92); views = Math.round(impressions * vcr / 100); clicks = Math.round(impressions * rnd(0.3, 1.5) / 100); cpm = rnd(8, 25); viewability = rnd(60, 90); conversions = Math.round(clicks * rnd(0.02, 0.06)); q25 = rnd(85, 98); q50 = rnd(70, 90); q75 = rnd(58, 82); q100 = vcr; break;
            case "CTV": impressions = Math.round(rnd(2000, 8000)); vcr = rnd(88, 99); views = Math.round(impressions * vcr / 100); clicks = 0; cpm = rnd(20, 45); viewability = rnd(90, 99); q25 = rnd(95, 99); q50 = rnd(92, 98); q75 = rnd(90, 96); q100 = vcr; break;
            case "Audio": impressions = Math.round(rnd(4000, 12000)); ltr = rnd(85, 98); listens = Math.round(impressions * ltr / 100); clicks = Math.round(impressions * rnd(0.1, 0.5) / 100); cpm = rnd(10, 22); viewability = 0; conversions = Math.round(clicks * rnd(0.02, 0.05)); break;
            case "In-Game": impressions = Math.round(rnd(5000, 15000)); clicks = 0; cpm = rnd(5, 15); viewability = rnd(70, 95); viewTime = rnd(2, 8); break;
          }
          const spend = +(impressions / 1000 * cpm).toFixed(2);
          rows.push({ date: dateStr, format, subFormat: sub.name, subFormatSize: sub.size, creative: creativeAxis, device, site, impressions, clicks: clicks || 0, ctr: +(impressions > 0 ? ((clicks || 0) / impressions * 100) : 0).toFixed(3), cpm: +cpm.toFixed(2), cpc: clicks > 0 ? +(spend / clicks).toFixed(2) : 0, spend, viewability: +(viewability || 0).toFixed(1), conversions: conversions || 0, cpa: conversions > 0 ? +(spend / conversions).toFixed(2) : 0, vcr: +vcr.toFixed(1), views, cpv: views > 0 ? +(spend / views).toFixed(4) : 0, ltr: +ltr.toFixed(1), listens, cpl: listens > 0 ? +(spend / listens).toFixed(4) : 0, timeOnSite: +timeOnSite.toFixed(0), viewTime: +viewTime.toFixed(1), q25: +q25.toFixed(1), q50: +q50.toFixed(1), q75: +q75.toFixed(1), q100: +q100.toFixed(1) });
        });
      });
    });
  }
  return rows;
}

// =====================================================================
// CSV PARSING UTILS
// =====================================================================
function parseEN(val) {
  if (val == null || val === "" || val === "n/a") return 0;
  const s = String(val).replace(/[€\s%]/g, "").trim();
  if (s === "" || s === "n/a") return 0;
  return parseFloat(s.replace(/,/g, "")) || 0;
}

function parseFR(val) {
  if (val == null || val === "" || val === "n/a") return 0;
  const s = String(val).replace(/[€"%]/g, "").trim();
  if (s === "" || s === "n/a") return 0;
  // French: spaces are thousands separators, comma is decimal
  return parseFloat(s.replace(/\s/g, "").replace(",", ".")) || 0;
}

function parseCampaignName(name) {
  if (!name) return { persona: "", channelType: "" };
  const lastUnderscore = name.lastIndexOf("_");
  if (lastUnderscore === -1) return { persona: name, channelType: "" };
  const persona = name.substring(0, lastUnderscore).trim();
  const typePart = name.substring(lastUnderscore + 1).trim();
  const channelType = typePart.replace(/ Ad$/i, "").trim();
  return { persona, channelType };
}

function normalizeCampaignRow(row) {
  const { persona, channelType } = parseCampaignName(row["Campaign Name"]);
  return {
    campaignName: row["Campaign Name"] || "", persona, channelType,
    status: row["Status"] || "",
    lifetimeBudget: parseEN(row["Lifetime Budget"]),
    mediaCost: parseEN(row["Media Cost"]),
    impressions: parseEN(row["Impressions"]),
    clicks: parseEN(row["Clicks"]),
    conversions: parseEN(row["Convs"]),
    eCPM: parseEN(row["eCPM"]),
    ctr: parseEN(row["CTR"]),
    eCPC: parseEN(row["eCPC"]),
    viewPct: parseEN(row["View %"]),
    uniqueImpressions: parseEN(row["Unique Impressions"]),
    impressionsViewed: parseEN(row["Impressions Viewed"]),
    impressionsMeasurable: parseEN(row["Impressions Measurable"]),
    frequency: parseEN(row["Frequency"]),
    flightStart: row["Flight Date Start"] || "",
    flightEnd: row["Flight Date End"] || "",
    overallPacing: row["Overall Pacing"] || "",
  };
}

function normalizeDomainRow(row) {
  const campaignName = row["Campaign"] || "";
  const { persona, channelType } = parseCampaignName(campaignName);
  return {
    campaignName, persona, channelType,
    domain: row["Domains"] || row["Domain"] || "",
    mediaCost: parseFR(row["Media Cost"]),
    impressions: parseFR(row["Impressions"]),
    clicks: parseFR(row["Clicks"]),
    conversions: parseFR(row["Conversions"]),
    eCPM: parseFR(row["eCPM"]),
    ctr: parseFR(row["CTR"]),
    eCPC: parseFR(row["eCPC"]),
    eCPA: parseFR(row["eCPA"]),
    roas: parseFR(row["ROAS"]),
  };
}

// Matomo exports are usually UTF-16 LE with a BOM. Decode robustly.
function decodeMatomoBuffer(buffer) {
  const view = new Uint8Array(buffer);
  if (view.length >= 2 && view[0] === 0xFF && view[1] === 0xFE) return new TextDecoder("utf-16le").decode(view.subarray(2));
  if (view.length >= 2 && view[0] === 0xFE && view[1] === 0xFF) return new TextDecoder("utf-16be").decode(view.subarray(2));
  if (view.length >= 3 && view[0] === 0xEF && view[1] === 0xBB && view[2] === 0xBF) return new TextDecoder("utf-8").decode(view.subarray(3));
  return new TextDecoder("utf-8").decode(view);
}

// Map utm_content slugs to the dashboard channel taxonomy.
function detectMatomoChannel(content, fallback) {
  const c = String(content || fallback || "").toLowerCase();
  if (/native[_-]?ads?/.test(c)) return "Native";
  if (/meta[_-]?fb|facebook/.test(c)) return "Meta FB";
  if (/meta[_-]?ig|instagram/.test(c)) return "Meta IG";
  if (/display/.test(c)) return "Display";
  return "Autre";
}

function normalizeMatomoRow(row) {
  // Matomo column names contain accented characters; we look up tolerant variants.
  const get = (...keys) => { for (const k of keys) if (row[k] != null && row[k] !== "") return row[k]; return ""; };
  const content = get("Mot-clé - Contenu", "Mot-cle - Contenu", "Mot-clé", "Mot-cle");
  const name = get("Nom");
  return {
    rawName: name,
    campaign: get("Nom de la campagne"),
    content,
    channel: detectMatomoChannel(content, name),
    visits: parseEN(get("Visites")),
    actions: parseEN(get("Actions")),
    bounces: parseEN(get("Rebonds")),
    timeSec: parseEN(get("Temps total passé par les visiteurs (en secondes)", "Temps total passe par les visiteurs (en secondes)")),
    visitsWithConv: parseEN(get("Visites avec conversions")),
    conversions: parseEN(get("Conversions")),
    revenue: parseEN(get("Revenu")),
    uniqueVisitors: parseEN(get("Visiteurs uniques (résumé quotidien)", "Visiteurs uniques (resume quotidien)")),
  };
}

function normalizeCreativeRow(row) {
  const campaignName = row["Campaign"] || "";
  const { persona, channelType } = parseCampaignName(campaignName);
  return {
    campaignName, persona, channelType,
    creativeSize: row["Creative Size"] || "",
    creativeId: row["Creative ID"] || "",
    creativeName: row["Creatives"] || "",
    mediaCost: parseFR(row["Media Cost"]),
    impressions: parseFR(row["Impressions"]),
    clicks: parseFR(row["Clicks"]),
    conversions: parseFR(row["Conversions"]),
    eCPM: parseFR(row["eCPM"]),
    ctr: parseFR(row["CTR"]),
    eCPC: parseFR(row["eCPC"]),
    eCPA: parseFR(row["eCPA"]),
  };
}

// =====================================================================
// PERSISTENCE
// =====================================================================
const STORAGE_KEY = "nuru_dashboard_data_v1";
function loadStoredData() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveStoredData(payload) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (e) { console.warn("Persistance CSV impossible:", e); }
}
function clearStoredData() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// =====================================================================
// UTILS
// =====================================================================
const fmtNum = (n) => { if (n >= 1e6) return (n/1e6).toFixed(1)+"M"; if (n >= 1e3) return (n/1e3).toFixed(1)+"K"; return typeof n==="number" ? n.toLocaleString("fr-FR") : n; };
const fmtCur = (n) => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
const fmtCurDec = (n) => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const fmtPct = (n) => (n||0).toFixed(2)+"%";
const fmtDec = (n) => (n||0).toFixed(2);

function getWeek(dateStr) { const d = new Date(dateStr); const jan1 = new Date(d.getFullYear(),0,1); const days = Math.floor((d-jan1)/86400000); return d.getFullYear()+"-S"+String(Math.ceil((days+jan1.getDay()+1)/7)).padStart(2,"0"); }
function getMonth(dateStr) { return dateStr.slice(0,7); }

// =====================================================================
// MULTI-SELECT COMPONENT
// =====================================================================
function MultiSelect({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const allSelected = selected.length === 0;
  const displayLabel = allSelected ? label : selected.length === 1 ? selected[0] : `${selected.length} selectionnes`;
  const handleClick = useCallback((e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }, []);
  useState(() => { document.addEventListener("mousedown", handleClick); return () => document.removeEventListener("mousedown", handleClick); });
  const toggle = (val) => { if (selected.includes(val)) onChange(selected.filter(v => v !== val)); else onChange([...selected, val]); };
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(!open)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${allSelected ? NURU.cardBorder : NURU.gold}`, background: allSelected ? NURU.card : NURU.goldMuted, color: allSelected ? NURU.text : NURU.gold, fontSize: 12, fontWeight: 500, cursor: "pointer", outline: "none", minWidth: 100, textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{displayLabel}</span>
        <span style={{ fontSize: 8, opacity: 0.6 }}>{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 200, maxHeight: 260, overflowY: "auto", background: NURU.card, border: `1px solid ${NURU.cardBorder}`, borderRadius: 8, zIndex: 60, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", padding: "6px 0" }}>
          <div onClick={() => onChange([])} style={{ padding: "7px 12px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: allSelected ? NURU.gold : NURU.textMuted, display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${NURU.cardBorder}` }}>
            <span style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${allSelected ? NURU.gold : NURU.cardBorder}`, background: allSelected ? NURU.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>{allSelected ? "\u2713" : ""}</span>
            Tous
          </div>
          {options.map(opt => {
            const checked = selected.includes(opt);
            return (
              <div key={opt} onClick={() => toggle(opt)} style={{ padding: "6px 12px", cursor: "pointer", fontSize: 11, color: checked ? NURU.gold : NURU.text, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${checked ? NURU.gold : NURU.cardBorder}`, background: checked ? NURU.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>{checked ? "\u2713" : ""}</span>
                {opt}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =====================================================================
// MAIN COMPONENT
// =====================================================================
export default function ProgrammaticDashboard() {
  // Demo mode state
  const [rawData, setRawData] = useState(generateDemoData);
  const [dataSource, setDataSource] = useState("demo");

  // Campaign mode state
  const [campaignData, setCampaignData] = useState([]);
  const [domainData, setDomainData] = useState([]);
  const [creativeRealData, setCreativeRealData] = useState([]);
  const [matomoData, setMatomoData] = useState([]);
  const [dataMode, setDataMode] = useState("demo"); // "demo" | "campaign"

  // Filters
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [selectedSubFormats, setSelectedSubFormats] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [filterSite, setFilterSite] = useState("All");
  const [dateFrom, setDateFrom] = useState("2025-12-21");
  const [dateTo, setDateTo] = useState("2026-03-20");
  const [selectedPersonas, setSelectedPersonas] = useState([]);
  const [selectedChannelTypes, setSelectedChannelTypes] = useState([]);

  // UI
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedFormatTab, setSelectedFormatTab] = useState("Display");
  const [aggregation, setAggregation] = useState("day");
  const [showLexique, setShowLexique] = useState(false);
  const [lexiqueSearch, setLexiqueSearch] = useState("");
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [dataSubTab, setDataSubTab] = useState("campaigns");
  const [openMetric, setOpenMetric] = useState(null);

  const fileInputRef = useRef(null);
  const campaignFileRef = useRef(null);
  const domainFileRef = useRef(null);
  const creativeFileRef = useRef(null);
  const matomoFileRef = useRef(null);

  // =====================================================================
  // AUTO-LOAD: persisted import (localStorage) > embedded CSVs > demo
  // =====================================================================
  useEffect(() => {
    const parseCsv = (text) => Papa.parse(text.replace(/^\uFEFF/, ""), { header: true, skipEmptyLines: true }).data;

    function hydrateFromStored() {
      const stored = loadStoredData();
      if (!stored) return false;
      try {
        if (stored.mode === "campaign") {
          const camp = parseCsv(stored.campaign || "").map(normalizeCampaignRow).filter(r => r.campaignName);
          if (camp.length === 0) return false;
          const dom = stored.domain ? parseCsv(stored.domain).map(normalizeDomainRow).filter(r => r.domain) : [];
          const crea = stored.creative ? parseCsv(stored.creative).map(normalizeCreativeRow).filter(r => r.creativeName) : [];
          const mato = stored.matomo ? parseCsv(stored.matomo).map(normalizeMatomoRow).filter(r => r.rawName) : [];
          setCampaignData(camp); setDomainData(dom); setCreativeRealData(crea); setMatomoData(mato);
          setDataMode("campaign"); setDataSource(stored.source || "Import campagne"); setRawData([]);
          return true;
        }
        if (stored.mode === "demo-single") {
          const parsed = Papa.parse(stored.csv || "", { header: true, dynamicTyping: true, skipEmptyLines: true }).data;
          if (parsed.length === 0) return false;
          setRawData(parsed); setDataSource(stored.source || "demo"); setDataMode("demo");
          setCampaignData([]); setDomainData([]); setCreativeRealData([]);
          return true;
        }
      } catch { /* ignore corrupted storage */ }
      return false;
    }

    async function loadEmbeddedData() {
      try {
        const [campRes, domRes, creaRes] = await Promise.all([
          fetch(import.meta.env.BASE_URL + "data/Campaign.csv"), fetch(import.meta.env.BASE_URL + "data/Domain.csv"), fetch(import.meta.env.BASE_URL + "data/Creatives.csv")
        ]);
        if (!campRes.ok || !domRes.ok || !creaRes.ok) return;
        const [campText, domText, creaText] = await Promise.all([campRes.text(), domRes.text(), creaRes.text()]);
        const camp = parseCsv(campText).map(normalizeCampaignRow).filter(r => r.campaignName);
        const dom = parseCsv(domText).map(normalizeDomainRow).filter(r => r.domain);
        const crea = parseCsv(creaText).map(normalizeCreativeRow).filter(r => r.creativeName);
        if (camp.length > 0) {
          setCampaignData(camp);
          setDomainData(dom);
          setCreativeRealData(crea);
          setDataMode("campaign");
          setDataSource(camp[0]?.campaignName ? "Campagne reelle" : "campaign");
          setRawData([]);
        }
      } catch { /* stay in demo mode */ }
    }

    if (!hydrateFromStored()) loadEmbeddedData();
  }, []);

  // =====================================================================
  // DEMO MODE: single file import (backward compat)
  // =====================================================================
  const handleFileImport = useCallback(async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true }).data;
    if (parsed.length > 0) {
      setRawData(parsed); setDataSource(file.name); setDataMode("demo");
      setCampaignData([]); setDomainData([]); setCreativeRealData([]);
      saveStoredData({ mode: "demo-single", csv: text, source: file.name });
    }
  }, []);

  // =====================================================================
  // CAMPAIGN MODE: multi-file import
  // =====================================================================
  const handleCampaignImport = useCallback(async () => {
    const campFile = campaignFileRef.current?.files?.[0];
    if (!campFile) return;
    const domFile = domainFileRef.current?.files?.[0];
    const creaFile = creativeFileRef.current?.files?.[0];
    const matoFile = matomoFileRef.current?.files?.[0];
    const readText = (f) => f ? f.text() : Promise.resolve("");
    const readMatomo = (f) => f ? f.arrayBuffer().then(decodeMatomoBuffer) : Promise.resolve("");
    const [campText, domText, creaText, matoText] = await Promise.all([readText(campFile), readText(domFile), readText(creaFile), readMatomo(matoFile)]);
    const parseCsv = (text) => Papa.parse(text.replace(/^\uFEFF/, ""), { header: true, skipEmptyLines: true }).data;
    const camp = parseCsv(campText).map(normalizeCampaignRow).filter(r => r.campaignName);
    const dom = domText ? parseCsv(domText).map(normalizeDomainRow).filter(r => r.domain) : [];
    const crea = creaText ? parseCsv(creaText).map(normalizeCreativeRow).filter(r => r.creativeName) : [];
    const mato = matoText ? parseCsv(matoText).map(normalizeMatomoRow).filter(r => r.rawName) : [];
    if (camp.length > 0) {
      setCampaignData(camp); setDomainData(dom); setCreativeRealData(crea); setMatomoData(mato);
      setDataMode("campaign"); setDataSource("Import campagne"); setRawData([]);
      setShowImportPanel(false); setSelectedPersonas([]); setSelectedChannelTypes([]);
      saveStoredData({ mode: "campaign", campaign: campText, domain: domText, creative: creaText, matomo: matoText, source: "Import campagne" });
    }
  }, []);

  // =====================================================================
  // DEMO MODE: computed data
  // =====================================================================
  const uniqueFormats = useMemo(() => [...new Set(rawData.map(r => r.format))], [rawData]);
  const uniqueSubFormats = useMemo(() => {
    const d = selectedFormats.length > 0 ? rawData.filter(r => selectedFormats.includes(r.format)) : rawData;
    return [...new Set(d.map(r => r.subFormat).filter(Boolean))];
  }, [rawData, selectedFormats]);
  const uniqueDevices = useMemo(() => [...new Set(rawData.map(r => r.device))], [rawData]);
  const uniqueSites = useMemo(() => [...new Set(rawData.map(r => r.site))], [rawData]);

  const filteredData = useMemo(() => {
    let data = rawData;
    if (selectedFormats.length > 0) data = data.filter(r => selectedFormats.includes(r.format));
    if (selectedSubFormats.length > 0) data = data.filter(r => selectedSubFormats.includes(r.subFormat));
    if (selectedDevices.length > 0) data = data.filter(r => selectedDevices.includes(r.device));
    if (filterSite !== "All") data = data.filter(r => r.site === filterSite);
    if (dateFrom && data[0]?.date) data = data.filter(r => r.date >= dateFrom);
    if (dateTo && data[0]?.date) data = data.filter(r => r.date <= dateTo);
    return data;
  }, [rawData, selectedFormats, selectedSubFormats, selectedDevices, filterSite, dateFrom, dateTo]);

  // Demo KPIs
  const kpis = useMemo(() => {
    const d = filteredData, impressions = d.reduce((s, r) => s + (r.impressions || 0), 0), clicks = d.reduce((s, r) => s + (r.clicks || 0), 0),
      spend = d.reduce((s, r) => s + (r.spend || 0), 0), conversions = d.reduce((s, r) => s + (r.conversions || 0), 0),
      views = d.reduce((s, r) => s + (r.views || 0), 0), listens = d.reduce((s, r) => s + (r.listens || 0), 0);
    const vwA = d.filter(r => r.viewability > 0), viewability = vwA.length ? vwA.reduce((s, r) => s + r.viewability, 0) / vwA.length : 0;
    const vcA = d.filter(r => r.vcr > 0), vcr = vcA.length ? vcA.reduce((s, r) => s + r.vcr, 0) / vcA.length : 0;
    const ltA = d.filter(r => r.ltr > 0), ltr = ltA.length ? ltA.reduce((s, r) => s + r.ltr, 0) / ltA.length : 0;
    return { impressions, clicks, spend, conversions, views, listens, ctr: impressions > 0 ? (clicks / impressions) * 100 : 0, cpm: impressions > 0 ? spend / (impressions / 1000) : 0, cpc: clicks > 0 ? spend / clicks : 0, cpa: conversions > 0 ? spend / conversions : 0, viewability, vcr, ltr };
  }, [filteredData]);

  // Demo: time series
  const timeSeries = useMemo(() => {
    const map = {};
    filteredData.forEach((r) => {
      if (!r.date) return;
      const key = aggregation === "week" ? getWeek(r.date) : aggregation === "month" ? getMonth(r.date) : r.date;
      if (!map[key]) map[key] = { key, impressions: 0, clicks: 0, spend: 0, conversions: 0, views: 0 };
      const m = map[key]; m.impressions += r.impressions || 0; m.clicks += r.clicks || 0; m.spend += r.spend || 0; m.conversions += r.conversions || 0; m.views += r.views || 0;
    });
    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key)).map(d => ({ ...d, ctr: d.impressions > 0 ? +((d.clicks / d.impressions) * 100).toFixed(3) : 0, cpm: d.impressions > 0 ? +(d.spend / (d.impressions / 1000)).toFixed(2) : 0, label: aggregation === "day" ? d.key.slice(5) : d.key }));
  }, [filteredData, aggregation]);

  // Demo: format breakdown
  const formatBreakdown = useMemo(() => {
    const map = {};
    filteredData.forEach(r => {
      const f = r.format || "Autre";
      if (!map[f]) map[f] = { format: f, impressions: 0, clicks: 0, spend: 0, conversions: 0, views: 0, listens: 0, vcrS: 0, vcrN: 0, ltrS: 0, ltrN: 0, vwS: 0, vwN: 0 };
      const m = map[f]; m.impressions += r.impressions || 0; m.clicks += r.clicks || 0; m.spend += r.spend || 0; m.conversions += r.conversions || 0; m.views += r.views || 0; m.listens += r.listens || 0;
      if (r.vcr > 0) { m.vcrS += r.vcr; m.vcrN++; } if (r.ltr > 0) { m.ltrS += r.ltr; m.ltrN++; } if (r.viewability > 0) { m.vwS += r.viewability; m.vwN++; }
    });
    return Object.values(map).map(d => ({ ...d, ctr: d.impressions > 0 ? +((d.clicks / d.impressions) * 100).toFixed(2) : 0, cpm: d.impressions > 0 ? +(d.spend / (d.impressions / 1000)).toFixed(2) : 0, cpc: d.clicks > 0 ? +(d.spend / d.clicks).toFixed(2) : 0, vcr: d.vcrN ? +(d.vcrS / d.vcrN).toFixed(1) : 0, ltr: d.ltrN ? +(d.ltrS / d.ltrN).toFixed(1) : 0, viewability: d.vwN ? +(d.vwS / d.vwN).toFixed(1) : 0 })).sort((a, b) => b.spend - a.spend);
  }, [filteredData]);

  // Demo: sub-format breakdown
  const subFormatBreakdown = useMemo(() => {
    const cd = filteredData.filter(r => r.format === selectedFormatTab), map = {};
    cd.forEach(r => { const sf = r.subFormat || "Autre"; if (!map[sf]) map[sf] = { subFormat: sf, impressions: 0, clicks: 0, spend: 0, conversions: 0, views: 0, vcrS: 0, vcrN: 0, ltrS: 0, ltrN: 0, vwS: 0, vwN: 0 }; const m = map[sf]; m.impressions += r.impressions || 0; m.clicks += r.clicks || 0; m.spend += r.spend || 0; m.conversions += r.conversions || 0; m.views += r.views || 0; if (r.vcr > 0) { m.vcrS += r.vcr; m.vcrN++; } if (r.ltr > 0) { m.ltrS += r.ltr; m.ltrN++; } if (r.viewability > 0) { m.vwS += r.viewability; m.vwN++; } });
    return Object.values(map).map(d => ({ ...d, ctr: d.impressions > 0 ? +((d.clicks / d.impressions) * 100).toFixed(2) : 0, cpm: d.impressions > 0 ? +(d.spend / (d.impressions / 1000)).toFixed(2) : 0, vcr: d.vcrN ? +(d.vcrS / d.vcrN).toFixed(1) : 0, ltr: d.ltrN ? +(d.ltrS / d.ltrN).toFixed(1) : 0, viewability: d.vwN ? +(d.vwS / d.vwN).toFixed(1) : 0 })).sort((a, b) => b.impressions - a.impressions);
  }, [filteredData, selectedFormatTab]);

  // Demo: creative axis
  const creativeAxisData = useMemo(() => {
    const cd = filteredData.filter(r => ["Display", "Video", "Audio", "In-Game"].includes(r.format) && r.creative);
    const map = {};
    cd.forEach(r => { const c = r.creative; if (!map[c]) map[c] = { creative: c, impressions: 0, clicks: 0, spend: 0, conversions: 0, views: 0, formats: new Set(), vcrS: 0, vcrN: 0, vwS: 0, vwN: 0 }; const m = map[c]; m.impressions += r.impressions || 0; m.clicks += r.clicks || 0; m.spend += r.spend || 0; m.conversions += r.conversions || 0; m.views += r.views || 0; m.formats.add(r.format); if (r.vcr > 0) { m.vcrS += r.vcr; m.vcrN++; } if (r.viewability > 0) { m.vwS += r.viewability; m.vwN++; } });
    return Object.values(map).map(d => ({ ...d, formats: [...d.formats].join(", "), ctr: d.impressions > 0 ? +((d.clicks / d.impressions) * 100).toFixed(2) : 0, cpm: d.impressions > 0 ? +(d.spend / (d.impressions / 1000)).toFixed(2) : 0, cpc: d.clicks > 0 ? +(d.spend / d.clicks).toFixed(2) : 0, vcr: d.vcrN ? +(d.vcrS / d.vcrN).toFixed(1) : 0, viewability: d.vwN ? +(d.vwS / d.vwN).toFixed(1) : 0 })).sort((a, b) => b.spend - a.spend);
  }, [filteredData]);

  // Demo: spend by format
  const spendByFormat = useMemo(() => {
    const map = {};
    filteredData.forEach(r => { if (!r.date) return; const key = aggregation === "week" ? getWeek(r.date) : aggregation === "month" ? getMonth(r.date) : r.date; if (!map[key]) { const e = { key, label: aggregation === "day" ? key.slice(5) : key }; ALL_FORMATS.forEach(f => { e[f] = 0; }); map[key] = e; } map[key][r.format] = (map[key][r.format] || 0) + (r.spend || 0); });
    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredData, aggregation]);

  // Demo: radar
  const radarData = useMemo(() => {
    if (!formatBreakdown.length) return [];
    const metrics = [{ key: "conversions", label: "Conversions" }, { key: "ctr", label: "CTR" }, { key: "viewability", label: "Viewability" }, { key: "impressions", label: "Volume" }, { key: "cpm", label: "CPM (inv.)", invert: true }];
    const maxes = {}; metrics.forEach(m => { maxes[m.key] = Math.max(...formatBreakdown.map(f => f[m.key] || 0), 1); });
    return metrics.map(m => { const e = { metric: m.label }; formatBreakdown.forEach(f => { let v = (f[m.key] || 0) / maxes[m.key] * 100; if (m.invert) v = 100 - v; e[f.format] = +v.toFixed(1); }); return e; });
  }, [formatBreakdown]);

  // Demo: device
  const deviceBreakdown = useMemo(() => {
    const map = {}; filteredData.forEach(r => { const d = r.device || "Autre"; if (!map[d]) map[d] = { name: d, value: 0 }; map[d].value += r.impressions || 0; }); return Object.values(map);
  }, [filteredData]);

  // Demo: site
  const sitePerformance = useMemo(() => {
    const map = {}; filteredData.forEach(r => { const s = r.site || "Autre"; if (!map[s]) map[s] = { site: s, impressions: 0, clicks: 0, spend: 0, conversions: 0 }; const m = map[s]; m.impressions += r.impressions || 0; m.clicks += r.clicks || 0; m.spend += r.spend || 0; m.conversions += r.conversions || 0; });
    return Object.values(map).map(d => ({ ...d, ctr: d.impressions > 0 ? +((d.clicks / d.impressions) * 100).toFixed(2) : 0, cpm: d.impressions > 0 ? +(d.spend / (d.impressions / 1000)).toFixed(2) : 0, cpa: d.conversions > 0 ? +(d.spend / d.conversions).toFixed(2) : 0 })).sort((a, b) => b.spend - a.spend);
  }, [filteredData]);

  // Demo: quartiles
  const quartileData = useMemo(() => {
    const vd = filteredData.filter(r => r.format === selectedFormatTab && r.q25 > 0); if (!vd.length) return null;
    const avg = (k) => +(vd.reduce((s, r) => s + (r[k] || 0), 0) / vd.length).toFixed(1);
    return [{ quartile: "Q1 (25%)", value: avg("q25") }, { quartile: "Q2 (50%)", value: avg("q50") }, { quartile: "Q3 (75%)", value: avg("q75") }, { quartile: "Q4 (100%)", value: avg("q100") }];
  }, [filteredData, selectedFormatTab]);

  // Demo: ROI
  const roiData = useMemo(() => formatBreakdown.map(f => ({ format: f.format, cpm: +f.cpm, ctr: +f.ctr, cpc: +f.cpc, spend: f.spend, costEfficiency: f.impressions > 0 ? +(f.spend / f.impressions * 10000).toFixed(2) : 0, convRate: f.clicks > 0 ? +((f.conversions / f.clicks) * 100).toFixed(2) : 0, cpa: f.conversions > 0 ? +(f.spend / f.conversions).toFixed(2) : 0 })), [formatBreakdown]);
  const roiTimeSeries = useMemo(() => timeSeries.map(d => ({ ...d, cpmTrend: d.cpm, ctrTrend: d.ctr, spendTrend: +(d.spend).toFixed(0) })), [timeSeries]);

  // Demo: visibility
  const visibilityData = useMemo(() => formatBreakdown.map(f => ({ format: f.format, impressions: f.impressions, viewability: +f.viewability, vcr: +f.vcr, ltr: +f.ltr, visibleImpressions: Math.round(f.impressions * (+f.viewability || 0) / 100) })), [formatBreakdown]);

  // Demo: channel KPIs
  const getChannelKpis = (fmt) => {
    const d = filteredData.filter(r => r.format === fmt);
    const imp = d.reduce((s, r) => s + (r.impressions || 0), 0), cl = d.reduce((s, r) => s + (r.clicks || 0), 0), sp = d.reduce((s, r) => s + (r.spend || 0), 0), conv = d.reduce((s, r) => s + (r.conversions || 0), 0), vw = d.reduce((s, r) => s + (r.views || 0), 0), li = d.reduce((s, r) => s + (r.listens || 0), 0);
    const vwA = d.filter(r => r.viewability > 0), viewab = vwA.length ? vwA.reduce((s, r) => s + r.viewability, 0) / vwA.length : 0;
    const vcA = d.filter(r => r.vcr > 0), vcr = vcA.length ? vcA.reduce((s, r) => s + r.vcr, 0) / vcA.length : 0;
    const ltA = d.filter(r => r.ltr > 0), ltr = ltA.length ? ltA.reduce((s, r) => s + r.ltr, 0) / ltA.length : 0;
    const base = [{ label: "Impressions", value: fmtNum(imp) }, { label: "Depenses", value: fmtCur(sp) }, { label: "CPM", value: fmtDec(imp > 0 ? sp / (imp / 1000) : 0) + " EUR" }];
    switch (fmt) {
      case "Display": return [...base, { label: "Clics", value: fmtNum(cl) }, { label: "CTR", value: fmtPct(imp > 0 ? (cl / imp) * 100 : 0) }, { label: "CPC", value: fmtDec(cl > 0 ? sp / cl : 0) + " EUR" }, { label: "Viewability", value: fmtPct(viewab) }, { label: "Conversions", value: fmtNum(conv) }];
      case "Native": return [...base, { label: "Clics", value: fmtNum(cl) }, { label: "CTR", value: fmtPct(imp > 0 ? (cl / imp) * 100 : 0) }, { label: "Viewability", value: fmtPct(viewab) }, { label: "Conversions", value: fmtNum(conv) }];
      case "Video": return [...base, { label: "Vues completes", value: fmtNum(vw) }, { label: "VCR", value: fmtPct(vcr) }, { label: "CPV", value: (vw > 0 ? (sp / vw).toFixed(4) : "0") + " EUR" }, { label: "Viewability", value: fmtPct(viewab) }, { label: "Conversions", value: fmtNum(conv) }];
      case "CTV": return [...base, { label: "Vues completes", value: fmtNum(vw) }, { label: "VCR", value: fmtPct(vcr) }, { label: "Viewability", value: fmtPct(viewab) }];
      case "Audio": return [...base, { label: "Ecoutes compl.", value: fmtNum(li) }, { label: "LTR", value: fmtPct(ltr) }, { label: "Clics", value: fmtNum(cl) }];
      case "In-Game": return [...base, { label: "Viewability", value: fmtPct(viewab) }];
      default: return base;
    }
  };

  // =====================================================================
  // CAMPAIGN MODE: computed data
  // =====================================================================
  const uniquePersonas = useMemo(() => [...new Set(campaignData.map(r => r.persona).filter(Boolean))], [campaignData]);
  const uniqueChannelTypes = useMemo(() => [...new Set(campaignData.map(r => r.channelType).filter(Boolean))], [campaignData]);

  // Filtered campaign data
  const filteredCampaignData = useMemo(() => {
    let data = campaignData;
    if (selectedPersonas.length > 0) data = data.filter(r => selectedPersonas.includes(r.persona));
    if (selectedChannelTypes.length > 0) data = data.filter(r => selectedChannelTypes.includes(r.channelType));
    return data;
  }, [campaignData, selectedPersonas, selectedChannelTypes]);

  const filteredDomainData = useMemo(() => {
    let data = domainData;
    if (selectedPersonas.length > 0) data = data.filter(r => selectedPersonas.includes(r.persona));
    if (selectedChannelTypes.length > 0) data = data.filter(r => selectedChannelTypes.includes(r.channelType));
    if (filterSite !== "All") data = data.filter(r => r.domain === filterSite);
    return data;
  }, [domainData, selectedPersonas, selectedChannelTypes, filterSite]);

  const filteredCreativeData = useMemo(() => {
    let data = creativeRealData;
    if (selectedPersonas.length > 0) data = data.filter(r => selectedPersonas.includes(r.persona));
    if (selectedChannelTypes.length > 0) data = data.filter(r => selectedChannelTypes.includes(r.channelType));
    return data;
  }, [creativeRealData, selectedPersonas, selectedChannelTypes]);

  // Campaign KPIs
  const campaignKpis = useMemo(() => {
    const d = filteredCampaignData;
    if (!d.length) return null;
    const impressions = d.reduce((s, r) => s + r.impressions, 0);
    const clicks = d.reduce((s, r) => s + r.clicks, 0);
    const spend = d.reduce((s, r) => s + r.mediaCost, 0);
    const budget = d.reduce((s, r) => s + r.lifetimeBudget, 0);
    const uniqueImpressions = d.reduce((s, r) => s + r.uniqueImpressions, 0);
    const impressionsViewed = d.reduce((s, r) => s + r.impressionsViewed, 0);
    const impressionsMeasurable = d.reduce((s, r) => s + r.impressionsMeasurable, 0);
    const vwA = d.filter(r => r.viewPct > 0);
    const viewability = vwA.length ? vwA.reduce((s, r) => s + r.viewPct, 0) / vwA.length : 0;
    const freqA = d.filter(r => r.frequency > 0);
    const frequency = freqA.length ? freqA.reduce((s, r) => s + r.frequency, 0) / freqA.length : 0;
    return {
      impressions, clicks, spend, budget, uniqueImpressions, impressionsViewed, impressionsMeasurable,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpm: impressions > 0 ? spend / (impressions / 1000) : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      viewability, frequency,
      pacing: budget > 0 ? (spend / budget) * 100 : 0,
      flightStart: d[0]?.flightStart || "", flightEnd: d[0]?.flightEnd || "",
    };
  }, [filteredCampaignData]);

  // Campaign format breakdown (Display vs Native)
  const campaignFormatBreakdown = useMemo(() => {
    const map = {};
    filteredCampaignData.forEach(r => {
      const f = r.channelType || "Autre";
      if (!map[f]) map[f] = { format: f, impressions: 0, clicks: 0, spend: 0, budget: 0, uniqueImpressions: 0, vwS: 0, vwN: 0 };
      const m = map[f]; m.impressions += r.impressions; m.clicks += r.clicks; m.spend += r.mediaCost; m.budget += r.lifetimeBudget; m.uniqueImpressions += r.uniqueImpressions;
      if (r.viewPct > 0) { m.vwS += r.viewPct; m.vwN++; }
    });
    return Object.values(map).map(d => ({
      ...d,
      ctr: d.impressions > 0 ? +((d.clicks / d.impressions) * 100).toFixed(2) : 0,
      cpm: d.impressions > 0 ? +(d.spend / (d.impressions / 1000)).toFixed(2) : 0,
      cpc: d.clicks > 0 ? +(d.spend / d.clicks).toFixed(2) : 0,
      viewability: d.vwN ? +(d.vwS / d.vwN).toFixed(1) : 0,
    })).sort((a, b) => b.spend - a.spend);
  }, [filteredCampaignData]);

  // Domain performance (aggregated)
  const domainPerformanceReal = useMemo(() => {
    const map = {};
    filteredDomainData.forEach(r => {
      const s = r.domain;
      if (!map[s]) map[s] = { site: s, impressions: 0, clicks: 0, spend: 0, conversions: 0 };
      const m = map[s]; m.impressions += r.impressions; m.clicks += r.clicks; m.spend += r.mediaCost; m.conversions += r.conversions;
    });
    return Object.values(map).map(d => ({
      ...d,
      ctr: d.impressions > 0 ? +((d.clicks / d.impressions) * 100).toFixed(2) : 0,
      cpm: d.impressions > 0 ? +(d.spend / (d.impressions / 1000)).toFixed(2) : 0,
      cpa: d.conversions > 0 ? +(d.spend / d.conversions).toFixed(2) : 0,
    })).sort((a, b) => b.spend - a.spend);
  }, [filteredDomainData]);

  // Creative performance (aggregated)
  const creativePerformance = useMemo(() => {
    const map = {};
    filteredCreativeData.forEach(r => {
      const key = r.creativeName;
      if (!map[key]) map[key] = { creative: key, size: r.creativeSize, channelType: r.channelType, impressions: 0, clicks: 0, spend: 0, conversions: 0, personas: new Set() };
      const m = map[key]; m.impressions += r.impressions; m.clicks += r.clicks; m.spend += r.mediaCost; m.conversions += r.conversions; m.personas.add(r.persona);
    });
    return Object.values(map).map(d => ({
      ...d, personas: [...d.personas].join(", "),
      ctr: d.impressions > 0 ? +((d.clicks / d.impressions) * 100).toFixed(2) : 0,
      cpm: d.impressions > 0 ? +(d.spend / (d.impressions / 1000)).toFixed(2) : 0,
      cpc: d.clicks > 0 ? +(d.spend / d.clicks).toFixed(2) : 0,
    })).sort((a, b) => b.spend - a.spend);
  }, [filteredCreativeData]);

  // Persona breakdown
  const personaBreakdown = useMemo(() => {
    return uniquePersonas.map(persona => {
      const campRows = campaignData.filter(r => r.persona === persona);
      const domRows = domainData.filter(r => r.persona === persona);
      const creaRows = creativeRealData.filter(r => r.persona === persona);
      const impressions = campRows.reduce((s, r) => s + r.impressions, 0);
      const clicks = campRows.reduce((s, r) => s + r.clicks, 0);
      const spend = campRows.reduce((s, r) => s + r.mediaCost, 0);
      const budget = campRows.reduce((s, r) => s + r.lifetimeBudget, 0);
      const uniqueImpressions = campRows.reduce((s, r) => s + r.uniqueImpressions, 0);
      const freqA = campRows.filter(r => r.frequency > 0);
      const frequency = freqA.length ? freqA.reduce((s, r) => s + r.frequency, 0) / freqA.length : 0;
      const vwA = campRows.filter(r => r.viewPct > 0);
      const viewability = vwA.length ? vwA.reduce((s, r) => s + r.viewPct, 0) / vwA.length : 0;

      // Per channel
      const channels = {};
      campRows.forEach(r => {
        if (!channels[r.channelType]) channels[r.channelType] = { impressions: 0, clicks: 0, spend: 0, budget: 0, viewPct: 0 };
        const m = channels[r.channelType]; m.impressions += r.impressions; m.clicks += r.clicks; m.spend += r.mediaCost; m.budget += r.lifetimeBudget; m.viewPct = r.viewPct;
      });

      // Top domains
      const domMap = {};
      domRows.forEach(r => {
        if (!domMap[r.domain]) domMap[r.domain] = { site: r.domain, spend: 0, impressions: 0, clicks: 0 };
        domMap[r.domain].spend += r.mediaCost; domMap[r.domain].impressions += r.impressions; domMap[r.domain].clicks += r.clicks;
      });
      const topDomains = Object.values(domMap).sort((a, b) => b.spend - a.spend).slice(0, 10);

      // Top creatives
      const creaMap = {};
      creaRows.forEach(r => {
        if (!creaMap[r.creativeName]) creaMap[r.creativeName] = { creative: r.creativeName, size: r.creativeSize, channelType: r.channelType, spend: 0, impressions: 0, clicks: 0 };
        const m = creaMap[r.creativeName]; m.spend += r.mediaCost; m.impressions += r.impressions; m.clicks += r.clicks;
      });
      const topCreatives = Object.values(creaMap).map(d => ({
        ...d,
        ctr: d.impressions > 0 ? +((d.clicks / d.impressions) * 100).toFixed(2) : 0,
        cpm: d.impressions > 0 ? +(d.spend / (d.impressions / 1000)).toFixed(2) : 0,
        cpc: d.clicks > 0 ? +(d.spend / d.clicks).toFixed(2) : 0,
      })).sort((a, b) => b.impressions - a.impressions).slice(0, 15);

      return { persona, impressions, clicks, spend, budget, uniqueImpressions, frequency, viewability, ctr: impressions > 0 ? (clicks / impressions) * 100 : 0, cpm: impressions > 0 ? spend / (impressions / 1000) : 0, channels, topDomains, topCreatives, allCreatives: Object.values(creaMap).map(d => ({ ...d, ctr: d.impressions > 0 ? +((d.clicks / d.impressions) * 100).toFixed(2) : 0, cpm: d.impressions > 0 ? +(d.spend / (d.impressions / 1000)).toFixed(2) : 0, cpc: d.clicks > 0 ? +(d.spend / d.clicks).toFixed(2) : 0 })).sort((a, b) => b.spend - a.spend) };
    });
  }, [uniquePersonas, campaignData, domainData, creativeRealData]);

  // Campaign radar
  const campaignRadarData = useMemo(() => {
    if (!campaignFormatBreakdown.length) return [];
    const metrics = [{ key: "ctr", label: "CTR" }, { key: "viewability", label: "Viewability" }, { key: "impressions", label: "Volume" }, { key: "cpm", label: "CPM (inv.)", invert: true }, { key: "clicks", label: "Clics" }];
    const maxes = {}; metrics.forEach(m => { maxes[m.key] = Math.max(...campaignFormatBreakdown.map(f => f[m.key] || 0), 1); });
    return metrics.map(m => { const e = { metric: m.label }; campaignFormatBreakdown.forEach(f => { let v = (f[m.key] || 0) / maxes[m.key] * 100; if (m.invert) v = 100 - v; e[f.format] = +v.toFixed(1); }); return e; });
  }, [campaignFormatBreakdown]);

  // Unique domains for filter
  const uniqueDomainsReal = useMemo(() => [...new Set(domainData.map(r => r.domain).filter(Boolean))].sort(), [domainData]);

  // =====================================================================
  // MATOMO RECONCILIATION (Ads server vs Matomo)
  // Always aggregated on the full dataset (filters don't apply here) so that
  // Ads totals can be compared apples-to-apples with Matomo totals.
  // =====================================================================
  const matomoReconciliation = useMemo(() => {
    if (!matomoData.length || !campaignData.length) return null;

    // Aggregate Matomo by channel
    const matoByChan = {};
    matomoData.forEach(r => {
      const k = r.channel || "Autre";
      if (!matoByChan[k]) matoByChan[k] = { channel: k, visits: 0, actions: 0, bounces: 0, timeSec: 0, visitsWithConv: 0, conversions: 0, revenue: 0, uniqueVisitors: 0 };
      const m = matoByChan[k];
      m.visits += r.visits || 0; m.actions += r.actions || 0; m.bounces += r.bounces || 0; m.timeSec += r.timeSec || 0;
      m.visitsWithConv += r.visitsWithConv || 0; m.conversions += r.conversions || 0; m.revenue += r.revenue || 0; m.uniqueVisitors += r.uniqueVisitors || 0;
    });

    // Aggregate Ads by channelType
    const adsByChan = {};
    campaignData.forEach(r => {
      const k = r.channelType || "Autre";
      if (!adsByChan[k]) adsByChan[k] = { channel: k, impressions: 0, clicks: 0, spend: 0, conversions: 0 };
      const m = adsByChan[k];
      m.impressions += r.impressions; m.clicks += r.clicks; m.spend += r.mediaCost; m.conversions += r.conversions;
    });

    // Comparable channels = those tracked on both sides (Display, Native typically)
    const comparableKeys = Object.keys(adsByChan).filter(k => matoByChan[k]);
    const comparable = comparableKeys.map(k => {
      const ads = adsByChan[k];
      const mato = matoByChan[k];
      return {
        channel: k,
        impressions: ads.impressions,
        clicks: ads.clicks,
        spend: ads.spend,
        adsConversions: ads.conversions,
        visits: mato.visits,
        visitsWithConv: mato.visitsWithConv,
        matoConversions: mato.conversions,
        revenue: mato.revenue,
        bounces: mato.bounces,
        timeSec: mato.timeSec,
        actions: mato.actions,
        arrivalRate: ads.clicks > 0 ? (mato.visits / ads.clicks) * 100 : 0,
        bounceRate: mato.visits > 0 ? (mato.bounces / mato.visits) * 100 : 0,
        avgTime: mato.visits > 0 ? mato.timeSec / mato.visits : 0,
        actionsPerVisit: mato.visits > 0 ? mato.actions / mato.visits : 0,
        realCpa: mato.conversions > 0 ? ads.spend / mato.conversions : 0,
        roas: ads.spend > 0 ? (mato.revenue / ads.spend) * 100 : 0,
        convDelta: ads.conversions > 0 ? ((mato.conversions - ads.conversions) / ads.conversions) * 100 : (mato.conversions > 0 ? 100 : 0),
      };
    }).sort((a, b) => b.spend - a.spend);

    // Channels visible only in Matomo (no Ads data: Meta etc.)
    const matomoOnly = Object.keys(matoByChan).filter(k => !adsByChan[k]).map(k => {
      const m = matoByChan[k];
      return {
        channel: k,
        visits: m.visits,
        matoConversions: m.conversions,
        revenue: m.revenue,
        bounces: m.bounces,
        timeSec: m.timeSec,
        actions: m.actions,
        bounceRate: m.visits > 0 ? (m.bounces / m.visits) * 100 : 0,
        avgTime: m.visits > 0 ? m.timeSec / m.visits : 0,
        actionsPerVisit: m.visits > 0 ? m.actions / m.visits : 0,
      };
    }).sort((a, b) => b.visits - a.visits);

    // Totals
    const totalCmp = comparable.reduce((acc, r) => ({
      impressions: acc.impressions + r.impressions, clicks: acc.clicks + r.clicks, spend: acc.spend + r.spend,
      adsConversions: acc.adsConversions + r.adsConversions, visits: acc.visits + r.visits,
      matoConversions: acc.matoConversions + r.matoConversions, revenue: acc.revenue + r.revenue,
      bounces: acc.bounces + r.bounces, timeSec: acc.timeSec + r.timeSec,
    }), { impressions: 0, clicks: 0, spend: 0, adsConversions: 0, visits: 0, matoConversions: 0, revenue: 0, bounces: 0, timeSec: 0 });
    const matoOnlyTotals = matomoOnly.reduce((acc, r) => ({ visits: acc.visits + r.visits, matoConversions: acc.matoConversions + r.matoConversions, revenue: acc.revenue + r.revenue }), { visits: 0, matoConversions: 0, revenue: 0 });

    return {
      comparable,
      matomoOnly,
      kpis: {
        visitsAds: totalCmp.visits,
        visitsAll: totalCmp.visits + matoOnlyTotals.visits,
        arrivalRate: totalCmp.clicks > 0 ? (totalCmp.visits / totalCmp.clicks) * 100 : 0,
        realCpa: totalCmp.matoConversions > 0 ? totalCmp.spend / totalCmp.matoConversions : 0,
        cpaAds: totalCmp.adsConversions > 0 ? totalCmp.spend / totalCmp.adsConversions : 0,
        roas: totalCmp.spend > 0 ? (totalCmp.revenue / totalCmp.spend) * 100 : 0,
        bounceRate: totalCmp.visits > 0 ? (totalCmp.bounces / totalCmp.visits) * 100 : 0,
        convDelta: totalCmp.adsConversions > 0 ? ((totalCmp.matoConversions - totalCmp.adsConversions) / totalCmp.adsConversions) * 100 : 0,
        spend: totalCmp.spend,
        revenue: totalCmp.revenue,
        adsConversions: totalCmp.adsConversions,
        matoConversions: totalCmp.matoConversions + matoOnlyTotals.matoConversions,
      },
    };
  }, [matomoData, campaignData]);

  // =====================================================================
  // STYLES
  // =====================================================================
  const S = {
    container: { minHeight: "100vh", background: NURU.bgGrad, color: NURU.text, fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    header: { padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${NURU.cardBorder}`, background: "rgba(13,11,8,0.92)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50, flexWrap: "wrap", gap: 10 },
    logoWrap: { display: "flex", alignItems: "center", gap: 14 },
    content: { padding: "20px 32px" },
    filters: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" },
    dateLabel: { fontSize: 10, color: NURU.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" },
    dateInput: { padding: "6px 10px", borderRadius: 6, border: `1px solid ${NURU.cardBorder}`, background: NURU.card, color: NURU.text, fontSize: 12, outline: "none" },
    select: { padding: "6px 10px", borderRadius: 6, border: `1px solid ${NURU.cardBorder}`, background: NURU.card, color: NURU.text, fontSize: 12, fontWeight: 500, cursor: "pointer", outline: "none" },
    tabs: { display: "flex", gap: 0, marginBottom: 20, borderBottom: `1px solid ${NURU.cardBorder}`, flexWrap: "wrap" },
    tab: (a) => ({ padding: "9px 16px", border: "none", borderBottom: a ? `2px solid ${NURU.gold}` : "2px solid transparent", background: "transparent", color: a ? NURU.gold : NURU.textMuted, fontWeight: 600, fontSize: 11, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.04em", transition: "all 0.15s" }),
    formatTab: (a) => ({ padding: "7px 14px", borderRadius: 6, border: a ? `1px solid ${NURU.gold}` : `1px solid ${NURU.cardBorder}`, background: a ? NURU.goldMuted : "transparent", color: a ? NURU.gold : NURU.textMuted, fontWeight: 600, fontSize: 11, cursor: "pointer" }),
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14, marginBottom: 20 },
    card: { background: NURU.card, borderRadius: 10, padding: "18px", border: `1px solid ${NURU.cardBorder}` },
    cardFull: { gridColumn: "1 / -1" },
    cardTitle: { fontSize: 12, fontWeight: 700, marginBottom: 14, color: NURU.text, textTransform: "uppercase", letterSpacing: "0.04em" },
    kpiRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 },
    kpiCard: { background: NURU.card, borderRadius: 8, padding: "12px 14px", border: `1px solid ${NURU.cardBorder}`, borderLeft: `3px solid ${NURU.gold}` },
    kpiLabel: { fontSize: 9, fontWeight: 700, color: NURU.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 },
    kpiValue: { fontSize: 20, fontWeight: 800, color: NURU.gold, letterSpacing: "-0.02em" },
    badge: { display: "inline-block", padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: NURU.goldMuted, color: NURU.gold, textTransform: "uppercase" },
    btn: { padding: "6px 12px", borderRadius: 6, border: `1px solid ${NURU.cardBorder}`, background: NURU.card, color: NURU.text, fontSize: 11, fontWeight: 600, cursor: "pointer" },
    table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 11 },
    th: { textAlign: "left", padding: "8px 12px", borderBottom: `1px solid ${NURU.cardBorder}`, fontWeight: 700, color: NURU.textMuted, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em" },
    td: { padding: "8px 12px", borderBottom: `1px solid ${NURU.cardBorder}`, fontVariantNumeric: "tabular-nums", color: NURU.text },
    formatInfo: { background: NURU.goldMuted, border: `1px solid ${NURU.goldDark}33`, borderRadius: 8, padding: "14px 18px", marginBottom: 16 },
    lexiqueOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" },
    lexiquePanel: { background: NURU.card, border: `1px solid ${NURU.cardBorder}`, borderRadius: 12, padding: "28px 32px", maxWidth: 640, width: "90%", maxHeight: "80vh", overflowY: "auto", color: NURU.text },
    importPanel: { position: "absolute", top: "100%", right: 0, background: NURU.card, border: `1px solid ${NURU.cardBorder}`, borderRadius: 10, padding: "16px 20px", minWidth: 320, zIndex: 60, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" },
  };

  // Bouton "?" cliquable à placer à côté d'un label technique.
  // Rend null si le label n'a pas de définition enregistrée dans METRIC_INFO.
  const InfoBtn = ({ label }) => {
    const info = getMetricInfo(label);
    if (!info) return null;
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); setOpenMetric(String(label).toLowerCase().trim()); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setOpenMetric(String(label).toLowerCase().trim()); } }}
        title={`Définition : ${info.title}`}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 13, height: 13, borderRadius: "50%", border: `1px solid ${NURU.gold}`, color: NURU.gold, fontSize: 9, fontWeight: 700, marginLeft: 5, cursor: "pointer", userSelect: "none", background: "transparent", lineHeight: 1, verticalAlign: "middle" }}
      >?</span>
    );
  };
  // Helper: rendu d'une cellule <th> enrichie d'un "?" si la colonne a une définition.
  const thInfo = (h) => (<th key={h} style={S.th}>{h}<InfoBtn label={h} /></th>);

  const tooltipStyle = { background: NURU.card, border: `1px solid ${NURU.cardBorder}`, borderRadius: 8, padding: "8px 12px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" };
  const CT = ({ active, payload, label }) => { if (!active || !payload?.length) return null; return (<div style={tooltipStyle}><p style={{ fontWeight: 700, fontSize: 11, marginBottom: 3, color: NURU.text }}>{label}</p>{payload.map((p, i) => (<p key={i} style={{ fontSize: 10, color: p.color || NURU.gold, margin: "1px 0" }}>{p.name}: <strong>{typeof p.value === "number" ? p.value.toLocaleString("fr-FR") : p.value}</strong></p>))}</div>); };

  const hasFilters = selectedFormats.length > 0 || selectedSubFormats.length > 0 || selectedDevices.length > 0 || filterSite !== "All" || selectedPersonas.length > 0 || selectedChannelTypes.length > 0;

  const filteredLexique = LEXIQUE.filter(l => !lexiqueSearch || l.term.toLowerCase().includes(lexiqueSearch.toLowerCase()) || l.def.toLowerCase().includes(lexiqueSearch.toLowerCase()));

  // Tab definitions
  const tabsDef = dataMode === "campaign"
    ? [{ key: "overview", label: "Vue d'ensemble" }, { key: "personas", label: "Par cible" }, { key: "formats", label: "Par format" }, { key: "creatives", label: "Par axe creatif" }, { key: "roi", label: "Couts" }, { key: "visibility", label: "Visibilite" }, { key: "sites", label: "Domaines" }, ...(matomoData.length > 0 ? [{ key: "matomo", label: "Site & ROI (Matomo)" }] : []), { key: "table", label: "Donnees" }]
    : [{ key: "overview", label: "Vue d'ensemble" }, { key: "formats", label: "Par format" }, { key: "creatives", label: "Par axe creatif" }, { key: "roi", label: "Couts" }, { key: "visibility", label: "Visibilite" }, { key: "sites", label: "Sites" }, { key: "table", label: "Donnees" }];

  // =====================================================================
  // RENDER
  // =====================================================================
  return (
    <div style={S.container}>
      {/* METRIC INFO POPUP */}
      {openMetric && METRIC_INFO[openMetric] && (
        <div style={S.lexiqueOverlay} onClick={() => setOpenMetric(null)}>
          <div style={{ ...S.lexiquePanel, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: NURU.gold, textTransform: "uppercase", letterSpacing: "0.04em" }}>{METRIC_INFO[openMetric].title}</div>
              <button onClick={() => setOpenMetric(null)} aria-label="Fermer" style={{ background: "transparent", border: "none", color: NURU.textMuted, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ fontSize: 13, color: NURU.text, lineHeight: 1.65 }}>{METRIC_INFO[openMetric].desc}</div>
          </div>
        </div>
      )}

      {/* LEXIQUE MODAL */}
      {showLexique && (
        <div style={S.lexiqueOverlay} onClick={() => setShowLexique(false)}>
          <div style={S.lexiquePanel} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: NURU.gold, textTransform: "uppercase", letterSpacing: "0.06em" }}>Lexique Programmatique</div>
              <button style={{ ...S.btn, color: NURU.red, borderColor: NURU.red }} onClick={() => setShowLexique(false)}>Fermer</button>
            </div>
            <input type="text" placeholder="Rechercher un terme..." value={lexiqueSearch} onChange={e => setLexiqueSearch(e.target.value)} style={{ ...S.dateInput, width: "100%", marginBottom: 16, padding: "10px 14px", fontSize: 13 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredLexique.map(l => (<div key={l.term} style={{ borderBottom: `1px solid ${NURU.cardBorder}`, paddingBottom: 10 }}><div style={{ fontWeight: 700, color: NURU.gold, fontSize: 13, marginBottom: 3 }}>{l.term}</div><div style={{ fontSize: 12, color: NURU.textMuted, lineHeight: 1.5 }}>{l.def}</div></div>))}
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header style={S.header}>
        <div style={S.logoWrap}>
          <a href="https://nuru.agency" target="_blank" rel="noopener noreferrer"><img src={logoNuru} alt="NURU" style={{ height: 53 }} /></a>
          <div style={{ width: 1, height: 32, background: NURU.cardBorder, margin: "0 8px" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: NURU.text }}>Dashboard Programmatique</div>
            <div style={{ fontSize: 10, color: NURU.textMuted }}>
              {dataMode === "demo" ? (<>{dataSource === "demo" ? "Donnees de demonstration" : dataSource} — {filteredData.length.toLocaleString("fr-FR")} lignes</>) : (<>Cotes-d&apos;Armor Destination — {campaignKpis?.flightStart} au {campaignKpis?.flightEnd} — {campaignData.length} campagnes, {uniqueDomainsReal.length} domaines, {creativeRealData.length} creatifs</>)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", position: "relative" }}>
          <input type="file" accept=".csv,.tsv" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileImport} />
          <button style={S.btn} onClick={() => setShowImportPanel(!showImportPanel)}>Importer</button>
          <button style={S.btn} onClick={() => { clearStoredData(); setRawData(generateDemoData()); setDataSource("demo"); setDataMode("demo"); setCampaignData([]); setDomainData([]); setCreativeRealData([]); setMatomoData([]); setSelectedPersonas([]); setSelectedChannelTypes([]); setActiveTab("overview"); }}>Demo</button>
          <button style={{ ...S.btn, borderColor: NURU.gold, color: NURU.gold }} onClick={() => setShowLexique(true)}>Lexique</button>
          {showImportPanel && (
            <div style={S.importPanel} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NURU.gold, marginBottom: 12 }}>Importer des donnees de campagne</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div><div style={{ fontSize: 10, color: NURU.textMuted, marginBottom: 4, fontWeight: 700, textTransform: "uppercase" }}>Campaign.csv *</div><input type="file" accept=".csv" ref={campaignFileRef} style={{ fontSize: 11, color: NURU.text }} /></div>
                <div><div style={{ fontSize: 10, color: NURU.textMuted, marginBottom: 4, fontWeight: 700, textTransform: "uppercase" }}>Domain.csv</div><input type="file" accept=".csv" ref={domainFileRef} style={{ fontSize: 11, color: NURU.text }} /></div>
                <div><div style={{ fontSize: 10, color: NURU.textMuted, marginBottom: 4, fontWeight: 700, textTransform: "uppercase" }}>Creatives.csv</div><input type="file" accept=".csv" ref={creativeFileRef} style={{ fontSize: 11, color: NURU.text }} /></div>
                <div><div style={{ fontSize: 10, color: NURU.textMuted, marginBottom: 4, fontWeight: 700, textTransform: "uppercase" }}>Matomo.csv (UTF-16)</div><input type="file" accept=".csv" ref={matomoFileRef} style={{ fontSize: 11, color: NURU.text }} /></div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button style={{ ...S.btn, borderColor: NURU.gold, color: NURU.gold }} onClick={handleCampaignImport}>Charger</button>
                  <button style={{ ...S.btn, fontSize: 10 }} onClick={() => { fileInputRef.current?.click(); setShowImportPanel(false); }}>CSV unique (demo)</button>
                  <button style={{ ...S.btn, color: NURU.red, borderColor: NURU.red }} onClick={() => setShowImportPanel(false)}>Fermer</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main style={S.content}>
        {/* FILTERS */}
        <div style={S.filters}>
          {dataMode === "demo" && (<>
            <span style={S.dateLabel}>Du</span>
            <input type="date" style={S.dateInput} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span style={S.dateLabel}>Au</span>
            <input type="date" style={S.dateInput} value={dateTo} onChange={e => setDateTo(e.target.value)} />
            <div style={{ width: 1, height: 24, background: NURU.cardBorder }} />
            <select style={S.select} value={aggregation} onChange={e => setAggregation(e.target.value)}>
              <option value="day">Par jour</option><option value="week">Par semaine</option><option value="month">Par mois</option>
            </select>
            <div style={{ width: 1, height: 24, background: NURU.cardBorder }} />
            <MultiSelect label="Tous les canaux" options={uniqueFormats} selected={selectedFormats} onChange={(v) => { setSelectedFormats(v); setSelectedSubFormats([]); }} />
            {uniqueSubFormats.length > 0 && <MultiSelect label="Tous sous-formats" options={uniqueSubFormats} selected={selectedSubFormats} onChange={setSelectedSubFormats} />}
            <MultiSelect label="Tous devices" options={uniqueDevices} selected={selectedDevices} onChange={setSelectedDevices} />
            <select style={S.select} value={filterSite} onChange={e => setFilterSite(e.target.value)}>
              <option value="All">Tous sites</option>{uniqueSites.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </>)}
          {dataMode === "campaign" && (<>
            <MultiSelect label="Toutes les cibles" options={uniquePersonas} selected={selectedPersonas} onChange={setSelectedPersonas} />
            <MultiSelect label="Tous les canaux" options={uniqueChannelTypes} selected={selectedChannelTypes} onChange={setSelectedChannelTypes} />
            <select style={S.select} value={filterSite} onChange={e => setFilterSite(e.target.value)}>
              <option value="All">Tous domaines</option>{uniqueDomainsReal.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </>)}
          {hasFilters && <button style={{ ...S.btn, color: NURU.red, borderColor: NURU.red }} onClick={() => { setSelectedFormats([]); setSelectedSubFormats([]); setSelectedDevices([]); setFilterSite("All"); setSelectedPersonas([]); setSelectedChannelTypes([]); }}>Reinitialiser</button>}
        </div>

        {/* TABS */}
        <div style={S.tabs}>
          {tabsDef.map(t => (<button key={t.key} style={S.tab(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>{t.label}</button>))}
        </div>

        {/* ======= OVERVIEW ======= */}
        {activeTab === "overview" && dataMode === "demo" && (<>
          {(() => { const globalKpis = [{ label: "Impressions", value: fmtNum(kpis.impressions) }, { label: "Depenses", value: fmtCur(kpis.spend) }, { label: "Clics", value: fmtNum(kpis.clicks) }, { label: "CTR", value: fmtPct(kpis.ctr) }, { label: "CPM moyen", value: fmtDec(kpis.cpm) + " EUR" }, { label: "CPC moyen", value: fmtDec(kpis.cpc) + " EUR" }, { label: "Viewability", value: fmtPct(kpis.viewability) }, { label: "Conversions", value: fmtNum(kpis.conversions) }, { label: "VCR (video)", value: fmtPct(kpis.vcr) }, { label: "LTR (audio)", value: fmtPct(kpis.ltr) }]; return (<>
            <div style={S.kpiRow}>{globalKpis.slice(0, 5).map(k => (<div key={k.label} style={S.kpiCard}><div style={S.kpiLabel}>{k.label}<InfoBtn label={k.label} /></div><div style={S.kpiValue}>{k.value}</div></div>))}</div>
            <div style={S.kpiRow}>{globalKpis.slice(5).map(k => (<div key={k.label} style={S.kpiCard}><div style={S.kpiLabel}>{k.label}<InfoBtn label={k.label} /></div><div style={S.kpiValue}>{k.value}</div></div>))}</div>
          </>); })()}
          <div style={S.grid}>
            <div style={{ ...S.card, ...S.cardFull }}><div style={S.cardTitle}>Impressions et clics ({aggregation === "day" ? "jour" : aggregation === "week" ? "semaine" : "mois"})</div>
              <ResponsiveContainer width="100%" height={280}><ComposedChart data={timeSeries}><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis dataKey="label" stroke={NURU.textMuted} fontSize={10} tickLine={false} /><YAxis yAxisId="l" stroke={NURU.textMuted} fontSize={10} tickFormatter={fmtNum} /><YAxis yAxisId="r" orientation="right" stroke={NURU.textMuted} fontSize={10} /><Tooltip content={<CT />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Area yAxisId="l" type="monotone" dataKey="impressions" name="Impressions" fill={CHART_GOLD_FILL} stroke={CHART_GOLD} strokeWidth={2} /><Line yAxisId="r" type="monotone" dataKey="clicks" name="Clics" stroke={NURU.goldLight} strokeWidth={2} dot={false} strokeDasharray="4 2" /></ComposedChart></ResponsiveContainer>
            </div>
            <div style={{ ...S.card, ...S.cardFull }}><div style={S.cardTitle}>Depenses par canal ({aggregation === "day" ? "jour" : aggregation === "week" ? "semaine" : "mois"})</div>
              <ResponsiveContainer width="100%" height={280}><BarChart data={spendByFormat}><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis dataKey="label" stroke={NURU.textMuted} fontSize={10} tickLine={false} /><YAxis stroke={NURU.textMuted} fontSize={10} /><Tooltip content={<CT />} /><Legend wrapperStyle={{ fontSize: 10 }} />{ALL_FORMATS.filter(f => formatBreakdown.find(fb => fb.format === f)).map((f, i) => (<Bar key={f} dataKey={f} name={f} stackId="a" fill={PIE_PALETTE[i % PIE_PALETTE.length]} radius={i === ALL_FORMATS.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />))}</BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>Repartition budget par canal</div>
              <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={formatBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="spend" nameKey="format" label={({ format, percent }) => `${format} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>{formatBreakdown.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}</Pie><Tooltip content={<CT />} /></PieChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>Repartition devices</div>
              <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={deviceBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>{deviceBreakdown.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}</Pie><Tooltip content={<CT />} /></PieChart></ResponsiveContainer>
            </div>
            <div style={{ ...S.card, ...S.cardFull }}><div style={S.cardTitle}>Performance comparee par canal (radar)</div>
              <ResponsiveContainer width="100%" height={700}><RadarChart data={radarData} cx="50%" cy="50%" outerRadius={260}><PolarGrid stroke={NURU.cardBorder} /><PolarAngleAxis dataKey="metric" stroke={NURU.textMuted} fontSize={12} /><PolarRadiusAxis stroke={NURU.cardBorder} fontSize={9} />{formatBreakdown.map((f, i) => (<Radar key={f.format} name={f.format} dataKey={f.format} stroke={RADAR_PALETTE[i % RADAR_PALETTE.length]} fill={RADAR_PALETTE[i % RADAR_PALETTE.length] + "30"} strokeWidth={3} dot={{ r: 4, fill: RADAR_PALETTE[i % RADAR_PALETTE.length] }} />))}<Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} /><Tooltip /></RadarChart></ResponsiveContainer>
            </div>
            <div style={{ ...S.card, ...S.cardFull, overflowX: "auto" }}><div style={S.cardTitle}>Comparaison detaillee par canal</div>
              <table style={S.table}><thead><tr>{["Canal", "Impressions", "Depenses", "CPM", "Clics", "CTR", "CPC", "Viewability", "VCR", "LTR", "Conv."].map(h => thInfo(h))}</tr></thead>
              <tbody>{formatBreakdown.map((f, i) => (<tr key={f.format} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={S.td}><span style={S.badge}>{f.format}</span></td><td style={S.td}>{fmtNum(f.impressions)}</td><td style={S.td}>{fmtCur(f.spend)}</td><td style={S.td}>{f.cpm} EUR</td><td style={S.td}>{fmtNum(f.clicks)}</td><td style={S.td}>{f.ctr}%</td><td style={S.td}>{f.cpc} EUR</td><td style={S.td}>{f.viewability}%</td><td style={S.td}>{f.vcr > 0 ? f.vcr + "%" : "\u2014"}</td><td style={S.td}>{f.ltr > 0 ? f.ltr + "%" : "\u2014"}</td><td style={S.td}>{fmtNum(f.conversions)}</td></tr>))}</tbody></table>
            </div>
          </div>
        </>)}

        {/* ======= OVERVIEW CAMPAIGN ======= */}
        {activeTab === "overview" && dataMode === "campaign" && campaignKpis && (<>
          <div style={{ ...S.formatInfo, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: NURU.gold, marginBottom: 4 }}>Campagne Cotes-d&apos;Armor Destination</div>
            <div style={{ fontSize: 11, color: NURU.textMuted }}>Periode : {campaignKpis.flightStart} au {campaignKpis.flightEnd} — Donnees agregees (pas de granularite quotidienne)</div>
          </div>
          <div style={S.kpiRow}>
            {[{ label: "Budget total", value: fmtCur(campaignKpis.budget) }, { label: "Depenses", value: fmtCur(campaignKpis.spend) }, { label: "Pacing", value: fmtPct(campaignKpis.pacing) }, { label: "Impressions", value: fmtNum(campaignKpis.impressions) }, { label: "Clics", value: fmtNum(campaignKpis.clicks) }].map(k => (<div key={k.label} style={S.kpiCard}><div style={S.kpiLabel}>{k.label}<InfoBtn label={k.label} /></div><div style={S.kpiValue}>{k.value}</div></div>))}
          </div>
          <div style={S.kpiRow}>
            {[{ label: "CTR", value: fmtPct(campaignKpis.ctr) }, { label: "CPM moyen", value: fmtCurDec(campaignKpis.cpm) }, { label: "CPC moyen", value: fmtCurDec(campaignKpis.cpc) }, { label: "Viewability", value: fmtPct(campaignKpis.viewability) }, { label: "Reach unique", value: fmtNum(campaignKpis.uniqueImpressions) }, { label: "Frequence", value: fmtDec(campaignKpis.frequency) }].map(k => (<div key={k.label} style={S.kpiCard}><div style={S.kpiLabel}>{k.label}<InfoBtn label={k.label} /></div><div style={S.kpiValue}>{k.value}</div></div>))}
          </div>
          <div style={S.grid}>
            <div style={S.card}><div style={S.cardTitle}>Repartition budget par canal</div>
              <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={campaignFormatBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="spend" nameKey="format" label={({ format, percent }) => `${format} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>{campaignFormatBreakdown.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}</Pie><Tooltip content={<CT />} /></PieChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>Performance comparee (radar)</div>
              <ResponsiveContainer width="100%" height={280}><RadarChart data={campaignRadarData} cx="50%" cy="50%" outerRadius={100}><PolarGrid stroke={NURU.cardBorder} /><PolarAngleAxis dataKey="metric" stroke={NURU.textMuted} fontSize={10} /><PolarRadiusAxis stroke={NURU.cardBorder} fontSize={9} />{campaignFormatBreakdown.map((f, i) => (<Radar key={f.format} name={f.format} dataKey={f.format} stroke={RADAR_PALETTE[i % RADAR_PALETTE.length]} fill={RADAR_PALETTE[i % RADAR_PALETTE.length] + "30"} strokeWidth={2} dot={{ r: 3, fill: RADAR_PALETTE[i % RADAR_PALETTE.length] }} />))}<Legend wrapperStyle={{ fontSize: 10 }} /><Tooltip /></RadarChart></ResponsiveContainer>
            </div>
            <div style={{ ...S.card, ...S.cardFull, overflowX: "auto" }}><div style={S.cardTitle}>Comparaison Display vs Native</div>
              <table style={S.table}><thead><tr>{["Canal", "Budget", "Depenses", "Impressions", "Clics", "CTR", "CPM", "CPC", "Viewability", "Reach unique"].map(h => thInfo(h))}</tr></thead>
              <tbody>{campaignFormatBreakdown.map((f, i) => (<tr key={f.format} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={S.td}><span style={S.badge}>{f.format}</span></td><td style={S.td}>{fmtCur(f.budget)}</td><td style={S.td}>{fmtCur(f.spend)}</td><td style={S.td}>{fmtNum(f.impressions)}</td><td style={S.td}>{fmtNum(f.clicks)}</td><td style={S.td}>{f.ctr}%</td><td style={S.td}>{f.cpm} EUR</td><td style={S.td}>{f.cpc} EUR</td><td style={S.td}>{f.viewability}%</td><td style={S.td}>{fmtNum(f.uniqueImpressions)}</td></tr>))}</tbody></table>
            </div>
            <div style={{ ...S.card, ...S.cardFull }}><div style={S.cardTitle}>Top 20 domaines par depenses</div>
              <ResponsiveContainer width="100%" height={Math.max(280, domainPerformanceReal.slice(0, 20).length * 28)}><BarChart data={domainPerformanceReal.slice(0, 20)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} /><YAxis type="category" dataKey="site" stroke={NURU.textMuted} fontSize={9} width={140} /><Tooltip content={<CT />} /><Bar dataKey="spend" name="Depenses EUR" fill={CHART_GOLD} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
            </div>
          </div>
        </>)}

        {/* ======= PAR CIBLE (campaign only) ======= */}
        {activeTab === "personas" && dataMode === "campaign" && (<>
          <div style={{ ...S.formatInfo, marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 700, color: NURU.gold, marginBottom: 4 }}>Analyse par cible</div><div style={{ fontSize: 11, color: NURU.textMuted }}>Performance detaillee pour chaque persona / cible de la campagne. Chaque cible se decline en Display et Native.</div></div>
          {personaBreakdown.map((p) => (
            <div key={p.persona} style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: NURU.gold, marginBottom: 12, borderBottom: `2px solid ${NURU.gold}`, paddingBottom: 8 }}>{p.persona}</div>
              <div style={S.kpiRow}>
                {[{ label: "Budget", value: fmtCur(p.budget) }, { label: "Depenses", value: fmtCur(p.spend) }, { label: "Impressions", value: fmtNum(p.impressions) }, { label: "Clics", value: fmtNum(p.clicks) }, { label: "CTR", value: fmtPct(p.ctr) }, { label: "CPM", value: fmtCurDec(p.cpm) }, { label: "Reach unique", value: fmtNum(p.uniqueImpressions) }, { label: "Frequence", value: fmtDec(p.frequency) }].map(k => (<div key={k.label} style={S.kpiCard}><div style={S.kpiLabel}>{k.label}<InfoBtn label={k.label} /></div><div style={S.kpiValue}>{k.value}</div></div>))}
              </div>
              {/* Channel comparison */}
              <div style={{ ...S.card, marginBottom: 14, overflowX: "auto" }}><div style={S.cardTitle}>Comparaison par canal</div>
                <table style={S.table}><thead><tr>{["Canal", "Budget", "Depenses", "Impressions", "Clics", "CTR", "CPM", "Viewability"].map(h => thInfo(h))}</tr></thead>
                <tbody>{Object.entries(p.channels).map(([ch, d], i) => (<tr key={ch} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={S.td}><span style={S.badge}>{ch}</span></td><td style={S.td}>{fmtCur(d.budget)}</td><td style={S.td}>{fmtCur(d.spend)}</td><td style={S.td}>{fmtNum(d.impressions)}</td><td style={S.td}>{fmtNum(d.clicks)}</td><td style={S.td}>{d.impressions > 0 ? fmtPct((d.clicks / d.impressions) * 100) : "0%"}</td><td style={S.td}>{d.impressions > 0 ? fmtCurDec(d.spend / (d.impressions / 1000)) : "0"}</td><td style={S.td}>{d.viewPct > 0 ? fmtPct(d.viewPct) : "\u2014"}</td></tr>))}</tbody></table>
              </div>
              <div style={S.grid}>
                <div style={S.card}><div style={S.cardTitle}>Top 10 domaines (depenses)</div>
                  <ResponsiveContainer width="100%" height={Math.max(200, p.topDomains.length * 28)}><BarChart data={p.topDomains} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} /><YAxis type="category" dataKey="site" stroke={NURU.textMuted} fontSize={9} width={130} /><Tooltip content={<CT />} /><Bar dataKey="spend" name="Depenses EUR" fill={CHART_GOLD} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
                </div>
                <div style={S.card}><div style={S.cardTitle}>Top creatifs (impressions)</div>
                  <ResponsiveContainer width="100%" height={Math.max(200, p.topCreatives.length * 28)}><BarChart data={p.topCreatives} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} tickFormatter={fmtNum} /><YAxis type="category" dataKey="creative" stroke={NURU.textMuted} fontSize={8} width={180} /><Tooltip content={<CT />} /><Bar dataKey="impressions" name="Impressions" fill={NURU.goldDark} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
                </div>
              </div>
              <div style={{ ...S.card, overflowX: "auto", marginBottom: 14 }}><div style={S.cardTitle}>Detail des creatifs</div>
                <table style={S.table}><thead><tr>{["Creatif", "Taille", "Canal", "Impressions", "Clics", "CTR", "Depenses", "CPM", "CPC"].map(h => thInfo(h))}</tr></thead>
                <tbody>{p.allCreatives.map((c, i) => (<tr key={c.creative + i} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={{ ...S.td, fontWeight: 600, fontSize: 10 }}>{c.creative}</td><td style={S.td}>{c.size}</td><td style={S.td}><span style={S.badge}>{c.channelType}</span></td><td style={S.td}>{fmtNum(c.impressions)}</td><td style={S.td}>{fmtNum(c.clicks)}</td><td style={S.td}>{c.ctr}%</td><td style={S.td}>{fmtCurDec(c.spend)}</td><td style={S.td}>{c.cpm} EUR</td><td style={S.td}>{c.cpc > 0 ? c.cpc + " EUR" : "\u2014"}</td></tr>))}</tbody></table>
              </div>
            </div>
          ))}
        </>)}

        {/* ======= FORMATS (demo) ======= */}
        {activeTab === "formats" && dataMode === "demo" && (<>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>{ALL_FORMATS.map(f => (<button key={f} style={S.formatTab(selectedFormatTab === f)} onClick={() => setSelectedFormatTab(f)}>{FORMAT_CONFIG[f].label}</button>))}</div>
          {FORMAT_CONFIG[selectedFormatTab] && (<div style={S.formatInfo}><div style={{ fontSize: 15, fontWeight: 800, color: NURU.gold, marginBottom: 4 }}>{FORMAT_CONFIG[selectedFormatTab].label}</div><div style={{ fontSize: 11, color: NURU.textMuted, marginBottom: 8 }}>{FORMAT_CONFIG[selectedFormatTab].description}</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{FORMAT_CONFIG[selectedFormatTab].subFormats.map(sf => (<span key={sf.name} style={S.badge}>{sf.name} ({sf.size})</span>))}</div></div>)}
          <div style={S.kpiRow}>{getChannelKpis(selectedFormatTab).slice(0, 5).map(k => (<div key={k.label} style={S.kpiCard}><div style={S.kpiLabel}>{k.label}<InfoBtn label={k.label} /></div><div style={S.kpiValue}>{k.value}</div></div>))}</div>
          {getChannelKpis(selectedFormatTab).length > 5 && <div style={S.kpiRow}>{getChannelKpis(selectedFormatTab).slice(5).map(k => (<div key={k.label} style={S.kpiCard}><div style={S.kpiLabel}>{k.label}<InfoBtn label={k.label} /></div><div style={S.kpiValue}>{k.value}</div></div>))}</div>}
          <div style={S.grid}>
            <div style={S.card}><div style={S.cardTitle}>Impressions par sous-format</div><ResponsiveContainer width="100%" height={Math.max(160, subFormatBreakdown.length * 40)}><BarChart data={subFormatBreakdown} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} tickFormatter={fmtNum} /><YAxis type="category" dataKey="subFormat" stroke={NURU.textMuted} fontSize={10} width={150} /><Tooltip content={<CT />} /><Bar dataKey="impressions" name="Impressions" fill={CHART_GOLD} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
            <div style={S.card}><div style={S.cardTitle}>CPM par sous-format (EUR)</div><ResponsiveContainer width="100%" height={Math.max(160, subFormatBreakdown.length * 40)}><BarChart data={subFormatBreakdown} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} /><YAxis type="category" dataKey="subFormat" stroke={NURU.textMuted} fontSize={10} width={150} /><Tooltip content={<CT />} /><Bar dataKey="cpm" name="CPM EUR" fill={NURU.goldDark} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
            {quartileData && <div style={S.card}><div style={S.cardTitle}>Completion par quartile (%)</div><ResponsiveContainer width="100%" height={220}><BarChart data={quartileData}><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis dataKey="quartile" stroke={NURU.textMuted} fontSize={10} /><YAxis stroke={NURU.textMuted} fontSize={10} domain={[0, 100]} /><Tooltip content={<CT />} /><Bar dataKey="value" name="Completion %" fill={CHART_GOLD} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>}
            <div style={S.card}><div style={S.cardTitle}>CTR par sous-format (%)</div><ResponsiveContainer width="100%" height={220}><BarChart data={subFormatBreakdown.filter(s => s.ctr > 0).sort((a, b) => b.ctr - a.ctr)}><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis dataKey="subFormat" stroke={NURU.textMuted} fontSize={9} interval={0} angle={-20} textAnchor="end" height={50} /><YAxis stroke={NURU.textMuted} fontSize={10} /><Tooltip content={<CT />} /><Bar dataKey="ctr" name="CTR %" fill={NURU.goldLight} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            <div style={{ ...S.card, ...S.cardFull, overflowX: "auto" }}><div style={S.cardTitle}>Detail des sous-formats</div>
              <table style={S.table}><thead><tr>{thInfo("Sous-format")}{thInfo("Impressions")}{thInfo("Depenses")}{thInfo("CPM")}{["Display", "Native", "Video", "Audio"].includes(selectedFormatTab) && <>{thInfo("Clics")}{thInfo("CTR")}</>}{["Video", "CTV"].includes(selectedFormatTab) && thInfo("VCR")}{selectedFormatTab === "Audio" && thInfo("LTR")}{thInfo("Viewability")}</tr></thead>
              <tbody>{subFormatBreakdown.map((sf, i) => (<tr key={sf.subFormat} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={{ ...S.td, fontWeight: 600 }}>{sf.subFormat}</td><td style={S.td}>{fmtNum(sf.impressions)}</td><td style={S.td}>{fmtCur(sf.spend)}</td><td style={S.td}>{sf.cpm} EUR</td>{["Display", "Native", "Video", "Audio"].includes(selectedFormatTab) && <><td style={S.td}>{fmtNum(sf.clicks)}</td><td style={S.td}>{sf.ctr}%</td></>}{["Video", "CTV"].includes(selectedFormatTab) && <td style={S.td}>{sf.vcr > 0 ? sf.vcr + "%" : "\u2014"}</td>}{selectedFormatTab === "Audio" && <td style={S.td}>{sf.ltr > 0 ? sf.ltr + "%" : "\u2014"}</td>}<td style={S.td}>{sf.viewability > 0 ? sf.viewability + "%" : "\u2014"}</td></tr>))}</tbody></table>
            </div>
          </div>
        </>)}

        {/* ======= FORMATS (campaign) ======= */}
        {activeTab === "formats" && dataMode === "campaign" && (<>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>{uniqueChannelTypes.map(f => (<button key={f} style={S.formatTab(selectedFormatTab === f)} onClick={() => setSelectedFormatTab(f)}>{f}</button>))}</div>
          {(() => {
            const ch = campaignFormatBreakdown.find(f => f.format === selectedFormatTab);
            if (!ch) return null;
            const chKpis = [{ label: "Impressions", value: fmtNum(ch.impressions) }, { label: "Budget", value: fmtCur(ch.budget) }, { label: "Depenses", value: fmtCur(ch.spend) }, { label: "CPM", value: ch.cpm + " EUR" }, { label: "Clics", value: fmtNum(ch.clicks) }, { label: "CTR", value: ch.ctr + "%" }, { label: "CPC", value: ch.cpc + " EUR" }, { label: "Viewability", value: ch.viewability + "%" }];
            const chCreatives = filteredCreativeData.filter(r => r.channelType === selectedFormatTab);
            const sizeMap = {};
            chCreatives.forEach(r => { if (!sizeMap[r.creativeSize]) sizeMap[r.creativeSize] = { subFormat: r.creativeSize, impressions: 0, clicks: 0, spend: 0 }; sizeMap[r.creativeSize].impressions += r.impressions; sizeMap[r.creativeSize].clicks += r.clicks; sizeMap[r.creativeSize].spend += r.mediaCost; });
            const sizeBreakdown = Object.values(sizeMap).map(d => ({ ...d, ctr: d.impressions > 0 ? +((d.clicks / d.impressions) * 100).toFixed(2) : 0, cpm: d.impressions > 0 ? +(d.spend / (d.impressions / 1000)).toFixed(2) : 0 })).sort((a, b) => b.impressions - a.impressions);
            return (<>
              <div style={S.kpiRow}>{chKpis.map(k => (<div key={k.label} style={S.kpiCard}><div style={S.kpiLabel}>{k.label}<InfoBtn label={k.label} /></div><div style={S.kpiValue}>{k.value}</div></div>))}</div>
              <div style={S.grid}>
                <div style={S.card}><div style={S.cardTitle}>Impressions par taille</div>
                  <ResponsiveContainer width="100%" height={Math.max(160, sizeBreakdown.length * 40)}><BarChart data={sizeBreakdown} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} tickFormatter={fmtNum} /><YAxis type="category" dataKey="subFormat" stroke={NURU.textMuted} fontSize={10} width={100} /><Tooltip content={<CT />} /><Bar dataKey="impressions" name="Impressions" fill={CHART_GOLD} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
                </div>
                <div style={S.card}><div style={S.cardTitle}>CTR par taille (%)</div>
                  <ResponsiveContainer width="100%" height={Math.max(160, sizeBreakdown.filter(s => s.ctr > 0).length * 40)}><BarChart data={sizeBreakdown.filter(s => s.ctr > 0).sort((a, b) => b.ctr - a.ctr)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} /><YAxis type="category" dataKey="subFormat" stroke={NURU.textMuted} fontSize={10} width={100} /><Tooltip content={<CT />} /><Bar dataKey="ctr" name="CTR %" fill={NURU.goldLight} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
                </div>
                <div style={{ ...S.card, ...S.cardFull, overflowX: "auto" }}><div style={S.cardTitle}>Detail par taille</div>
                  <table style={S.table}><thead><tr>{["Taille", "Impressions", "Clics", "CTR", "Depenses", "CPM"].map(h => thInfo(h))}</tr></thead>
                  <tbody>{sizeBreakdown.map((sf, i) => (<tr key={sf.subFormat} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={{ ...S.td, fontWeight: 600 }}>{sf.subFormat}</td><td style={S.td}>{fmtNum(sf.impressions)}</td><td style={S.td}>{fmtNum(sf.clicks)}</td><td style={S.td}>{sf.ctr}%</td><td style={S.td}>{fmtCurDec(sf.spend)}</td><td style={S.td}>{sf.cpm} EUR</td></tr>))}</tbody></table>
                </div>
              </div>
            </>);
          })()}
        </>)}

        {/* ======= CREATIVES (demo) ======= */}
        {activeTab === "creatives" && dataMode === "demo" && (<>
          <div style={{ ...S.formatInfo, marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 700, color: NURU.gold, marginBottom: 4 }}>Analyse par axe creatif</div><div style={{ fontSize: 11, color: NURU.textMuted }}>Un axe creatif represente un angle de communication (Axe creatif 1 a 5). Chaque axe peut se decliner en plusieurs formats : Display, Video, Audio et In-Game.</div></div>
          <div style={S.grid}>
            <div style={{ ...S.card, ...S.cardFull }}><div style={S.cardTitle}>Depenses par axe creatif</div>
              <ResponsiveContainer width="100%" height={Math.max(200, creativeAxisData.length * 44)}><BarChart data={creativeAxisData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} /><YAxis type="category" dataKey="creative" stroke={NURU.textMuted} fontSize={11} width={140} /><Tooltip content={<CT />} /><Bar dataKey="spend" name="Depenses EUR" fill={CHART_GOLD} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>CTR par axe creatif (%)</div>
              <ResponsiveContainer width="100%" height={Math.max(200, creativeAxisData.filter(c => c.ctr > 0).length * 40)}><BarChart data={creativeAxisData.filter(c => c.ctr > 0).sort((a, b) => b.ctr - a.ctr)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} /><YAxis type="category" dataKey="creative" stroke={NURU.textMuted} fontSize={11} width={140} /><Tooltip content={<CT />} /><Bar dataKey="ctr" name="CTR %" fill={NURU.goldDark} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>Repartition impressions</div>
              <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={creativeAxisData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="impressions" nameKey="creative" label={({ creative, percent }) => percent > 0.05 ? `${creative} ${(percent * 100).toFixed(0)}%` : ""} labelLine={false} fontSize={10}>{creativeAxisData.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}</Pie><Tooltip content={<CT />} /></PieChart></ResponsiveContainer>
            </div>
            <div style={{ ...S.card, ...S.cardFull, overflowX: "auto" }}><div style={S.cardTitle}>Performance par axe creatif</div>
              <table style={S.table}><thead><tr>{["Axe creatif", "Formats actifs", "Impressions", "Clics", "CTR", "Depenses", "CPM", "CPC", "Viewability", "VCR", "Conv."].map(h => thInfo(h))}</tr></thead>
              <tbody>{creativeAxisData.map((c, i) => (<tr key={c.creative} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={{ ...S.td, fontWeight: 600 }}>{c.creative}</td><td style={S.td}><span style={{ fontSize: 10, color: NURU.textMuted }}>{c.formats}</span></td><td style={S.td}>{fmtNum(c.impressions)}</td><td style={S.td}>{fmtNum(c.clicks)}</td><td style={S.td}>{c.ctr}%</td><td style={S.td}>{fmtCur(c.spend)}</td><td style={S.td}>{c.cpm} EUR</td><td style={S.td}>{c.cpc > 0 ? c.cpc + " EUR" : "\u2014"}</td><td style={S.td}>{c.viewability > 0 ? c.viewability + "%" : "\u2014"}</td><td style={S.td}>{c.vcr > 0 ? c.vcr + "%" : "\u2014"}</td><td style={S.td}>{fmtNum(c.conversions)}</td></tr>))}</tbody></table>
            </div>
          </div>
        </>)}

        {/* ======= CREATIVES (campaign) ======= */}
        {activeTab === "creatives" && dataMode === "campaign" && (<>
          <div style={{ ...S.formatInfo, marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 700, color: NURU.gold, marginBottom: 4 }}>Analyse par axe creatif</div><div style={{ fontSize: 11, color: NURU.textMuted }}>Performance de chaque annonce (creative) utilisee dans la campagne. Les creatifs sont classes par depenses.</div></div>
          <div style={S.grid}>
            <div style={{ ...S.card, ...S.cardFull }}><div style={S.cardTitle}>Depenses par axe creatif</div>
              <ResponsiveContainer width="100%" height={Math.max(300, creativePerformance.slice(0, 20).length * 28)}><BarChart data={creativePerformance.slice(0, 20)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} /><YAxis type="category" dataKey="creative" stroke={NURU.textMuted} fontSize={8} width={200} /><Tooltip content={<CT />} /><Bar dataKey="spend" name="Depenses EUR" fill={CHART_GOLD} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>CTR par axe creatif (%)</div>
              <ResponsiveContainer width="100%" height={Math.max(300, creativePerformance.filter(c => c.ctr > 0).slice(0, 15).length * 28)}><BarChart data={creativePerformance.filter(c => c.ctr > 0).sort((a, b) => b.ctr - a.ctr).slice(0, 15)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} /><YAxis type="category" dataKey="creative" stroke={NURU.textMuted} fontSize={8} width={200} /><Tooltip content={<CT />} /><Bar dataKey="ctr" name="CTR %" fill={NURU.goldDark} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>Repartition impressions</div>
              <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={creativePerformance.slice(0, 10)} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="impressions" nameKey="creative" label={({ creative, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""} labelLine={false} fontSize={9}>{creativePerformance.slice(0, 10).map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}</Pie><Tooltip content={<CT />} /><Legend wrapperStyle={{ fontSize: 9 }} /></PieChart></ResponsiveContainer>
            </div>
            <div style={{ ...S.card, ...S.cardFull, overflowX: "auto" }}><div style={S.cardTitle}>Performance par axe creatif</div>
              <table style={S.table}><thead><tr>{["Creatif", "Taille", "Canal", "Cibles", "Impressions", "Clics", "CTR", "Depenses", "CPM", "CPC"].map(h => thInfo(h))}</tr></thead>
              <tbody>{creativePerformance.map((c, i) => (<tr key={c.creative + i} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={{ ...S.td, fontWeight: 600, fontSize: 10 }}>{c.creative}</td><td style={S.td}>{c.size}</td><td style={S.td}><span style={S.badge}>{c.channelType}</span></td><td style={{ ...S.td, fontSize: 10, color: NURU.textMuted }}>{c.personas}</td><td style={S.td}>{fmtNum(c.impressions)}</td><td style={S.td}>{fmtNum(c.clicks)}</td><td style={S.td}>{c.ctr}%</td><td style={S.td}>{fmtCurDec(c.spend)}</td><td style={S.td}>{c.cpm} EUR</td><td style={S.td}>{c.cpc > 0 ? c.cpc + " EUR" : "\u2014"}</td></tr>))}</tbody></table>
            </div>
          </div>
        </>)}

        {/* ======= ROI (demo) ======= */}
        {activeTab === "roi" && dataMode === "demo" && (<>
          <div style={{ ...S.formatInfo, marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 700, color: NURU.gold, marginBottom: 4 }}>Analyse des couts</div><div style={{ fontSize: 11, color: NURU.textMuted }}>Efficacite du budget : rapport entre les couts (CPM, CPC, CPA) et les resultats (CTR, conversions).</div></div>
          <div style={S.grid}>
            <div style={{ ...S.card, ...S.cardFull }}><div style={S.cardTitle}>Evolution CPM et CTR</div>
              <ResponsiveContainer width="100%" height={300}><ComposedChart data={roiTimeSeries}><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis dataKey="label" stroke={NURU.textMuted} fontSize={10} tickLine={false} /><YAxis yAxisId="l" stroke={NURU.textMuted} fontSize={10} /><YAxis yAxisId="r" orientation="right" stroke={NURU.textMuted} fontSize={10} /><Tooltip content={<CT />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Area yAxisId="l" type="monotone" dataKey="cpmTrend" name="CPM EUR" fill={CHART_GOLD_FILL} stroke={CHART_GOLD} strokeWidth={2} /><Line yAxisId="r" type="monotone" dataKey="ctrTrend" name="CTR %" stroke={NURU.goldLight} strokeWidth={2} dot={false} /></ComposedChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>CPM par canal (EUR)</div>
              <ResponsiveContainer width="100%" height={280}><BarChart data={roiData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} /><YAxis type="category" dataKey="format" stroke={NURU.textMuted} fontSize={11} width={100} /><Tooltip content={<CT />} /><Bar dataKey="cpm" name="CPM EUR" fill={CHART_GOLD} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>CTR par canal (%)</div>
              <ResponsiveContainer width="100%" height={280}><BarChart data={roiData.filter(r => r.ctr > 0).sort((a, b) => b.ctr - a.ctr)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} /><YAxis type="category" dataKey="format" stroke={NURU.textMuted} fontSize={11} width={100} /><Tooltip content={<CT />} /><Bar dataKey="ctr" name="CTR %" fill={NURU.goldDark} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
            </div>
            <div style={{ ...S.card, ...S.cardFull, overflowX: "auto" }}><div style={S.cardTitle}>Tableau ROI par canal</div>
              <table style={S.table}><thead><tr>{["Canal", "Depenses", "Impressions", "Clics", "CTR", "CPM", "CPC", "Conversions", "CPA", "Taux conv."].map(h => thInfo(h))}</tr></thead>
              <tbody>{roiData.map((r, i) => (<tr key={r.format} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={S.td}><span style={S.badge}>{r.format}</span></td><td style={S.td}>{fmtCur(r.spend)}</td><td style={S.td}>{fmtNum(formatBreakdown.find(f => f.format === r.format)?.impressions || 0)}</td><td style={S.td}>{fmtNum(formatBreakdown.find(f => f.format === r.format)?.clicks || 0)}</td><td style={S.td}>{r.ctr}%</td><td style={S.td}>{r.cpm} EUR</td><td style={S.td}>{r.cpc > 0 ? r.cpc + " EUR" : "\u2014"}</td><td style={S.td}>{fmtNum(formatBreakdown.find(f => f.format === r.format)?.conversions || 0)}</td><td style={S.td}>{r.cpa > 0 ? r.cpa + " EUR" : "\u2014"}</td><td style={S.td}>{r.convRate > 0 ? r.convRate + "%" : "\u2014"}</td></tr>))}</tbody></table>
            </div>
          </div>
        </>)}

        {/* ======= ROI (campaign) ======= */}
        {activeTab === "roi" && dataMode === "campaign" && (<>
          <div style={{ ...S.formatInfo, marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 700, color: NURU.gold, marginBottom: 4 }}>Analyse des couts</div><div style={{ fontSize: 11, color: NURU.textMuted }}>Comparaison de l&apos;efficacite entre Display et Native.</div></div>
          <div style={S.grid}>
            <div style={S.card}><div style={S.cardTitle}>CPM par canal (EUR)</div>
              <ResponsiveContainer width="100%" height={200}><BarChart data={campaignFormatBreakdown}><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis dataKey="format" stroke={NURU.textMuted} fontSize={11} /><YAxis stroke={NURU.textMuted} fontSize={10} /><Tooltip content={<CT />} /><Bar dataKey="cpm" name="CPM EUR" fill={CHART_GOLD} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>CTR par canal (%)</div>
              <ResponsiveContainer width="100%" height={200}><BarChart data={campaignFormatBreakdown}><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis dataKey="format" stroke={NURU.textMuted} fontSize={11} /><YAxis stroke={NURU.textMuted} fontSize={10} /><Tooltip content={<CT />} /><Bar dataKey="ctr" name="CTR %" fill={NURU.goldDark} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>CPC par canal (EUR)</div>
              <ResponsiveContainer width="100%" height={200}><BarChart data={campaignFormatBreakdown.filter(f => f.cpc > 0)}><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis dataKey="format" stroke={NURU.textMuted} fontSize={11} /><YAxis stroke={NURU.textMuted} fontSize={10} /><Tooltip content={<CT />} /><Bar dataKey="cpc" name="CPC EUR" fill={NURU.goldLight} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>Repartition depenses</div>
              <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={campaignFormatBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="spend" nameKey="format" label={({ format, percent }) => `${format} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>{campaignFormatBreakdown.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}</Pie><Tooltip content={<CT />} /></PieChart></ResponsiveContainer>
            </div>
            <div style={{ ...S.card, ...S.cardFull, overflowX: "auto" }}><div style={S.cardTitle}>Tableau ROI</div>
              <table style={S.table}><thead><tr>{["Canal", "Budget", "Depenses", "Impressions", "Clics", "CTR", "CPM", "CPC", "Viewability"].map(h => thInfo(h))}</tr></thead>
              <tbody>{campaignFormatBreakdown.map((f, i) => (<tr key={f.format} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={S.td}><span style={S.badge}>{f.format}</span></td><td style={S.td}>{fmtCur(f.budget)}</td><td style={S.td}>{fmtCur(f.spend)}</td><td style={S.td}>{fmtNum(f.impressions)}</td><td style={S.td}>{fmtNum(f.clicks)}</td><td style={S.td}>{f.ctr}%</td><td style={S.td}>{f.cpm} EUR</td><td style={S.td}>{f.cpc > 0 ? f.cpc + " EUR" : "\u2014"}</td><td style={S.td}>{f.viewability}%</td></tr>))}</tbody></table>
            </div>
          </div>
        </>)}

        {/* ======= VISIBILITY (demo) ======= */}
        {activeTab === "visibility" && dataMode === "demo" && (<>
          <div style={{ ...S.formatInfo, marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 700, color: NURU.gold, marginBottom: 4 }}>Analyse Visibilite</div><div style={{ fontSize: 11, color: NURU.textMuted }}>La viewability mesure le pourcentage d&apos;impressions reellement vues.</div></div>
          <div style={S.grid}>
            <div style={{ ...S.card, ...S.cardFull }}><div style={S.cardTitle}>Viewability par canal (%)</div>
              <ResponsiveContainer width="100%" height={280}><BarChart data={visibilityData.filter(v => v.viewability > 0).sort((a, b) => b.viewability - a.viewability)}><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis dataKey="format" stroke={NURU.textMuted} fontSize={11} /><YAxis stroke={NURU.textMuted} fontSize={10} domain={[0, 100]} /><Tooltip content={<CT />} /><Bar dataKey="viewability" name="Viewability %" fill={CHART_GOLD} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>Impressions totales vs visibles</div>
              <ResponsiveContainer width="100%" height={Math.max(200, visibilityData.length * 40)}><BarChart data={visibilityData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} tickFormatter={fmtNum} /><YAxis type="category" dataKey="format" stroke={NURU.textMuted} fontSize={11} width={100} /><Tooltip content={<CT />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="impressions" name="Totales" fill={NURU.goldDark + "88"} radius={[0, 4, 4, 0]} /><Bar dataKey="visibleImpressions" name="Visibles" fill={CHART_GOLD} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>VCR et LTR par canal (%)</div>
              <ResponsiveContainer width="100%" height={Math.max(200, visibilityData.filter(v => v.vcr > 0 || v.ltr > 0).length * 40 || 200)}><BarChart data={visibilityData.filter(v => v.vcr > 0 || v.ltr > 0)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} domain={[0, 100]} /><YAxis type="category" dataKey="format" stroke={NURU.textMuted} fontSize={11} width={100} /><Tooltip content={<CT />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="vcr" name="VCR %" fill={CHART_GOLD} radius={[0, 4, 4, 0]} /><Bar dataKey="ltr" name="LTR %" fill={NURU.goldDark} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
            </div>
            <div style={{ ...S.card, ...S.cardFull, overflowX: "auto" }}><div style={S.cardTitle}>Tableau visibilite par canal</div>
              <table style={S.table}><thead><tr>{["Canal", "Impressions totales", "Impressions visibles", "Viewability", "VCR", "LTR"].map(h => thInfo(h))}</tr></thead>
              <tbody>{visibilityData.map((v, i) => (<tr key={v.format} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={S.td}><span style={S.badge}>{v.format}</span></td><td style={S.td}>{fmtNum(v.impressions)}</td><td style={S.td}>{fmtNum(v.visibleImpressions)}</td><td style={S.td}>{v.viewability > 0 ? v.viewability + "%" : "\u2014"}</td><td style={S.td}>{v.vcr > 0 ? v.vcr + "%" : "\u2014"}</td><td style={S.td}>{v.ltr > 0 ? v.ltr + "%" : "\u2014"}</td></tr>))}</tbody></table>
            </div>
          </div>
        </>)}

        {/* ======= VISIBILITY (campaign) ======= */}
        {activeTab === "visibility" && dataMode === "campaign" && (<>
          <div style={{ ...S.formatInfo, marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 700, color: NURU.gold, marginBottom: 4 }}>Analyse Visibilite</div><div style={{ fontSize: 11, color: NURU.textMuted }}>Viewability et impressions mesurees par canal.</div></div>
          {(() => {
            const visData = filteredCampaignData.map(r => ({ format: r.channelType + " - " + r.persona, channelType: r.channelType, viewability: r.viewPct, impressions: r.impressions, impressionsViewed: r.impressionsViewed, impressionsMeasurable: r.impressionsMeasurable, visibleRate: r.impressionsMeasurable > 0 ? +((r.impressionsViewed / r.impressionsMeasurable) * 100).toFixed(1) : 0 }));
            return (
              <div style={S.grid}>
                <div style={{ ...S.card, ...S.cardFull }}><div style={S.cardTitle}>Viewability par campagne (%)</div>
                  <ResponsiveContainer width="100%" height={200}><BarChart data={visData}><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis dataKey="format" stroke={NURU.textMuted} fontSize={9} interval={0} angle={-10} textAnchor="end" height={60} /><YAxis stroke={NURU.textMuted} fontSize={10} domain={[0, 100]} /><Tooltip content={<CT />} /><Bar dataKey="viewability" name="Viewability %" fill={CHART_GOLD} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
                </div>
                <div style={{ ...S.card, ...S.cardFull }}><div style={S.cardTitle}>Impressions vues vs mesurables</div>
                  <ResponsiveContainer width="100%" height={Math.max(160, visData.length * 40)}><BarChart data={visData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} tickFormatter={fmtNum} /><YAxis type="category" dataKey="format" stroke={NURU.textMuted} fontSize={9} width={220} /><Tooltip content={<CT />} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="impressionsMeasurable" name="Mesurables" fill={NURU.goldDark + "88"} radius={[0, 4, 4, 0]} /><Bar dataKey="impressionsViewed" name="Vues" fill={CHART_GOLD} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
                </div>
                <div style={{ ...S.card, ...S.cardFull, overflowX: "auto" }}><div style={S.cardTitle}>Detail visibilite</div>
                  <table style={S.table}><thead><tr>{["Campagne", "Impressions", "Mesurables", "Vues", "Viewability", "Taux mesure"].map(h => thInfo(h))}</tr></thead>
                  <tbody>{visData.map((v, i) => (<tr key={v.format} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={{ ...S.td, fontWeight: 600, fontSize: 10 }}>{v.format}</td><td style={S.td}>{fmtNum(v.impressions)}</td><td style={S.td}>{fmtNum(v.impressionsMeasurable)}</td><td style={S.td}>{fmtNum(v.impressionsViewed)}</td><td style={S.td}>{v.viewability > 0 ? fmtPct(v.viewability) : "\u2014"}</td><td style={S.td}>{v.visibleRate > 0 ? v.visibleRate + "%" : "\u2014"}</td></tr>))}</tbody></table>
                </div>
              </div>
            );
          })()}
        </>)}

        {/* ======= SITES (demo) ======= */}
        {activeTab === "sites" && dataMode === "demo" && (<div style={S.grid}>
          <div style={{ ...S.card, ...S.cardFull }}><div style={S.cardTitle}>Depenses par site (EUR)</div><ResponsiveContainer width="100%" height={Math.max(280, sitePerformance.length * 34)}><BarChart data={sitePerformance} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} /><YAxis type="category" dataKey="site" stroke={NURU.textMuted} fontSize={11} width={110} /><Tooltip content={<CT />} /><Bar dataKey="spend" name="Depenses EUR" fill={CHART_GOLD} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
          <div style={S.card}><div style={S.cardTitle}>CTR par site (%)</div><ResponsiveContainer width="100%" height={Math.max(260, sitePerformance.filter(s => s.ctr > 0).length * 34)}><BarChart data={sitePerformance.filter(s => s.ctr > 0).sort((a, b) => b.ctr - a.ctr)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} /><YAxis type="category" dataKey="site" stroke={NURU.textMuted} fontSize={11} width={110} /><Tooltip content={<CT />} /><Bar dataKey="ctr" name="CTR %" fill={NURU.goldDark} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
          <div style={S.card}><div style={S.cardTitle}>Repartition devices</div><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={deviceBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>{deviceBreakdown.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}</Pie><Tooltip content={<CT />} /></PieChart></ResponsiveContainer></div>
          <div style={{ ...S.card, ...S.cardFull, overflowX: "auto" }}><div style={S.cardTitle}>Performance par site</div><table style={S.table}><thead><tr>{["Site", "Impressions", "Clics", "CTR", "Depenses", "CPM", "CPA", "Conv."].map(h => thInfo(h))}</tr></thead><tbody>{sitePerformance.map((s, i) => (<tr key={s.site} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={{ ...S.td, fontWeight: 600 }}>{s.site}</td><td style={S.td}>{fmtNum(s.impressions)}</td><td style={S.td}>{fmtNum(s.clicks)}</td><td style={S.td}>{s.ctr}%</td><td style={S.td}>{fmtCur(s.spend)}</td><td style={S.td}>{s.cpm} EUR</td><td style={S.td}>{s.cpa > 0 ? s.cpa + " EUR" : "\u2014"}</td><td style={S.td}>{fmtNum(s.conversions)}</td></tr>))}</tbody></table></div>
        </div>)}

        {/* ======= DOMAINES (campaign) ======= */}
        {activeTab === "sites" && dataMode === "campaign" && (<div style={S.grid}>
          <div style={{ ...S.card, ...S.cardFull }}><div style={S.cardTitle}>Top 30 domaines par depenses (EUR)</div>
            <ResponsiveContainer width="100%" height={Math.max(280, Math.min(domainPerformanceReal.length, 30) * 24)}><BarChart data={domainPerformanceReal.slice(0, 30)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} /><YAxis type="category" dataKey="site" stroke={NURU.textMuted} fontSize={9} width={140} /><Tooltip content={<CT />} /><Bar dataKey="spend" name="Depenses EUR" fill={CHART_GOLD} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
          </div>
          <div style={S.card}><div style={S.cardTitle}>Top 20 CTR par domaine (%)</div>
            <ResponsiveContainer width="100%" height={Math.max(260, Math.min(domainPerformanceReal.filter(s => s.ctr > 0).length, 20) * 24)}><BarChart data={domainPerformanceReal.filter(s => s.ctr > 0).sort((a, b) => b.ctr - a.ctr).slice(0, 20)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder} /><XAxis type="number" stroke={NURU.textMuted} fontSize={10} /><YAxis type="category" dataKey="site" stroke={NURU.textMuted} fontSize={9} width={140} /><Tooltip content={<CT />} /><Bar dataKey="ctr" name="CTR %" fill={NURU.goldDark} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
          </div>
          <div style={S.card}><div style={S.cardTitle}>Repartition impressions (top 10)</div>
            <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={domainPerformanceReal.slice(0, 10)} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="impressions" nameKey="site" label={({ percent }) => percent > 0.03 ? `${(percent * 100).toFixed(0)}%` : ""} labelLine={false} fontSize={9}>{domainPerformanceReal.slice(0, 10).map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}</Pie><Tooltip content={<CT />} /><Legend wrapperStyle={{ fontSize: 9 }} /></PieChart></ResponsiveContainer>
          </div>
          <div style={{ ...S.card, ...S.cardFull, overflowX: "auto" }}><div style={S.cardTitle}>Performance par domaine ({domainPerformanceReal.length} domaines)</div>
            <table style={S.table}><thead><tr>{["Domaine", "Impressions", "Clics", "CTR", "Depenses", "CPM"].map(h => thInfo(h))}</tr></thead>
            <tbody>{domainPerformanceReal.slice(0, 100).map((s, i) => (<tr key={s.site} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={{ ...S.td, fontWeight: 600, fontSize: 10 }}>{s.site}</td><td style={S.td}>{fmtNum(s.impressions)}</td><td style={S.td}>{fmtNum(s.clicks)}</td><td style={S.td}>{s.ctr}%</td><td style={S.td}>{fmtCurDec(s.spend)}</td><td style={S.td}>{s.cpm} EUR</td></tr>))}</tbody></table>
            {domainPerformanceReal.length > 100 && <p style={{ padding: 12, color: NURU.textMuted, fontSize: 11, textAlign: "center" }}>100 premiers sur {domainPerformanceReal.length}</p>}
          </div>
        </div>)}

        {/* ======= SITE & ROI MATOMO ======= */}
        {activeTab === "matomo" && dataMode === "campaign" && matomoReconciliation && (() => {
          const r = matomoReconciliation;
          const k = r.kpis;
          // Color a delta value: green when within ±15 %, gold beyond, red if very negative.
          const deltaColor = (val, goodIfPositive = true) => {
            if (Math.abs(val) < 15) return NURU.green;
            if (goodIfPositive ? val < -30 : val > 30) return NURU.red;
            return NURU.gold;
          };
          // Funnel: list of stages [{label, value, hint?}], displayed as proportional horizontal bars.
          const Funnel = ({ title, stages }) => {
            const max = Math.max(...stages.map(s => s.value || 0), 1);
            return (
              <div style={S.card}>
                <div style={S.cardTitle}>{title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {stages.map((s, i) => {
                    const pct = (s.value / max) * 100;
                    return (
                      <div key={s.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 10, color: NURU.textMuted }}>
                          <span style={{ fontWeight: 700, color: NURU.text }}>{s.label}</span>
                          <span>{fmtNum(s.value)}{s.hint ? ` · ${s.hint}` : ""}</span>
                        </div>
                        <div style={{ height: 18, background: NURU.cardBorder, borderRadius: 4, overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: i === 0 ? NURU.gold : i === stages.length - 1 ? NURU.green : NURU.goldDark, transition: "width 0.4s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          };
          return (<>
            <div style={{ ...S.formatInfo, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: NURU.text, lineHeight: 1.5 }}>
                <strong style={{ color: NURU.gold }}>Vue globale, hors filtres.</strong> Comparaison entre les chiffres du serveur Ads (impressions, clics, conversions diffusées) et ceux remontés par Matomo (visites réelles sur le site, comportement, conversions trackées). Les écarts s&apos;expliquent par les ad-blockers, l&apos;attribution post-view côté Ads et le délai d&apos;exécution du pixel Matomo.
              </div>
            </div>

            {/* KPI cards */}
            <div style={S.kpiRow}>
              <div style={S.kpiCard}><div style={S.kpiLabel}>Visites Matomo (total)</div><div style={S.kpiValue}>{fmtNum(k.visitsAll)}</div><div style={{ fontSize: 10, color: NURU.textMuted, marginTop: 4 }}>dont {fmtNum(k.visitsAds)} via canaux Ads</div></div>
              <div style={S.kpiCard}><div style={S.kpiLabel}>Taux d&apos;arrivée</div><div style={{ ...S.kpiValue, color: k.arrivalRate < 50 ? NURU.red : k.arrivalRate < 70 ? NURU.gold : NURU.green }}>{fmtPct(k.arrivalRate)}</div><div style={{ fontSize: 10, color: NURU.textMuted, marginTop: 4 }}>Visites ÷ Clics Ads</div></div>
              <div style={S.kpiCard}><div style={S.kpiLabel}>CPA réel (Matomo)</div><div style={S.kpiValue}>{k.realCpa > 0 ? fmtCurDec(k.realCpa) : "—"}</div><div style={{ fontSize: 10, color: NURU.textMuted, marginTop: 4 }}>vs CPA Ads {k.cpaAds > 0 ? fmtCurDec(k.cpaAds) : "—"}</div></div>
              <div style={S.kpiCard}><div style={S.kpiLabel}>ROAS</div><div style={{ ...S.kpiValue, color: k.roas > 100 ? NURU.green : k.roas > 50 ? NURU.gold : NURU.red }}>{fmtPct(k.roas)}</div><div style={{ fontSize: 10, color: NURU.textMuted, marginTop: 4 }}>Revenu Matomo ÷ Coût Ads</div></div>
            </div>

            <div style={S.kpiRow}>
              <div style={S.kpiCard}><div style={S.kpiLabel}>Conversions Ads</div><div style={S.kpiValue}>{fmtNum(k.adsConversions)}</div></div>
              <div style={S.kpiCard}><div style={S.kpiLabel}>Conversions Matomo</div><div style={S.kpiValue}>{fmtNum(k.matoConversions)}</div></div>
              <div style={S.kpiCard}><div style={S.kpiLabel}>Δ Conv. (Matomo vs Ads)</div><div style={{ ...S.kpiValue, color: deltaColor(k.convDelta) }}>{(k.convDelta >= 0 ? "+" : "") + k.convDelta.toFixed(1)}%</div></div>
              <div style={S.kpiCard}><div style={S.kpiLabel}>Taux de rebond moyen</div><div style={{ ...S.kpiValue, color: k.bounceRate > 70 ? NURU.red : k.bounceRate > 50 ? NURU.gold : NURU.green }}>{fmtPct(k.bounceRate)}</div></div>
            </div>

            {/* Comparison table */}
            <div style={{ ...S.card, ...S.cardFull, overflowX: "auto", marginBottom: 16 }}>
              <div style={S.cardTitle}>Comparaison Ads ↔ Matomo par canal</div>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>Canal</th>
                  <th style={S.th}>Impressions</th>
                  <th style={S.th}>Clics Ads</th>
                  <th style={S.th}>Visites Matomo</th>
                  <th style={S.th}>Taux arrivée</th>
                  <th style={S.th}>Conv. Ads</th>
                  <th style={S.th}>Conv. Matomo</th>
                  <th style={S.th}>Δ Conv.</th>
                  <th style={S.th}>Coût Ads</th>
                  <th style={S.th}>CPA réel</th>
                  <th style={S.th}>Revenu</th>
                  <th style={S.th}>ROAS</th>
                  <th style={S.th}>Rebond</th>
                  <th style={S.th}>Temps moy.</th>
                </tr></thead>
                <tbody>
                  {r.comparable.map((row, i) => (
                    <tr key={row.channel} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}>
                      <td style={{ ...S.td, fontWeight: 700 }}><span style={S.badge}>{row.channel}</span></td>
                      <td style={S.td}>{fmtNum(row.impressions)}</td>
                      <td style={S.td}>{fmtNum(row.clicks)}</td>
                      <td style={S.td}>{fmtNum(row.visits)}</td>
                      <td style={{ ...S.td, color: row.arrivalRate < 50 ? NURU.red : row.arrivalRate < 70 ? NURU.gold : NURU.green, fontWeight: 700 }}>{fmtPct(row.arrivalRate)}</td>
                      <td style={S.td}>{fmtNum(row.adsConversions)}</td>
                      <td style={S.td}>{fmtNum(row.matoConversions)}</td>
                      <td style={{ ...S.td, color: deltaColor(row.convDelta), fontWeight: 700 }}>{(row.convDelta >= 0 ? "+" : "") + row.convDelta.toFixed(0)}%</td>
                      <td style={S.td}>{fmtCurDec(row.spend)}</td>
                      <td style={S.td}>{row.realCpa > 0 ? fmtCurDec(row.realCpa) : "—"}</td>
                      <td style={S.td}>{fmtCurDec(row.revenue)}</td>
                      <td style={{ ...S.td, color: row.roas > 100 ? NURU.green : row.roas > 50 ? NURU.gold : NURU.red, fontWeight: 700 }}>{fmtPct(row.roas)}</td>
                      <td style={S.td}>{fmtPct(row.bounceRate)}</td>
                      <td style={S.td}>{Math.round(row.avgTime)}s</td>
                    </tr>
                  ))}
                  <tr style={{ background: NURU.goldMuted, fontWeight: 700 }}>
                    <td style={{ ...S.td, color: NURU.gold, fontWeight: 800 }}>TOTAL</td>
                    <td style={S.td}>{fmtNum(r.comparable.reduce((s, x) => s + x.impressions, 0))}</td>
                    <td style={S.td}>{fmtNum(r.comparable.reduce((s, x) => s + x.clicks, 0))}</td>
                    <td style={S.td}>{fmtNum(k.visitsAds)}</td>
                    <td style={{ ...S.td, color: NURU.gold, fontWeight: 700 }}>{fmtPct(k.arrivalRate)}</td>
                    <td style={S.td}>{fmtNum(k.adsConversions)}</td>
                    <td style={S.td}>{fmtNum(r.comparable.reduce((s, x) => s + x.matoConversions, 0))}</td>
                    <td style={{ ...S.td, color: deltaColor(k.convDelta), fontWeight: 700 }}>{(k.convDelta >= 0 ? "+" : "") + k.convDelta.toFixed(0)}%</td>
                    <td style={S.td}>{fmtCurDec(k.spend)}</td>
                    <td style={S.td}>{k.realCpa > 0 ? fmtCurDec(k.realCpa) : "—"}</td>
                    <td style={S.td}>{fmtCurDec(k.revenue)}</td>
                    <td style={{ ...S.td, color: k.roas > 100 ? NURU.green : k.roas > 50 ? NURU.gold : NURU.red, fontWeight: 700 }}>{fmtPct(k.roas)}</td>
                    <td style={S.td}>{fmtPct(k.bounceRate)}</td>
                    <td style={S.td}>—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Funnels */}
            <div style={S.grid}>
              {r.comparable.map(row => (
                <Funnel key={row.channel} title={`Funnel ${row.channel}`} stages={[
                  { label: "Impressions", value: row.impressions },
                  { label: "Clics Ads", value: row.clicks, hint: `CTR ${row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(2) : 0}%` },
                  { label: "Visites Matomo", value: row.visits, hint: `Arrivée ${row.arrivalRate.toFixed(0)}%` },
                  { label: "Visites avec conv.", value: row.visitsWithConv, hint: row.visits > 0 && row.visitsWithConv > 0 ? `${((row.visitsWithConv / row.visits) * 100).toFixed(2)}% des visites` : "" },
                ]} />
              ))}
              {r.matomoOnly.length > 0 && (
                <Funnel
                  title={`Hors Ads server (${r.matomoOnly.map(m => m.channel).join(" + ")})`}
                  stages={[
                    { label: "Visites Matomo", value: r.matomoOnly.reduce((s, m) => s + m.visits, 0) },
                    { label: "Conversions", value: r.matomoOnly.reduce((s, m) => s + m.matoConversions, 0) },
                  ]}
                />
              )}
            </div>

            {/* Matomo only */}
            {r.matomoOnly.length > 0 && (
              <div style={{ ...S.card, ...S.cardFull, overflowX: "auto", marginBottom: 16 }}>
                <div style={S.cardTitle}>Canaux hors serveur Ads (Matomo seul)</div>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Canal</th>
                    <th style={S.th}>Visites</th>
                    <th style={S.th}>Conversions</th>
                    <th style={S.th}>Revenu</th>
                    <th style={S.th}>Rebond</th>
                    <th style={S.th}>Temps moy.</th>
                    <th style={S.th}>Actions / visite</th>
                  </tr></thead>
                  <tbody>
                    {r.matomoOnly.map((row, i) => (
                      <tr key={row.channel} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}>
                        <td style={{ ...S.td, fontWeight: 700 }}><span style={S.badge}>{row.channel}</span></td>
                        <td style={S.td}>{fmtNum(row.visits)}</td>
                        <td style={S.td}>{fmtNum(row.matoConversions)}</td>
                        <td style={S.td}>{fmtCurDec(row.revenue)}</td>
                        <td style={{ ...S.td, color: row.bounceRate > 70 ? NURU.red : row.bounceRate > 50 ? NURU.gold : NURU.green }}>{fmtPct(row.bounceRate)}</td>
                        <td style={S.td}>{Math.round(row.avgTime)}s</td>
                        <td style={S.td}>{row.actionsPerVisit.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ fontSize: 10, color: NURU.textMuted, lineHeight: 1.6, padding: "0 4px" }}>
              <strong style={{ color: NURU.text }}>Méthodologie.</strong> Mapping canal Matomo → Ads server : <code>display</code> → Display, <code>native_ads</code> → Native, <code>meta_fb</code>/<code>meta_ig</code> → bloc isolé (Meta n&apos;est pas opéré via le serveur Ads). Le <em>taux d&apos;arrivée</em> compare Visites Matomo et Clics Ads — un taux &lt; 70 % traduit une déperdition (ad-blockers, JS bloqué, page lente, faux clics). Le <em>CPA réel</em> divise le coût media par les conversions trackées Matomo (post-clic uniquement) : il est généralement plus haut que le CPA Ads qui inclut l&apos;attribution post-view.
            </div>
          </>);
        })()}

        {/* ======= TABLE (demo) ======= */}
        {activeTab === "table" && dataMode === "demo" && (<div style={{ ...S.card, overflowX: "auto" }}><div style={S.cardTitle}>Donnees brutes ({filteredData.length.toLocaleString("fr-FR")} lignes)</div>
          <table style={S.table}><thead><tr>{["Date", "Canal", "Sous-format", "Axe creatif", "Device", "Site", "Impr.", "Clics", "CTR", "CPM", "Dep.", "Viewab.", "VCR", "LTR", "Conv."].map(h => thInfo(h))}</tr></thead>
          <tbody>{filteredData.slice(0, 150).map((r, i) => (<tr key={i} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={S.td}>{r.date}</td><td style={S.td}><span style={S.badge}>{r.format}</span></td><td style={{ ...S.td, fontSize: 10 }}>{r.subFormat}</td><td style={{ ...S.td, fontSize: 10 }}>{r.creative || "\u2014"}</td><td style={S.td}>{r.device}</td><td style={S.td}>{r.site}</td><td style={S.td}>{(r.impressions || 0).toLocaleString("fr-FR")}</td><td style={S.td}>{(r.clicks || 0).toLocaleString("fr-FR")}</td><td style={S.td}>{fmtPct(r.ctr || 0)}</td><td style={S.td}>{fmtDec(r.cpm || 0)}</td><td style={S.td}>{fmtDec(r.spend || 0)}</td><td style={S.td}>{r.viewability > 0 ? r.viewability + "%" : "\u2014"}</td><td style={S.td}>{r.vcr > 0 ? r.vcr + "%" : "\u2014"}</td><td style={S.td}>{r.ltr > 0 ? r.ltr + "%" : "\u2014"}</td><td style={S.td}>{r.conversions || 0}</td></tr>))}</tbody></table>
          {filteredData.length > 150 && <p style={{ padding: 12, color: NURU.textMuted, fontSize: 11, textAlign: "center" }}>150 premieres lignes sur {filteredData.length.toLocaleString("fr-FR")}</p>}
        </div>)}

        {/* ======= TABLE (campaign) ======= */}
        {activeTab === "table" && dataMode === "campaign" && (<>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[{ key: "campaigns", label: "Campagnes" }, { key: "domains", label: "Domaines" }, { key: "creatives", label: "Creatifs" }].map(t => (<button key={t.key} style={S.formatTab(dataSubTab === t.key)} onClick={() => setDataSubTab(t.key)}>{t.label}</button>))}
          </div>
          {dataSubTab === "campaigns" && (<div style={{ ...S.card, overflowX: "auto" }}><div style={S.cardTitle}>Donnees campagnes ({filteredCampaignData.length} lignes)</div>
            <table style={S.table}><thead><tr>{["Campagne", "Cible", "Canal", "Budget", "Depenses", "Pacing", "Impressions", "Clics", "CTR", "CPM", "CPC", "Viewability", "Reach", "Frequence"].map(h => thInfo(h))}</tr></thead>
            <tbody>{filteredCampaignData.map((r, i) => (<tr key={i} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={{ ...S.td, fontSize: 10, fontWeight: 600 }}>{r.campaignName}</td><td style={{ ...S.td, fontSize: 10 }}>{r.persona}</td><td style={S.td}><span style={S.badge}>{r.channelType}</span></td><td style={S.td}>{fmtCur(r.lifetimeBudget)}</td><td style={S.td}>{fmtCurDec(r.mediaCost)}</td><td style={S.td}>{r.overallPacing}</td><td style={S.td}>{fmtNum(r.impressions)}</td><td style={S.td}>{fmtNum(r.clicks)}</td><td style={S.td}>{fmtPct(r.ctr)}</td><td style={S.td}>{fmtCurDec(r.eCPM)}</td><td style={S.td}>{fmtCurDec(r.eCPC)}</td><td style={S.td}>{fmtPct(r.viewPct)}</td><td style={S.td}>{fmtNum(r.uniqueImpressions)}</td><td style={S.td}>{fmtDec(r.frequency)}</td></tr>))}</tbody></table>
          </div>)}
          {dataSubTab === "domains" && (<div style={{ ...S.card, overflowX: "auto" }}><div style={S.cardTitle}>Donnees domaines ({filteredDomainData.length} lignes)</div>
            <table style={S.table}><thead><tr>{["Domaine", "Campagne", "Canal", "Impressions", "Clics", "CTR", "Depenses", "CPM", "CPC"].map(h => thInfo(h))}</tr></thead>
            <tbody>{filteredDomainData.slice(0, 200).map((r, i) => (<tr key={i} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={{ ...S.td, fontWeight: 600, fontSize: 10 }}>{r.domain}</td><td style={{ ...S.td, fontSize: 10 }}>{r.persona}</td><td style={S.td}><span style={S.badge}>{r.channelType}</span></td><td style={S.td}>{fmtNum(r.impressions)}</td><td style={S.td}>{fmtNum(r.clicks)}</td><td style={S.td}>{fmtPct(r.ctr)}</td><td style={S.td}>{fmtCurDec(r.mediaCost)}</td><td style={S.td}>{fmtCurDec(r.eCPM)}</td><td style={S.td}>{r.eCPC > 0 ? fmtCurDec(r.eCPC) : "\u2014"}</td></tr>))}</tbody></table>
            {filteredDomainData.length > 200 && <p style={{ padding: 12, color: NURU.textMuted, fontSize: 11, textAlign: "center" }}>200 premieres lignes sur {filteredDomainData.length}</p>}
          </div>)}
          {dataSubTab === "creatives" && (<div style={{ ...S.card, overflowX: "auto" }}><div style={S.cardTitle}>Donnees creatifs ({filteredCreativeData.length} lignes)</div>
            <table style={S.table}><thead><tr>{["Creatif", "Taille", "Campagne", "Canal", "Impressions", "Clics", "CTR", "Depenses", "CPM", "CPC"].map(h => thInfo(h))}</tr></thead>
            <tbody>{filteredCreativeData.map((r, i) => (<tr key={i} style={{ background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent" }}><td style={{ ...S.td, fontWeight: 600, fontSize: 10 }}>{r.creativeName}</td><td style={S.td}>{r.creativeSize}</td><td style={{ ...S.td, fontSize: 10 }}>{r.persona}</td><td style={S.td}><span style={S.badge}>{r.channelType}</span></td><td style={S.td}>{fmtNum(r.impressions)}</td><td style={S.td}>{fmtNum(r.clicks)}</td><td style={S.td}>{fmtPct(r.ctr)}</td><td style={S.td}>{fmtCurDec(r.mediaCost)}</td><td style={S.td}>{fmtCurDec(r.eCPM)}</td><td style={S.td}>{r.eCPC > 0 ? fmtCurDec(r.eCPC) : "\u2014"}</td></tr>))}</tbody></table>
          </div>)}
        </>)}

        <div style={{ textAlign: "center", padding: "24px 0 10px", color: NURU.textDark, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em" }}>NURU — Dashboard Programmatique Multi-Canal — {new Date().getFullYear()}</div>
      </main>
    </div>
  );
}
