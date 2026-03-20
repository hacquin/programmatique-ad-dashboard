import { useState, useMemo, useCallback, useRef } from "react";
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
// Palette radar : couleurs vives et tres contrastees pour distinguer les 6 canaux
const RADAR_PALETTE = ["#f5d742", "#ef4444", "#38bdf8", "#4ade80", "#c084fc", "#fb923c"];
const CHART_GOLD = NURU.gold;
const CHART_GOLD_FILL = "rgba(196,169,98,0.2)";

// =====================================================================
// FORMAT TAXONOMY
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

// Creative axes — cross-format concepts (5 max)
const CREATIVE_AXES = ["Axe creatif 1", "Axe creatif 2", "Axe creatif 3", "Axe creatif 4", "Axe creatif 5"];
const SITES = ["LeMonde.fr","LeFigaro.fr","20Minutes.fr","BFM.fr","LEquipe.fr","Marmiton.fr","Allocine.fr","Spotify","Deezer","YouTube","TF1+","France.tv","Molotov","Twitch","Roblox"];

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
// DATA GENERATOR
// =====================================================================
function generateDemoData() {
  const rows = [];
  const now = new Date(2026, 2, 20);
  const rnd = (min, max) => min + Math.random() * (max - min);

  for (let d = 0; d < 90; d++) {
    const date = new Date(now); date.setDate(date.getDate() - (89 - d));
    const dateStr = date.toISOString().slice(0, 10);

    ALL_FORMATS.forEach((format) => {
      const cfg = FORMAT_CONFIG[format];
      const activeSubs = cfg.subFormats.filter(() => Math.random() > 0.3);
      if (activeSubs.length === 0) activeSubs.push(cfg.subFormats[0]);
      // Assign creative axis only for Display, Video, Audio, In-Game
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
          else sitesPool = ["LeMonde.fr", "LeFigaro.fr", "20Minutes.fr", "BFM.fr", "LEquipe.fr", "Marmiton.fr", "Allocine.fr"];
          const site = sitesPool[Math.floor(Math.random() * sitesPool.length)];

          let impressions, clicks, cpm, viewability, vcr, ltr, views, listens, conversions, timeOnSite, viewTime, q25, q50, q75, q100;
          vcr = 0; ltr = 0; views = 0; listens = 0; conversions = 0; timeOnSite = 0; viewTime = 0; q25 = 0; q50 = 0; q75 = 0; q100 = 0;

          switch (format) {
            case "Display":
              impressions = Math.round(rnd(8000, 18000) * (isMobile ? 1.3 : 1));
              clicks = Math.round(impressions * rnd(0.08, 0.35) / 100);
              cpm = rnd(1.2, 4.5); viewability = rnd(48, 78);
              conversions = Math.round(clicks * rnd(0.015, 0.05)); break;
            case "Native":
              impressions = Math.round(rnd(5000, 14000) * (isMobile ? 1.4 : 1));
              clicks = Math.round(impressions * rnd(0.3, 1.2) / 100);
              cpm = rnd(3.0, 8.0); viewability = rnd(55, 85);
              conversions = Math.round(clicks * rnd(0.03, 0.08)); timeOnSite = rnd(25, 90); break;
            case "Video":
              impressions = Math.round(rnd(3000, 10000) * (isMobile ? 1.2 : 1));
              vcr = rnd(55, 92); views = Math.round(impressions * vcr / 100);
              clicks = Math.round(impressions * rnd(0.3, 1.5) / 100);
              cpm = rnd(8, 25); viewability = rnd(60, 90);
              conversions = Math.round(clicks * rnd(0.02, 0.06));
              q25 = rnd(85, 98); q50 = rnd(70, 90); q75 = rnd(58, 82); q100 = vcr; break;
            case "CTV":
              impressions = Math.round(rnd(2000, 8000));
              vcr = rnd(88, 99); views = Math.round(impressions * vcr / 100);
              clicks = 0; cpm = rnd(20, 45); viewability = rnd(90, 99);
              q25 = rnd(95, 99); q50 = rnd(92, 98); q75 = rnd(90, 96); q100 = vcr; break;
            case "Audio":
              impressions = Math.round(rnd(4000, 12000));
              ltr = rnd(85, 98); listens = Math.round(impressions * ltr / 100);
              clicks = Math.round(impressions * rnd(0.1, 0.5) / 100);
              cpm = rnd(10, 22); viewability = 0;
              conversions = Math.round(clicks * rnd(0.02, 0.05)); break;
            case "In-Game":
              impressions = Math.round(rnd(5000, 15000));
              clicks = 0; cpm = rnd(5, 15); viewability = rnd(70, 95); viewTime = rnd(2, 8); break;
          }
          const spend = +(impressions / 1000 * cpm).toFixed(2);
          rows.push({
            date: dateStr, format, subFormat: sub.name, subFormatSize: sub.size,
            creative: creativeAxis, device, site, impressions, clicks: clicks || 0,
            ctr: +(impressions > 0 ? ((clicks || 0) / impressions * 100) : 0).toFixed(3),
            cpm: +cpm.toFixed(2), cpc: clicks > 0 ? +(spend / clicks).toFixed(2) : 0, spend,
            viewability: +(viewability || 0).toFixed(1), conversions: conversions || 0,
            cpa: conversions > 0 ? +(spend / conversions).toFixed(2) : 0,
            vcr: +vcr.toFixed(1), views, cpv: views > 0 ? +(spend / views).toFixed(4) : 0,
            ltr: +ltr.toFixed(1), listens, cpl: listens > 0 ? +(spend / listens).toFixed(4) : 0,
            timeOnSite: +timeOnSite.toFixed(0), viewTime: +viewTime.toFixed(1),
            q25: +q25.toFixed(1), q50: +q50.toFixed(1), q75: +q75.toFixed(1), q100: +q100.toFixed(1),
          });
        });
      });
    });
  }
  return rows;
}

// =====================================================================
// UTILS
// =====================================================================
const fmtNum = (n) => { if (n >= 1e6) return (n/1e6).toFixed(1)+"M"; if (n >= 1e3) return (n/1e3).toFixed(1)+"K"; return typeof n==="number" ? n.toLocaleString("fr-FR") : n; };
const fmtCur = (n) => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
const fmtPct = (n) => (n||0).toFixed(2)+"%";
const fmtDec = (n) => (n||0).toFixed(2);

// Aggregation helpers
function getWeek(dateStr) { const d = new Date(dateStr); const jan1 = new Date(d.getFullYear(),0,1); const days = Math.floor((d-jan1)/86400000); return d.getFullYear()+"-S"+String(Math.ceil((days+jan1.getDay()+1)/7)).padStart(2,"0"); }
function getMonth(dateStr) { return dateStr.slice(0,7); }

// =====================================================================
// COMPONENT
// =====================================================================
// Multi-select dropdown component with checkboxes
function MultiSelect({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const allSelected = selected.length === 0;
  const displayLabel = allSelected ? label : selected.length === 1 ? selected[0] : `${selected.length} selectionnes`;

  // Close on outside click
  const handleClick = useCallback((e) => {
    if (ref.current && !ref.current.contains(e.target)) setOpen(false);
  }, []);
  useState(() => { document.addEventListener("mousedown", handleClick); return () => document.removeEventListener("mousedown", handleClick); });

  const toggle = (val) => {
    if (selected.includes(val)) onChange(selected.filter(v => v !== val));
    else onChange([...selected, val]);
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(!open)} style={{
        padding: "6px 10px", borderRadius: 6, border: `1px solid ${allSelected ? NURU.cardBorder : NURU.gold}`,
        background: allSelected ? NURU.card : NURU.goldMuted, color: allSelected ? NURU.text : NURU.gold,
        fontSize: 12, fontWeight: 500, cursor: "pointer", outline: "none", minWidth: 100, textAlign: "left",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6,
      }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayLabel}</span>
        <span style={{ fontSize: 8, opacity: 0.6 }}>{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 200, maxHeight: 260, overflowY: "auto",
          background: NURU.card, border: `1px solid ${NURU.cardBorder}`, borderRadius: 8, zIndex: 60,
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)", padding: "6px 0",
        }}>
          <div onClick={() => onChange([])} style={{
            padding: "7px 12px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: allSelected ? NURU.gold : NURU.textMuted,
            display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${NURU.cardBorder}`,
          }}>
            <span style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${allSelected ? NURU.gold : NURU.cardBorder}`,
              background: allSelected ? NURU.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, color: NURU.black }}>{allSelected ? "\u2713" : ""}</span>
            Tous
          </div>
          {options.map(opt => {
            const checked = selected.includes(opt);
            return (
              <div key={opt} onClick={() => toggle(opt)} style={{
                padding: "6px 12px", cursor: "pointer", fontSize: 11, color: checked ? NURU.gold : NURU.text,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${checked ? NURU.gold : NURU.cardBorder}`,
                  background: checked ? NURU.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: NURU.black, flexShrink: 0 }}>{checked ? "\u2713" : ""}</span>
                {opt}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProgrammaticDashboard() {
  const [rawData, setRawData] = useState(generateDemoData);
  const [dataSource, setDataSource] = useState("demo");
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [selectedSubFormats, setSelectedSubFormats] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [filterSite, setFilterSite] = useState("All");
  const [dateFrom, setDateFrom] = useState("2025-12-21");
  const [dateTo, setDateTo] = useState("2026-03-20");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedFormatTab, setSelectedFormatTab] = useState("Display");
  const [aggregation, setAggregation] = useState("day");
  const [showLexique, setShowLexique] = useState(false);
  const [lexiqueSearch, setLexiqueSearch] = useState("");
  const fileInputRef = useRef(null);

  const handleFileImport = useCallback((e) => {
    const file = e.target.files?.[0]; if (!file) return;
    Papa.parse(file, { header:true, dynamicTyping:true, skipEmptyLines:true,
      complete:(r) => { if(r.data.length>0){setRawData(r.data);setDataSource(file.name);} } });
  }, []);

  const uniqueFormats = useMemo(() => [...new Set(rawData.map(r=>r.format))], [rawData]);
  const uniqueSubFormats = useMemo(() => {
    const d = selectedFormats.length > 0 ? rawData.filter(r => selectedFormats.includes(r.format)) : rawData;
    return [...new Set(d.map(r=>r.subFormat).filter(Boolean))];
  }, [rawData, selectedFormats]);
  const uniqueDevices = useMemo(() => [...new Set(rawData.map(r=>r.device))], [rawData]);
  const uniqueSites = useMemo(() => [...new Set(rawData.map(r=>r.site))], [rawData]);

  const filteredData = useMemo(() => {
    let data = rawData;
    if (selectedFormats.length > 0) data = data.filter(r => selectedFormats.includes(r.format));
    if (selectedSubFormats.length > 0) data = data.filter(r => selectedSubFormats.includes(r.subFormat));
    if (selectedDevices.length > 0) data = data.filter(r => selectedDevices.includes(r.device));
    if (filterSite!=="All") data=data.filter(r=>r.site===filterSite);
    if (dateFrom && data[0]?.date) data=data.filter(r=>r.date>=dateFrom);
    if (dateTo && data[0]?.date) data=data.filter(r=>r.date<=dateTo);
    return data;
  }, [rawData, selectedFormats, selectedSubFormats, selectedDevices, filterSite, dateFrom, dateTo]);

  // KPIs
  const kpis = useMemo(() => {
    const d=filteredData, impressions=d.reduce((s,r)=>s+(r.impressions||0),0), clicks=d.reduce((s,r)=>s+(r.clicks||0),0),
      spend=d.reduce((s,r)=>s+(r.spend||0),0), conversions=d.reduce((s,r)=>s+(r.conversions||0),0),
      views=d.reduce((s,r)=>s+(r.views||0),0), listens=d.reduce((s,r)=>s+(r.listens||0),0);
    const vwA=d.filter(r=>r.viewability>0), viewability=vwA.length?vwA.reduce((s,r)=>s+r.viewability,0)/vwA.length:0;
    const vcA=d.filter(r=>r.vcr>0), vcr=vcA.length?vcA.reduce((s,r)=>s+r.vcr,0)/vcA.length:0;
    const ltA=d.filter(r=>r.ltr>0), ltr=ltA.length?ltA.reduce((s,r)=>s+r.ltr,0)/ltA.length:0;
    return { impressions, clicks, spend, conversions, views, listens,
      ctr:impressions>0?(clicks/impressions)*100:0, cpm:impressions>0?spend/(impressions/1000):0,
      cpc:clicks>0?spend/clicks:0, cpa:conversions>0?spend/conversions:0, viewability, vcr, ltr };
  }, [filteredData]);

  // Time Series with aggregation
  const timeSeries = useMemo(() => {
    const map = {};
    filteredData.forEach((r) => {
      if (!r.date) return;
      const key = aggregation==="week" ? getWeek(r.date) : aggregation==="month" ? getMonth(r.date) : r.date;
      if (!map[key]) map[key]={key, impressions:0, clicks:0, spend:0, conversions:0, views:0};
      const m=map[key]; m.impressions+=r.impressions||0; m.clicks+=r.clicks||0; m.spend+=r.spend||0; m.conversions+=r.conversions||0; m.views+=r.views||0;
    });
    return Object.values(map).sort((a,b)=>a.key.localeCompare(b.key)).map(d=>({
      ...d, ctr:d.impressions>0?+((d.clicks/d.impressions)*100).toFixed(3):0,
      cpm:d.impressions>0?+(d.spend/(d.impressions/1000)).toFixed(2):0,
      label: aggregation==="day" ? d.key.slice(5) : d.key,
    }));
  }, [filteredData, aggregation]);

  // Format Breakdown
  const formatBreakdown = useMemo(() => {
    const map={};
    filteredData.forEach(r=>{
      const f=r.format||"Autre";
      if(!map[f]) map[f]={format:f,impressions:0,clicks:0,spend:0,conversions:0,views:0,listens:0,vcrS:0,vcrN:0,ltrS:0,ltrN:0,vwS:0,vwN:0};
      const m=map[f]; m.impressions+=r.impressions||0; m.clicks+=r.clicks||0; m.spend+=r.spend||0; m.conversions+=r.conversions||0;
      m.views+=r.views||0; m.listens+=r.listens||0;
      if(r.vcr>0){m.vcrS+=r.vcr;m.vcrN++;} if(r.ltr>0){m.ltrS+=r.ltr;m.ltrN++;} if(r.viewability>0){m.vwS+=r.viewability;m.vwN++;}
    });
    return Object.values(map).map(d=>({...d,
      ctr:d.impressions>0?+((d.clicks/d.impressions)*100).toFixed(2):0,
      cpm:d.impressions>0?+(d.spend/(d.impressions/1000)).toFixed(2):0,
      cpc:d.clicks>0?+(d.spend/d.clicks).toFixed(2):0,
      vcr:d.vcrN?+(d.vcrS/d.vcrN).toFixed(1):0, ltr:d.ltrN?+(d.ltrS/d.ltrN).toFixed(1):0,
      viewability:d.vwN?+(d.vwS/d.vwN).toFixed(1):0,
    })).sort((a,b)=>b.spend-a.spend);
  }, [filteredData]);

  // Sub-Format Breakdown
  const subFormatBreakdown = useMemo(() => {
    const cd=filteredData.filter(r=>r.format===selectedFormatTab), map={};
    cd.forEach(r=>{
      const sf=r.subFormat||"Autre";
      if(!map[sf]) map[sf]={subFormat:sf,impressions:0,clicks:0,spend:0,conversions:0,views:0,vcrS:0,vcrN:0,ltrS:0,ltrN:0,vwS:0,vwN:0};
      const m=map[sf]; m.impressions+=r.impressions||0; m.clicks+=r.clicks||0; m.spend+=r.spend||0; m.conversions+=r.conversions||0; m.views+=r.views||0;
      if(r.vcr>0){m.vcrS+=r.vcr;m.vcrN++;} if(r.ltr>0){m.ltrS+=r.ltr;m.ltrN++;} if(r.viewability>0){m.vwS+=r.viewability;m.vwN++;}
    });
    return Object.values(map).map(d=>({...d,
      ctr:d.impressions>0?+((d.clicks/d.impressions)*100).toFixed(2):0,
      cpm:d.impressions>0?+(d.spend/(d.impressions/1000)).toFixed(2):0,
      vcr:d.vcrN?+(d.vcrS/d.vcrN).toFixed(1):0, ltr:d.ltrN?+(d.ltrS/d.ltrN).toFixed(1):0,
      viewability:d.vwN?+(d.vwS/d.vwN).toFixed(1):0,
    })).sort((a,b)=>b.impressions-a.impressions);
  }, [filteredData, selectedFormatTab]);

  // Creative axis analysis (Display, Video, Audio, In-Game only)
  const creativeData = useMemo(() => {
    const cd = filteredData.filter(r => ["Display","Video","Audio","In-Game"].includes(r.format) && r.creative);
    const map = {};
    cd.forEach(r => {
      const c = r.creative;
      if (!map[c]) map[c] = { creative: c, impressions: 0, clicks: 0, spend: 0, conversions: 0, views: 0, formats: new Set(), vcrS: 0, vcrN: 0, vwS: 0, vwN: 0 };
      const m = map[c]; m.impressions += r.impressions||0; m.clicks += r.clicks||0; m.spend += r.spend||0; m.conversions += r.conversions||0; m.views += r.views||0; m.formats.add(r.format);
      if (r.vcr>0) { m.vcrS+=r.vcr; m.vcrN++; } if (r.viewability>0) { m.vwS+=r.viewability; m.vwN++; }
    });
    return Object.values(map).map(d => ({
      ...d, formats: [...d.formats].join(", "),
      ctr: d.impressions>0 ? +((d.clicks/d.impressions)*100).toFixed(2) : 0,
      cpm: d.impressions>0 ? +(d.spend/(d.impressions/1000)).toFixed(2) : 0,
      cpc: d.clicks>0 ? +(d.spend/d.clicks).toFixed(2) : 0,
      vcr: d.vcrN ? +(d.vcrS/d.vcrN).toFixed(1) : 0,
      viewability: d.vwN ? +(d.vwS/d.vwN).toFixed(1) : 0,
    })).sort((a,b) => b.spend - a.spend);
  }, [filteredData]);

  // Spend by format aggregated
  const spendByFormat = useMemo(() => {
    const map = {};
    filteredData.forEach(r => {
      if(!r.date) return;
      const key = aggregation==="week"?getWeek(r.date):aggregation==="month"?getMonth(r.date):r.date;
      if(!map[key]){const e={key, label: aggregation==="day"?key.slice(5):key}; ALL_FORMATS.forEach(f=>{e[f]=0;}); map[key]=e;}
      map[key][r.format]=(map[key][r.format]||0)+(r.spend||0);
    });
    return Object.values(map).sort((a,b)=>a.key.localeCompare(b.key));
  }, [filteredData, aggregation]);

  // Radar
  const radarData = useMemo(() => {
    if (!formatBreakdown.length) return [];
    const metrics=[{key:"conversions",label:"Conversions"},{key:"ctr",label:"CTR"},{key:"viewability",label:"Viewability"},{key:"impressions",label:"Volume"},{key:"cpm",label:"CPM (inv.)",invert:true}];
    const maxes={}; metrics.forEach(m=>{maxes[m.key]=Math.max(...formatBreakdown.map(f=>f[m.key]||0),1);});
    return metrics.map(m=>{const e={metric:m.label}; formatBreakdown.forEach(f=>{let v=(f[m.key]||0)/maxes[m.key]*100; if(m.invert)v=100-v; e[f.format]=+v.toFixed(1);}); return e;});
  }, [formatBreakdown]);

  // Device
  const deviceBreakdown = useMemo(() => {
    const map={}; filteredData.forEach(r=>{const d=r.device||"Autre"; if(!map[d])map[d]={name:d,value:0}; map[d].value+=r.impressions||0;}); return Object.values(map);
  }, [filteredData]);

  // Site
  const sitePerformance = useMemo(() => {
    const map={}; filteredData.forEach(r=>{const s=r.site||"Autre"; if(!map[s])map[s]={site:s,impressions:0,clicks:0,spend:0,conversions:0}; const m=map[s]; m.impressions+=r.impressions||0; m.clicks+=r.clicks||0; m.spend+=r.spend||0; m.conversions+=r.conversions||0;});
    return Object.values(map).map(d=>({...d, ctr:d.impressions>0?+((d.clicks/d.impressions)*100).toFixed(2):0, cpm:d.impressions>0?+(d.spend/(d.impressions/1000)).toFixed(2):0, cpa:d.conversions>0?+(d.spend/d.conversions).toFixed(2):0})).sort((a,b)=>b.spend-a.spend);
  }, [filteredData]);

  // Quartiles
  const quartileData = useMemo(() => {
    const vd=filteredData.filter(r=>r.format===selectedFormatTab&&r.q25>0); if(!vd.length) return null;
    const avg=(k)=>+(vd.reduce((s,r)=>s+(r[k]||0),0)/vd.length).toFixed(1);
    return [{quartile:"Q1 (25%)",value:avg("q25")},{quartile:"Q2 (50%)",value:avg("q50")},{quartile:"Q3 (75%)",value:avg("q75")},{quartile:"Q4 (100%)",value:avg("q100")}];
  }, [filteredData, selectedFormatTab]);

  // ROI per format
  const roiData = useMemo(() => formatBreakdown.map(f => ({
    format: f.format, cpm: +f.cpm, ctr: +f.ctr, cpc: +f.cpc, spend: f.spend,
    costEfficiency: f.impressions > 0 ? +(f.spend / f.impressions * 10000).toFixed(2) : 0,
    convRate: f.clicks > 0 ? +((f.conversions / f.clicks) * 100).toFixed(2) : 0,
    cpa: f.conversions > 0 ? +(f.spend / f.conversions).toFixed(2) : 0,
  })), [formatBreakdown]);

  // ROI time series
  const roiTimeSeries = useMemo(() => timeSeries.map(d => ({
    ...d, cpmTrend: d.cpm, ctrTrend: d.ctr, spendTrend: +(d.spend).toFixed(0),
  })), [timeSeries]);

  // Visibility per format
  const visibilityData = useMemo(() => formatBreakdown.map(f => ({
    format: f.format, impressions: f.impressions, viewability: +f.viewability, vcr: +f.vcr, ltr: +f.ltr,
    visibleImpressions: Math.round(f.impressions * (+f.viewability || 0) / 100),
  })), [formatBreakdown]);

  // Channel KPIs
  const getChannelKpis = (fmt) => {
    const d=filteredData.filter(r=>r.format===fmt);
    const imp=d.reduce((s,r)=>s+(r.impressions||0),0), cl=d.reduce((s,r)=>s+(r.clicks||0),0),
      sp=d.reduce((s,r)=>s+(r.spend||0),0), conv=d.reduce((s,r)=>s+(r.conversions||0),0),
      vw=d.reduce((s,r)=>s+(r.views||0),0), li=d.reduce((s,r)=>s+(r.listens||0),0);
    const vwA=d.filter(r=>r.viewability>0), viewab=vwA.length?vwA.reduce((s,r)=>s+r.viewability,0)/vwA.length:0;
    const vcA=d.filter(r=>r.vcr>0), vcr=vcA.length?vcA.reduce((s,r)=>s+r.vcr,0)/vcA.length:0;
    const ltA=d.filter(r=>r.ltr>0), ltr=ltA.length?ltA.reduce((s,r)=>s+r.ltr,0)/ltA.length:0;
    const base=[{label:"Impressions",value:fmtNum(imp)},{label:"Depenses",value:fmtCur(sp)},{label:"CPM",value:fmtDec(imp>0?sp/(imp/1000):0)+" EUR"}];
    switch(fmt){
      case "Display": return [...base,{label:"Clics",value:fmtNum(cl)},{label:"CTR",value:fmtPct(imp>0?(cl/imp)*100:0)},{label:"CPC",value:fmtDec(cl>0?sp/cl:0)+" EUR"},{label:"Viewability",value:fmtPct(viewab)},{label:"Conversions",value:fmtNum(conv)}];
      case "Native": return [...base,{label:"Clics",value:fmtNum(cl)},{label:"CTR",value:fmtPct(imp>0?(cl/imp)*100:0)},{label:"Viewability",value:fmtPct(viewab)},{label:"Conversions",value:fmtNum(conv)}];
      case "Video": return [...base,{label:"Vues completes",value:fmtNum(vw)},{label:"VCR",value:fmtPct(vcr)},{label:"CPV",value:(vw>0?(sp/vw).toFixed(4):"0")+" EUR"},{label:"Viewability",value:fmtPct(viewab)},{label:"Conversions",value:fmtNum(conv)}];
      case "CTV": return [...base,{label:"Vues completes",value:fmtNum(vw)},{label:"VCR",value:fmtPct(vcr)},{label:"Viewability",value:fmtPct(viewab)}];
      case "Audio": return [...base,{label:"Ecoutes compl.",value:fmtNum(li)},{label:"LTR",value:fmtPct(ltr)},{label:"Clics",value:fmtNum(cl)}];
      case "In-Game": return [...base,{label:"Viewability",value:fmtPct(viewab)}];
      default: return base;
    }
  };

  // ===== STYLES =====
  const S = {
    container:{minHeight:"100vh",background:NURU.bgGrad,color:NURU.text,fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"},
    header:{padding:"16px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${NURU.cardBorder}`,background:"rgba(13,11,8,0.92)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:50,flexWrap:"wrap",gap:10},
    logoWrap:{display:"flex",alignItems:"center",gap:14},
    logoText:{fontSize:26,fontWeight:800,letterSpacing:"0.08em",color:NURU.gold,textTransform:"uppercase"},
    logoSub:{fontSize:9,color:NURU.textMuted,letterSpacing:"0.14em",textTransform:"uppercase",marginTop:1},
    content:{padding:"20px 32px"},
    filters:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16,alignItems:"center"},
    dateLabel:{fontSize:10,color:NURU.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"},
    dateInput:{padding:"6px 10px",borderRadius:6,border:`1px solid ${NURU.cardBorder}`,background:NURU.card,color:NURU.text,fontSize:12,outline:"none"},
    select:{padding:"6px 10px",borderRadius:6,border:`1px solid ${NURU.cardBorder}`,background:NURU.card,color:NURU.text,fontSize:12,fontWeight:500,cursor:"pointer",outline:"none"},
    tabs:{display:"flex",gap:0,marginBottom:20,borderBottom:`1px solid ${NURU.cardBorder}`,flexWrap:"wrap"},
    tab:(a)=>({padding:"9px 16px",border:"none",borderBottom:a?`2px solid ${NURU.gold}`:"2px solid transparent",background:"transparent",color:a?NURU.gold:NURU.textMuted,fontWeight:600,fontSize:11,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.04em",transition:"all 0.15s"}),
    formatTab:(a)=>({padding:"7px 14px",borderRadius:6,border:a?`1px solid ${NURU.gold}`:`1px solid ${NURU.cardBorder}`,background:a?NURU.goldMuted:"transparent",color:a?NURU.gold:NURU.textMuted,fontWeight:600,fontSize:11,cursor:"pointer"}),
    grid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(340px, 1fr))",gap:14,marginBottom:20},
    card:{background:NURU.card,borderRadius:10,padding:"18px",border:`1px solid ${NURU.cardBorder}`},
    cardFull:{gridColumn:"1 / -1"},
    cardTitle:{fontSize:12,fontWeight:700,marginBottom:14,color:NURU.text,textTransform:"uppercase",letterSpacing:"0.04em"},
    kpiRow:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))",gap:12,marginBottom:20},
    kpiCard:{background:NURU.card,borderRadius:8,padding:"12px 14px",border:`1px solid ${NURU.cardBorder}`,borderLeft:`3px solid ${NURU.gold}`},
    kpiLabel:{fontSize:9,fontWeight:700,color:NURU.textMuted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5},
    kpiValue:{fontSize:20,fontWeight:800,color:NURU.gold,letterSpacing:"-0.02em"},
    badge:{display:"inline-block",padding:"3px 8px",borderRadius:5,fontSize:10,fontWeight:700,background:NURU.goldMuted,color:NURU.gold,textTransform:"uppercase"},
    btn:{padding:"6px 12px",borderRadius:6,border:`1px solid ${NURU.cardBorder}`,background:NURU.card,color:NURU.text,fontSize:11,fontWeight:600,cursor:"pointer"},
    table:{width:"100%",borderCollapse:"separate",borderSpacing:0,fontSize:11},
    th:{textAlign:"left",padding:"8px 12px",borderBottom:`1px solid ${NURU.cardBorder}`,fontWeight:700,color:NURU.textMuted,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em"},
    td:{padding:"8px 12px",borderBottom:`1px solid ${NURU.cardBorder}`,fontVariantNumeric:"tabular-nums",color:NURU.text},
    formatInfo:{background:NURU.goldMuted,border:`1px solid ${NURU.goldDark}33`,borderRadius:8,padding:"14px 18px",marginBottom:16},
    lexiqueOverlay:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"},
    lexiquePanel:{background:NURU.card,border:`1px solid ${NURU.cardBorder}`,borderRadius:12,padding:"28px 32px",maxWidth:640,width:"90%",maxHeight:"80vh",overflowY:"auto",color:NURU.text},
  };

  const tooltipStyle={background:NURU.card,border:`1px solid ${NURU.cardBorder}`,borderRadius:8,padding:"8px 12px",boxShadow:"0 8px 24px rgba(0,0,0,0.5)"};
  const CT=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div style={tooltipStyle}><p style={{fontWeight:700,fontSize:11,marginBottom:3,color:NURU.text}}>{label}</p>{payload.map((p,i)=>(<p key={i} style={{fontSize:10,color:p.color||NURU.gold,margin:"1px 0"}}>{p.name}: <strong>{typeof p.value==="number"?p.value.toLocaleString("fr-FR"):p.value}</strong></p>))}</div>);};

  const hasFilters=selectedFormats.length>0||selectedSubFormats.length>0||selectedDevices.length>0||filterSite!=="All";

  const globalKpis=[
    {label:"Impressions",value:fmtNum(kpis.impressions)},{label:"Depenses",value:fmtCur(kpis.spend)},
    {label:"Clics",value:fmtNum(kpis.clicks)},{label:"CTR",value:fmtPct(kpis.ctr)},{label:"CPM moyen",value:fmtDec(kpis.cpm)+" EUR"},
    {label:"CPC moyen",value:fmtDec(kpis.cpc)+" EUR"},{label:"Viewability",value:fmtPct(kpis.viewability)},
    {label:"Conversions",value:fmtNum(kpis.conversions)},{label:"VCR (video)",value:fmtPct(kpis.vcr)},{label:"LTR (audio)",value:fmtPct(kpis.ltr)},
  ];

  const filteredLexique = LEXIQUE.filter(l => !lexiqueSearch || l.term.toLowerCase().includes(lexiqueSearch.toLowerCase()) || l.def.toLowerCase().includes(lexiqueSearch.toLowerCase()));

  return (
    <div style={S.container}>
      {/* LEXIQUE MODAL */}
      {showLexique && (
        <div style={S.lexiqueOverlay} onClick={() => setShowLexique(false)}>
          <div style={S.lexiquePanel} onClick={e => e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontSize:18,fontWeight:800,color:NURU.gold,textTransform:"uppercase",letterSpacing:"0.06em"}}>Lexique Programmatique</div>
              <button style={{...S.btn,color:NURU.red,borderColor:NURU.red}} onClick={()=>setShowLexique(false)}>Fermer</button>
            </div>
            <input type="text" placeholder="Rechercher un terme..." value={lexiqueSearch} onChange={e=>setLexiqueSearch(e.target.value)}
              style={{...S.dateInput,width:"100%",marginBottom:16,padding:"10px 14px",fontSize:13}} />
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {filteredLexique.map(l => (
                <div key={l.term} style={{borderBottom:`1px solid ${NURU.cardBorder}`,paddingBottom:10}}>
                  <div style={{fontWeight:700,color:NURU.gold,fontSize:13,marginBottom:3}}>{l.term}</div>
                  <div style={{fontSize:12,color:NURU.textMuted,lineHeight:1.5}}>{l.def}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header style={S.header}>
        <div style={S.logoWrap}>
          <a href="https://nuru.agency" target="_blank" rel="noopener noreferrer"><img src={logoNuru} alt="NURU" style={{height:53}} /></a>
          <div style={{width:1,height:32,background:NURU.cardBorder,margin:"0 8px"}} />
          <div>
            <div style={{fontSize:14,fontWeight:700,color:NURU.text}}>Dashboard Programmatique</div>
            <div style={{fontSize:10,color:NURU.textMuted}}>{dataSource==="demo"?"Donnees de demonstration":dataSource} — {filteredData.length.toLocaleString("fr-FR")} lignes</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <input type="file" accept=".csv,.tsv" ref={fileInputRef} style={{display:"none"}} onChange={handleFileImport} />
          <button style={S.btn} onClick={()=>fileInputRef.current?.click()}>Importer CSV</button>
          <button style={S.btn} onClick={()=>{setRawData(generateDemoData());setDataSource("demo");}}>Demo</button>
          <button style={{...S.btn,borderColor:NURU.gold,color:NURU.gold}} onClick={()=>setShowLexique(true)}>Lexique</button>
        </div>
      </header>

      <main style={S.content}>
        {/* FILTERS */}
        <div style={S.filters}>
          <span style={S.dateLabel}>Du</span>
          <input type="date" style={S.dateInput} value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
          <span style={S.dateLabel}>Au</span>
          <input type="date" style={S.dateInput} value={dateTo} onChange={e=>setDateTo(e.target.value)} />
          <div style={{width:1,height:24,background:NURU.cardBorder}} />
          <select style={S.select} value={aggregation} onChange={e=>setAggregation(e.target.value)}>
            <option value="day">Par jour</option><option value="week">Par semaine</option><option value="month">Par mois</option>
          </select>
          <div style={{width:1,height:24,background:NURU.cardBorder}} />
          <MultiSelect label="Tous les canaux" options={uniqueFormats} selected={selectedFormats} onChange={(v)=>{setSelectedFormats(v);setSelectedSubFormats([]);}} />
          {uniqueSubFormats.length>0&&<MultiSelect label="Tous sous-formats" options={uniqueSubFormats} selected={selectedSubFormats} onChange={setSelectedSubFormats} />}
          <MultiSelect label="Tous devices" options={uniqueDevices} selected={selectedDevices} onChange={setSelectedDevices} />
          <select style={S.select} value={filterSite} onChange={e=>setFilterSite(e.target.value)}>
            <option value="All">Tous sites</option>{uniqueSites.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          {hasFilters&&<button style={{...S.btn,color:NURU.red,borderColor:NURU.red}} onClick={()=>{setSelectedFormats([]);setSelectedSubFormats([]);setSelectedDevices([]);setFilterSite("All");}}>Reinitialiser</button>}
        </div>

        {/* TABS */}
        <div style={S.tabs}>
          {[{key:"overview",label:"Vue d'ensemble"},{key:"formats",label:"Par format"},{key:"creatives",label:"Par axe creatif"},{key:"roi",label:"Analyse ROI"},{key:"visibility",label:"Visibilite"},{key:"sites",label:"Sites"},{key:"table",label:"Donnees"}].map(t=>(
            <button key={t.key} style={S.tab(activeTab===t.key)} onClick={()=>setActiveTab(t.key)}>{t.label}</button>
          ))}
        </div>

        {/* ======= OVERVIEW ======= */}
        {activeTab==="overview"&&(<>
          <div style={S.kpiRow}>{globalKpis.slice(0,5).map(k=>(<div key={k.label} style={S.kpiCard}><div style={S.kpiLabel}>{k.label}</div><div style={S.kpiValue}>{k.value}</div></div>))}</div>
          <div style={S.kpiRow}>{globalKpis.slice(5).map(k=>(<div key={k.label} style={S.kpiCard}><div style={S.kpiLabel}>{k.label}</div><div style={S.kpiValue}>{k.value}</div></div>))}</div>
          <div style={S.grid}>
            <div style={{...S.card,...S.cardFull}}><div style={S.cardTitle}>Impressions et clics ({aggregation==="day"?"jour":aggregation==="week"?"semaine":"mois"})</div>
              <ResponsiveContainer width="100%" height={280}><ComposedChart data={timeSeries}><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis dataKey="label" stroke={NURU.textMuted} fontSize={10} tickLine={false}/><YAxis yAxisId="l" stroke={NURU.textMuted} fontSize={10} tickFormatter={fmtNum}/><YAxis yAxisId="r" orientation="right" stroke={NURU.textMuted} fontSize={10}/><Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:10}}/><Area yAxisId="l" type="monotone" dataKey="impressions" name="Impressions" fill={CHART_GOLD_FILL} stroke={CHART_GOLD} strokeWidth={2}/><Line yAxisId="r" type="monotone" dataKey="clicks" name="Clics" stroke={NURU.goldLight} strokeWidth={2} dot={false} strokeDasharray="4 2"/></ComposedChart></ResponsiveContainer>
            </div>

            <div style={{...S.card,...S.cardFull}}><div style={S.cardTitle}>Depenses par canal ({aggregation==="day"?"jour":aggregation==="week"?"semaine":"mois"})</div>
              <ResponsiveContainer width="100%" height={280}><BarChart data={spendByFormat}><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis dataKey="label" stroke={NURU.textMuted} fontSize={10} tickLine={false}/><YAxis stroke={NURU.textMuted} fontSize={10}/><Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:10}}/>
                {ALL_FORMATS.filter(f=>formatBreakdown.find(fb=>fb.format===f)).map((f,i)=>(<Bar key={f} dataKey={f} name={f} stackId="a" fill={PIE_PALETTE[i%PIE_PALETTE.length]} radius={i===ALL_FORMATS.length-1?[3,3,0,0]:[0,0,0,0]}/>))}
              </BarChart></ResponsiveContainer>
            </div>

            <div style={S.card}><div style={S.cardTitle}>Repartition budget par canal</div>
              <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={formatBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="spend" nameKey="format" label={({format,percent})=>`${format} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{formatBreakdown.map((_,i)=><Cell key={i} fill={PIE_PALETTE[i%PIE_PALETTE.length]}/>)}</Pie><Tooltip content={<CT/>}/></PieChart></ResponsiveContainer>
            </div>

            <div style={S.card}><div style={S.cardTitle}>Repartition devices</div>
              <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={deviceBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value" nameKey="name" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{deviceBreakdown.map((_,i)=><Cell key={i} fill={PIE_PALETTE[i%PIE_PALETTE.length]}/>)}</Pie><Tooltip content={<CT/>}/></PieChart></ResponsiveContainer>
            </div>

            <div style={{...S.card,...S.cardFull}}><div style={S.cardTitle}>Performance comparee par canal (radar)</div>
              <ResponsiveContainer width="100%" height={700}><RadarChart data={radarData} cx="50%" cy="50%" outerRadius={260}><PolarGrid stroke={NURU.cardBorder}/><PolarAngleAxis dataKey="metric" stroke={NURU.textMuted} fontSize={12}/><PolarRadiusAxis stroke={NURU.cardBorder} fontSize={9}/>
                {formatBreakdown.map((f,i)=>(<Radar key={f.format} name={f.format} dataKey={f.format} stroke={RADAR_PALETTE[i%RADAR_PALETTE.length]} fill={RADAR_PALETTE[i%RADAR_PALETTE.length]+"30"} strokeWidth={3} dot={{r:4,fill:RADAR_PALETTE[i%RADAR_PALETTE.length]}}/>))}
                <Legend wrapperStyle={{fontSize:12,paddingTop:12}}/><Tooltip/></RadarChart></ResponsiveContainer>
            </div>

            <div style={{...S.card,...S.cardFull,overflowX:"auto"}}><div style={S.cardTitle}>Comparaison detaillee par canal</div>
              <table style={S.table}><thead><tr>{["Canal","Impressions","Depenses","CPM","Clics","CTR","CPC","Viewability","VCR","LTR","Conv."].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{formatBreakdown.map((f,i)=>(<tr key={f.format} style={{background:i%2?"rgba(255,255,255,0.015)":"transparent"}}><td style={S.td}><span style={S.badge}>{f.format}</span></td><td style={S.td}>{fmtNum(f.impressions)}</td><td style={S.td}>{fmtCur(f.spend)}</td><td style={S.td}>{f.cpm} EUR</td><td style={S.td}>{fmtNum(f.clicks)}</td><td style={S.td}>{f.ctr}%</td><td style={S.td}>{f.cpc} EUR</td><td style={S.td}>{f.viewability}%</td><td style={S.td}>{f.vcr>0?f.vcr+"%":"—"}</td><td style={S.td}>{f.ltr>0?f.ltr+"%":"—"}</td><td style={S.td}>{fmtNum(f.conversions)}</td></tr>))}</tbody></table>
            </div>
          </div>
        </>)}

        {/* ======= FORMATS ======= */}
        {activeTab==="formats"&&(<>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>{ALL_FORMATS.map(f=>(<button key={f} style={S.formatTab(selectedFormatTab===f)} onClick={()=>setSelectedFormatTab(f)}>{FORMAT_CONFIG[f].label}</button>))}</div>
          {FORMAT_CONFIG[selectedFormatTab]&&(<div style={S.formatInfo}><div style={{fontSize:15,fontWeight:800,color:NURU.gold,marginBottom:4}}>{FORMAT_CONFIG[selectedFormatTab].label}</div><div style={{fontSize:11,color:NURU.textMuted,marginBottom:8}}>{FORMAT_CONFIG[selectedFormatTab].description}</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{FORMAT_CONFIG[selectedFormatTab].subFormats.map(sf=>(<span key={sf.name} style={S.badge}>{sf.name} ({sf.size})</span>))}</div></div>)}
          <div style={S.kpiRow}>{getChannelKpis(selectedFormatTab).slice(0,5).map(k=>(<div key={k.label} style={S.kpiCard}><div style={S.kpiLabel}>{k.label}</div><div style={S.kpiValue}>{k.value}</div></div>))}</div>
          {getChannelKpis(selectedFormatTab).length>5&&<div style={S.kpiRow}>{getChannelKpis(selectedFormatTab).slice(5).map(k=>(<div key={k.label} style={S.kpiCard}><div style={S.kpiLabel}>{k.label}</div><div style={S.kpiValue}>{k.value}</div></div>))}</div>}
          <div style={S.grid}>
            <div style={S.card}><div style={S.cardTitle}>Impressions par sous-format</div><ResponsiveContainer width="100%" height={Math.max(160,subFormatBreakdown.length*40)}><BarChart data={subFormatBreakdown} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis type="number" stroke={NURU.textMuted} fontSize={10} tickFormatter={fmtNum}/><YAxis type="category" dataKey="subFormat" stroke={NURU.textMuted} fontSize={10} width={150}/><Tooltip content={<CT/>}/><Bar dataKey="impressions" name="Impressions" fill={CHART_GOLD} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
            <div style={S.card}><div style={S.cardTitle}>CPM par sous-format (EUR)</div><ResponsiveContainer width="100%" height={Math.max(160,subFormatBreakdown.length*40)}><BarChart data={subFormatBreakdown} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis type="number" stroke={NURU.textMuted} fontSize={10}/><YAxis type="category" dataKey="subFormat" stroke={NURU.textMuted} fontSize={10} width={150}/><Tooltip content={<CT/>}/><Bar dataKey="cpm" name="CPM EUR" fill={NURU.goldDark} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
            {quartileData&&<div style={S.card}><div style={S.cardTitle}>Completion par quartile (%)</div><ResponsiveContainer width="100%" height={220}><BarChart data={quartileData}><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis dataKey="quartile" stroke={NURU.textMuted} fontSize={10}/><YAxis stroke={NURU.textMuted} fontSize={10} domain={[0,100]}/><Tooltip content={<CT/>}/><Bar dataKey="value" name="Completion %" fill={CHART_GOLD} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>}
            <div style={S.card}><div style={S.cardTitle}>CTR par sous-format (%)</div><ResponsiveContainer width="100%" height={220}><BarChart data={subFormatBreakdown.filter(s=>s.ctr>0).sort((a,b)=>b.ctr-a.ctr)}><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis dataKey="subFormat" stroke={NURU.textMuted} fontSize={9} interval={0} angle={-20} textAnchor="end" height={50}/><YAxis stroke={NURU.textMuted} fontSize={10}/><Tooltip content={<CT/>}/><Bar dataKey="ctr" name="CTR %" fill={NURU.goldLight} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
            <div style={S.card}><div style={S.cardTitle}>Devices ({selectedFormatTab})</div><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={(()=>{const m={};filteredData.filter(r=>r.format===selectedFormatTab).forEach(r=>{if(!m[r.device])m[r.device]={name:r.device,value:0};m[r.device].value+=r.impressions||0;});return Object.values(m);})()}cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={4} dataKey="value" nameKey="name" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{PIE_PALETTE.map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip content={<CT/>}/></PieChart></ResponsiveContainer></div>
            <div style={{...S.card,...S.cardFull,overflowX:"auto"}}><div style={S.cardTitle}>Detail des sous-formats</div>
              <table style={S.table}><thead><tr><th style={S.th}>Sous-format</th><th style={S.th}>Impressions</th><th style={S.th}>Depenses</th><th style={S.th}>CPM</th>{["Display","Native","Video","Audio"].includes(selectedFormatTab)&&<><th style={S.th}>Clics</th><th style={S.th}>CTR</th></>}{["Video","CTV"].includes(selectedFormatTab)&&<th style={S.th}>VCR</th>}{selectedFormatTab==="Audio"&&<th style={S.th}>LTR</th>}<th style={S.th}>Viewability</th></tr></thead>
              <tbody>{subFormatBreakdown.map((sf,i)=>(<tr key={sf.subFormat} style={{background:i%2?"rgba(255,255,255,0.015)":"transparent"}}><td style={{...S.td,fontWeight:600}}>{sf.subFormat}</td><td style={S.td}>{fmtNum(sf.impressions)}</td><td style={S.td}>{fmtCur(sf.spend)}</td><td style={S.td}>{sf.cpm} EUR</td>{["Display","Native","Video","Audio"].includes(selectedFormatTab)&&<><td style={S.td}>{fmtNum(sf.clicks)}</td><td style={S.td}>{sf.ctr}%</td></>}{["Video","CTV"].includes(selectedFormatTab)&&<td style={S.td}>{sf.vcr>0?sf.vcr+"%":"—"}</td>}{selectedFormatTab==="Audio"&&<td style={S.td}>{sf.ltr>0?sf.ltr+"%":"—"}</td>}<td style={S.td}>{sf.viewability>0?sf.viewability+"%":"—"}</td></tr>))}</tbody></table>
            </div>
          </div>
        </>)}

        {/* ======= CREATIVES ======= */}
        {activeTab==="creatives"&&(<>
          <div style={{...S.formatInfo,marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:NURU.gold,marginBottom:4}}>Analyse par axe creatif</div><div style={{fontSize:11,color:NURU.textMuted}}>Un axe creatif represente un angle de communication (Axe creatif 1 a 5). Chaque axe peut se decliner en plusieurs formats : Display, Video, Audio et In-Game. Le Native et le CTV ne sont pas concernes car ils n'ont pas d'axe creatif attribue.</div></div>
          <div style={S.grid}>
            <div style={{...S.card,...S.cardFull}}><div style={S.cardTitle}>Depenses par axe creatif</div>
              <ResponsiveContainer width="100%" height={Math.max(200,creativeData.length*44)}><BarChart data={creativeData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis type="number" stroke={NURU.textMuted} fontSize={10}/><YAxis type="category" dataKey="creative" stroke={NURU.textMuted} fontSize={11} width={140}/><Tooltip content={<CT/>}/><Bar dataKey="spend" name="Depenses EUR" fill={CHART_GOLD} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>CTR par axe creatif (%)</div>
              <ResponsiveContainer width="100%" height={Math.max(200,creativeData.filter(c=>c.ctr>0).length*40)}><BarChart data={creativeData.filter(c=>c.ctr>0).sort((a,b)=>b.ctr-a.ctr)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis type="number" stroke={NURU.textMuted} fontSize={10}/><YAxis type="category" dataKey="creative" stroke={NURU.textMuted} fontSize={11} width={140}/><Tooltip content={<CT/>}/><Bar dataKey="ctr" name="CTR %" fill={NURU.goldDark} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>Repartition impressions</div>
              <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={creativeData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="impressions" nameKey="creative" label={({creative,percent})=>percent>0.05?`${creative} ${(percent*100).toFixed(0)}%`:""} labelLine={false} fontSize={10}>{creativeData.map((_,i)=><Cell key={i} fill={PIE_PALETTE[i%PIE_PALETTE.length]}/>)}</Pie><Tooltip content={<CT/>}/></PieChart></ResponsiveContainer>
            </div>
            <div style={{...S.card,...S.cardFull,overflowX:"auto"}}><div style={S.cardTitle}>Performance par axe creatif</div>
              <table style={S.table}><thead><tr>{["Axe creatif","Formats actifs","Impressions","Clics","CTR","Depenses","CPM","CPC","Viewability","VCR","Conv."].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{creativeData.map((c,i)=>(<tr key={c.creative} style={{background:i%2?"rgba(255,255,255,0.015)":"transparent"}}><td style={{...S.td,fontWeight:600}}>{c.creative}</td><td style={S.td}><span style={{fontSize:10,color:NURU.textMuted}}>{c.formats}</span></td><td style={S.td}>{fmtNum(c.impressions)}</td><td style={S.td}>{fmtNum(c.clicks)}</td><td style={S.td}>{c.ctr}%</td><td style={S.td}>{fmtCur(c.spend)}</td><td style={S.td}>{c.cpm} EUR</td><td style={S.td}>{c.cpc>0?c.cpc+" EUR":"—"}</td><td style={S.td}>{c.viewability>0?c.viewability+"%":"—"}</td><td style={S.td}>{c.vcr>0?c.vcr+"%":"—"}</td><td style={S.td}>{fmtNum(c.conversions)}</td></tr>))}</tbody></table>
            </div>
          </div>
        </>)}

        {/* ======= ROI ======= */}
        {activeTab==="roi"&&(<>
          <div style={{...S.formatInfo,marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:NURU.gold,marginBottom:4}}>Analyse ROI</div><div style={{fontSize:11,color:NURU.textMuted}}>Efficacite du budget : rapport entre les couts (CPM, CPC, CPA) et les resultats (CTR, conversions). Plus le CPM est bas et le CTR eleve, meilleur est le ROI.</div></div>
          <div style={S.grid}>
            <div style={{...S.card,...S.cardFull}}><div style={S.cardTitle}>Evolution CPM et CTR</div>
              <ResponsiveContainer width="100%" height={300}><ComposedChart data={roiTimeSeries}><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis dataKey="label" stroke={NURU.textMuted} fontSize={10} tickLine={false}/><YAxis yAxisId="l" stroke={NURU.textMuted} fontSize={10} label={{value:"CPM (EUR)",angle:-90,position:"insideLeft",style:{fill:NURU.textMuted,fontSize:10}}}/><YAxis yAxisId="r" orientation="right" stroke={NURU.textMuted} fontSize={10} label={{value:"CTR (%)",angle:90,position:"insideRight",style:{fill:NURU.textMuted,fontSize:10}}}/><Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:10}}/><Area yAxisId="l" type="monotone" dataKey="cpmTrend" name="CPM EUR" fill={CHART_GOLD_FILL} stroke={CHART_GOLD} strokeWidth={2}/><Line yAxisId="r" type="monotone" dataKey="ctrTrend" name="CTR %" stroke={NURU.goldLight} strokeWidth={2} dot={false}/></ComposedChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>CPM par canal (EUR)</div>
              <ResponsiveContainer width="100%" height={280}><BarChart data={roiData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis type="number" stroke={NURU.textMuted} fontSize={10}/><YAxis type="category" dataKey="format" stroke={NURU.textMuted} fontSize={11} width={100}/><Tooltip content={<CT/>}/><Bar dataKey="cpm" name="CPM EUR" fill={CHART_GOLD} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>CTR par canal (%)</div>
              <ResponsiveContainer width="100%" height={280}><BarChart data={roiData.filter(r=>r.ctr>0).sort((a,b)=>b.ctr-a.ctr)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis type="number" stroke={NURU.textMuted} fontSize={10}/><YAxis type="category" dataKey="format" stroke={NURU.textMuted} fontSize={11} width={100}/><Tooltip content={<CT/>}/><Bar dataKey="ctr" name="CTR %" fill={NURU.goldDark} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>CPA par canal (EUR)</div>
              <ResponsiveContainer width="100%" height={280}><BarChart data={roiData.filter(r=>r.cpa>0).sort((a,b)=>a.cpa-b.cpa)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis type="number" stroke={NURU.textMuted} fontSize={10}/><YAxis type="category" dataKey="format" stroke={NURU.textMuted} fontSize={11} width={100}/><Tooltip content={<CT/>}/><Bar dataKey="cpa" name="CPA EUR" fill={CHART_GOLD} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>Repartition des depenses</div>
              <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={roiData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="spend" nameKey="format" label={({format,percent})=>`${format} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{roiData.map((_,i)=><Cell key={i} fill={PIE_PALETTE[i%PIE_PALETTE.length]}/>)}</Pie><Tooltip content={<CT/>}/></PieChart></ResponsiveContainer>
            </div>
            <div style={{...S.card,...S.cardFull,overflowX:"auto"}}><div style={S.cardTitle}>Tableau ROI par canal</div>
              <table style={S.table}><thead><tr>{["Canal","Depenses","Impressions","Clics","CTR","CPM","CPC","Conversions","CPA","Taux conv."].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{roiData.map((r,i)=>(<tr key={r.format} style={{background:i%2?"rgba(255,255,255,0.015)":"transparent"}}><td style={S.td}><span style={S.badge}>{r.format}</span></td><td style={S.td}>{fmtCur(r.spend)}</td><td style={S.td}>{fmtNum(formatBreakdown.find(f=>f.format===r.format)?.impressions||0)}</td><td style={S.td}>{fmtNum(formatBreakdown.find(f=>f.format===r.format)?.clicks||0)}</td><td style={S.td}>{r.ctr}%</td><td style={S.td}>{r.cpm} EUR</td><td style={S.td}>{r.cpc>0?r.cpc+" EUR":"—"}</td><td style={S.td}>{fmtNum(formatBreakdown.find(f=>f.format===r.format)?.conversions||0)}</td><td style={S.td}>{r.cpa>0?r.cpa+" EUR":"—"}</td><td style={S.td}>{r.convRate>0?r.convRate+"%":"—"}</td></tr>))}</tbody></table>
            </div>
          </div>
        </>)}

        {/* ======= VISIBILITY ======= */}
        {activeTab==="visibility"&&(<>
          <div style={{...S.formatInfo,marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:NURU.gold,marginBottom:4}}>Analyse Visibilite</div><div style={{fontSize:11,color:NURU.textMuted}}>La viewability mesure le pourcentage d'impressions reellement vues par l'utilisateur (standard IAB : 50% de la surface visible pendant 1s minimum). Un taux eleve signifie que le budget est bien investi en termes de visibilite reelle.</div></div>
          <div style={S.grid}>
            <div style={{...S.card,...S.cardFull}}><div style={S.cardTitle}>Viewability par canal (%)</div>
              <ResponsiveContainer width="100%" height={280}><BarChart data={visibilityData.filter(v=>v.viewability>0).sort((a,b)=>b.viewability-a.viewability)}><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis dataKey="format" stroke={NURU.textMuted} fontSize={11}/><YAxis stroke={NURU.textMuted} fontSize={10} domain={[0,100]}/><Tooltip content={<CT/>}/><Bar dataKey="viewability" name="Viewability %" fill={CHART_GOLD} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>Impressions totales vs visibles</div>
              <ResponsiveContainer width="100%" height={Math.max(200,visibilityData.length*40)}><BarChart data={visibilityData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis type="number" stroke={NURU.textMuted} fontSize={10} tickFormatter={fmtNum}/><YAxis type="category" dataKey="format" stroke={NURU.textMuted} fontSize={11} width={100}/><Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="impressions" name="Totales" fill={NURU.goldDark+"88"} radius={[0,4,4,0]}/><Bar dataKey="visibleImpressions" name="Visibles" fill={CHART_GOLD} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
            </div>
            <div style={S.card}><div style={S.cardTitle}>VCR et LTR par canal (%)</div>
              <ResponsiveContainer width="100%" height={Math.max(200,visibilityData.filter(v=>v.vcr>0||v.ltr>0).length*40||200)}><BarChart data={visibilityData.filter(v=>v.vcr>0||v.ltr>0)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis type="number" stroke={NURU.textMuted} fontSize={10} domain={[0,100]}/><YAxis type="category" dataKey="format" stroke={NURU.textMuted} fontSize={11} width={100}/><Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="vcr" name="VCR %" fill={CHART_GOLD} radius={[0,4,4,0]}/><Bar dataKey="ltr" name="LTR %" fill={NURU.goldDark} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
            </div>
            <div style={{...S.card,...S.cardFull,overflowX:"auto"}}><div style={S.cardTitle}>Tableau visibilite par canal</div>
              <table style={S.table}><thead><tr>{["Canal","Impressions totales","Impressions visibles","Viewability","VCR","LTR"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{visibilityData.map((v,i)=>(<tr key={v.format} style={{background:i%2?"rgba(255,255,255,0.015)":"transparent"}}><td style={S.td}><span style={S.badge}>{v.format}</span></td><td style={S.td}>{fmtNum(v.impressions)}</td><td style={S.td}>{fmtNum(v.visibleImpressions)}</td><td style={S.td}>{v.viewability>0?v.viewability+"%":"—"}</td><td style={S.td}>{v.vcr>0?v.vcr+"%":"—"}</td><td style={S.td}>{v.ltr>0?v.ltr+"%":"—"}</td></tr>))}</tbody></table>
            </div>
          </div>
        </>)}

        {/* ======= SITES ======= */}
        {activeTab==="sites"&&(<div style={S.grid}>
          <div style={{...S.card,...S.cardFull}}><div style={S.cardTitle}>Depenses par site (EUR)</div><ResponsiveContainer width="100%" height={Math.max(280,sitePerformance.length*34)}><BarChart data={sitePerformance} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis type="number" stroke={NURU.textMuted} fontSize={10}/><YAxis type="category" dataKey="site" stroke={NURU.textMuted} fontSize={11} width={110}/><Tooltip content={<CT/>}/><Bar dataKey="spend" name="Depenses EUR" fill={CHART_GOLD} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
          <div style={S.card}><div style={S.cardTitle}>CTR par site (%)</div><ResponsiveContainer width="100%" height={Math.max(260,sitePerformance.filter(s=>s.ctr>0).length*34)}><BarChart data={sitePerformance.filter(s=>s.ctr>0).sort((a,b)=>b.ctr-a.ctr)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={NURU.cardBorder}/><XAxis type="number" stroke={NURU.textMuted} fontSize={10}/><YAxis type="category" dataKey="site" stroke={NURU.textMuted} fontSize={11} width={110}/><Tooltip content={<CT/>}/><Bar dataKey="ctr" name="CTR %" fill={NURU.goldDark} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
          <div style={S.card}><div style={S.cardTitle}>Repartition devices</div><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={deviceBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" nameKey="name" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{deviceBreakdown.map((_,i)=><Cell key={i} fill={PIE_PALETTE[i%PIE_PALETTE.length]}/>)}</Pie><Tooltip content={<CT/>}/></PieChart></ResponsiveContainer></div>
          <div style={{...S.card,...S.cardFull,overflowX:"auto"}}><div style={S.cardTitle}>Performance par site</div><table style={S.table}><thead><tr>{["Site","Impressions","Clics","CTR","Depenses","CPM","CPA","Conv."].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead><tbody>{sitePerformance.map((s,i)=>(<tr key={s.site} style={{background:i%2?"rgba(255,255,255,0.015)":"transparent"}}><td style={{...S.td,fontWeight:600}}>{s.site}</td><td style={S.td}>{fmtNum(s.impressions)}</td><td style={S.td}>{fmtNum(s.clicks)}</td><td style={S.td}>{s.ctr}%</td><td style={S.td}>{fmtCur(s.spend)}</td><td style={S.td}>{s.cpm} EUR</td><td style={S.td}>{s.cpa>0?s.cpa+" EUR":"—"}</td><td style={S.td}>{fmtNum(s.conversions)}</td></tr>))}</tbody></table></div>
        </div>)}

        {/* ======= TABLE ======= */}
        {activeTab==="table"&&(<div style={{...S.card,overflowX:"auto"}}><div style={S.cardTitle}>Donnees brutes ({filteredData.length.toLocaleString("fr-FR")} lignes)</div>
          <table style={S.table}><thead><tr>{["Date","Canal","Sous-format","Axe creatif","Device","Site","Impr.","Clics","CTR","CPM","Dep.","Viewab.","VCR","LTR","Conv."].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{filteredData.slice(0,150).map((r,i)=>(<tr key={i} style={{background:i%2?"rgba(255,255,255,0.015)":"transparent"}}><td style={S.td}>{r.date}</td><td style={S.td}><span style={S.badge}>{r.format}</span></td><td style={{...S.td,fontSize:10}}>{r.subFormat}</td><td style={{...S.td,fontSize:10}}>{r.creative||"—"}</td><td style={S.td}>{r.device}</td><td style={S.td}>{r.site}</td><td style={S.td}>{(r.impressions||0).toLocaleString("fr-FR")}</td><td style={S.td}>{(r.clicks||0).toLocaleString("fr-FR")}</td><td style={S.td}>{fmtPct(r.ctr||0)}</td><td style={S.td}>{fmtDec(r.cpm||0)}</td><td style={S.td}>{fmtDec(r.spend||0)}</td><td style={S.td}>{r.viewability>0?r.viewability+"%":"—"}</td><td style={S.td}>{r.vcr>0?r.vcr+"%":"—"}</td><td style={S.td}>{r.ltr>0?r.ltr+"%":"—"}</td><td style={S.td}>{r.conversions||0}</td></tr>))}</tbody></table>
          {filteredData.length>150&&<p style={{padding:12,color:NURU.textMuted,fontSize:11,textAlign:"center"}}>150 premieres lignes sur {filteredData.length.toLocaleString("fr-FR")}</p>}
        </div>)}

        <div style={{textAlign:"center",padding:"24px 0 10px",color:NURU.textDark,fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em"}}>NURU — Dashboard Programmatique Multi-Canal — {new Date().getFullYear()}</div>
      </main>
    </div>
  );
}
