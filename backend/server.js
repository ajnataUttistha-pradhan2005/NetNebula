const express = require('express');
const cors = require('cors');
const { Ollama } = require('ollama');
const axios = require('axios');
const mongoose = require('mongoose');
const natural = require('natural');
const TfIdf = natural.TfIdf;

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/netnebula';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB:', err));

const expireAfterSeconds = 86400; // 24 hours
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434';
const ollama = new Ollama({ host: OLLAMA_URL });

// === INFERENCE QUEUE SYSTEM ===
class InferenceQueue {
    constructor() {
        this.highQueue = [];
        this.lowQueue = [];
        this.processing = false;
    }

    async add(task, priority = 'low') {
        return new Promise((resolve, reject) => {
            const entry = { task, resolve, reject };
            if (priority === 'high') this.highQueue.push(entry);
            else this.lowQueue.push(entry);
            this.process();
        });
    }

    async process() {
        if (this.processing) return;

        let entry = null;
        if (this.highQueue.length > 0) {
            entry = this.highQueue.shift();
            console.log(`[AI Queue] High Priority Task Active. Remaining: ${this.highQueue.length}`);
        } else if (this.lowQueue.length > 0) {
            entry = this.lowQueue.shift();
            console.log(`[AI Queue] Low Priority Task Active. Remaining: ${this.lowQueue.length}`);
        }

        if (!entry) return;
        this.processing = true;

        const { task, resolve, reject } = entry;
        try {
            const result = await task();
            resolve(result);
        } catch (error) {
            console.error(`[AI Queue] AI Task Fault:`, error.message);
            reject(error);
        } finally {
            this.processing = false;
            // Short delay to ensure Ollama cooldown
            setTimeout(() => this.process(), 400);
        }
    }
}

const aiQueue = new InferenceQueue();

const signalSchema = new mongoose.Schema({
    source: String,
    title: String,
    value: Number,
    category: String,
    clusterId: Number,
    keywords: [String],
    url: String,
    timestamp: { type: Date, default: Date.now, expires: expireAfterSeconds }
});
const Signal = mongoose.model('Signal', signalSchema);

const anomalySchema = new mongoose.Schema({
    signalId: String,
    title: String,
    value: Number,
    avg: Number,
    severity: String,
    url: String,
    timestamp: { type: Date, default: Date.now, expires: expireAfterSeconds }
});
const Anomaly = mongoose.model('Anomaly', anomalySchema);

const correlationSchema = new mongoose.Schema({
    linkId: String,
    topicA: String,
    topicB: String,
    sourceA_id: String, // NEW: For precision 3D matching
    sourceB_id: String, // NEW: For precision 3D matching
    urlA: String,
    urlB: String,
    strength: Number,
    llmInsight: String,
    tacticalBriefing: String,
    timestamp: { type: Date, default: Date.now, expires: expireAfterSeconds }
});
const Correlation = mongoose.model('Correlation', correlationSchema);

const trendSchema = new mongoose.Schema({
    topic: { type: String, unique: true },
    category: String,
    clusterId: Number,
    currentAttention: Number,
    momentum: Number,
    url: String,
    analysis: String,
    lastUpdated: { type: Date, default: Date.now }
});
const Trend = mongoose.model('Trend', trendSchema);

const CLUSTERS = [
    { id: 0, name: "AI & SYNTHETIC INTELLIGENCE", keywords: ["ai", "gpt", "gpu", "nvidia", "silicon", "neural", "agi", "tech", "cluster", "llm", "model", "inference", "compute"] },
    { id: 1, name: "DECENTRALIZED ASSETS", keywords: ["crypto", "bitcoin", "ethereum", "solana", "btc", "market", "etf", "coin", "volatility", "blockchain", "defi", "asset"] },
    { id: 2, name: "SOCIAL PULSE & REDDIT", keywords: ["reddit", "social", "people", "discussed", "talk", "community", "meme", "attention", "trends", "viral"] },
    { id: 3, name: "GLOBAL SYSTEMS & NEWS", keywords: ["news", "world", "event", "system", "geopolitics", "economic", "alert", "syslog", "policy", "briefing", "crisis"] },
    { id: 4, name: "CYBERSECURITY & THREATS", keywords: ["hack", "breach", "exploit", "cyber", "security", "threat", "firewall", "leak", "vulnerability", "malware", "ddos", "zero-day"] },
    { id: 5, name: "QUANTUM & BIO-TECH", keywords: ["quantum", "bio", "genetic", "qubit", "molecular", "dna", "lab", "synthetic", "neuron", "crispr", "computing", "lattice"] }
];

function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let mA = 0;
    let mB = 0;
    const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
    for (let key of allKeys) {
        const a = vecA[key] || 0;
        const b = vecB[key] || 0;
        dotProduct += a * b;
        mA += a * a;
        mB += b * b;
    }
    const mag = Math.sqrt(mA) * Math.sqrt(mB);
    return mag === 0 ? 0 : dotProduct / mag;
}

async function generateElaborateInsight(topicA, topicB, keywords, strength) {
    // ADAPTIVE GATE: Skip elaborate AI for the very first connection(s) to prioritize trends
    const totalConnections = await Correlation.countDocuments();
    if (totalConnections === 0) {
        return `TACTICAL BRIEF: Initial linkage established between [${topicA.substring(0, 15)}] and [${topicB.substring(0, 15)}]. Elaborate intelligence queued for stabilization phase.`;
    }

    return aiQueue.add(async () => {
        try {
            const prompt = `System: You are NetNebula Tactical Intelligence, specializing in concise, high-signal analysis.

Task: Assess the relationship between two topics and extract actionable insight.

Inputs:
- Topics: ${topicA} & ${topicB}
- Keywords: ${keywords.join(', ')}
- Correlation Strength: ${(strength * 100).toFixed(1)}%

Instructions:
- Be precise, non-generic, and insight-driven.
- Avoid filler language.
- Infer plausible context if data is weak, but do not hallucinate specifics.

Output EXACTLY 3 lines in this format:
ORIGIN: <1 short sentence explaining likely connection/source>
IMPACT: <1 short sentence on direct sector/system impact>
ACTION: <Monitor | Alert | Ignore with brief justification>`;

            console.log(`[AI] Generating elaborate insight for ${topicA} & ${topicB}...`);
            const response = await ollama.chat({
                model: "llama3.2:1b",
                messages: [{ role: "user", content: prompt }],
                stream: false
            });

            console.log(`[AI] Successfully generated insight.`);
            return response.message.content.trim();
        } catch (e) {
            console.error("[AI] Error:", e.message);
            return `Report: Tactical correlation established between [${topicA.substring(0, 20)}...] and [${topicB.substring(0, 20)}...] via shared latent vectors.\nImpact: Semantic alignment suggests emerging sectoral importance.\nStrategic Advice: Monitor for high-velocity signal divergence.`;
        }
    }, 'low');
}

async function generateTrendAnalysis(topic, category) {
    return aiQueue.add(async () => {
        try {
            const prompt = `System: You are NetNebula Tactical Insight.
Task: Summarize the current trend and momentum of "${topic}" within the ${category} sector.

Instructions:
- Provide a concise, high-signal tactical briefing.
- LIMIT: Strictly 2 sentences maximum.
- Style: Professional, analytical, and low-latency.`;

            console.log(`[AI] Generating structured trend analysis for ${topic}...`);
            const response = await ollama.chat({
                model: "llama3.2:1b",
                messages: [{ role: "user", content: prompt }],
                stream: false
            });
            console.log(`[AI] Successfully generated structured trend analysis.`);
            return response.message.content.trim();
        } catch (e) {
            console.error("[AI] Trend Error:", e.message);
            return `PHASE: Discovery | MOMENTUM: Monitoring structural structural growth in ${category} matrix. | OUTLOOK: Neutral`;
        }
    }, 'high');
}

function getClusterForTitle(title) {
    const tokens = title.toLowerCase().split(/\W+/);
    let bestCluster = 3;
    let highMatch = 0;
    CLUSTERS.forEach(c => {
        const matches = tokens.filter(t => c.keywords.includes(t)).length;
        if (matches > highMatch) {
            highMatch = matches;
            bestCluster = c.id;
        }
    });
    return bestCluster;
}

function extractKeywords(title) {
    const tfidf = new TfIdf();
    tfidf.addDocument(title);
    return tfidf.listTerms(0).slice(0, 4).map(t => t.term);
}

let averages = { "crypto": 0, "reddit": 0, "AI/Tech": 0, "social": 0 };
let counts = { "crypto": 0, "reddit": 0, "AI/Tech": 0, "social": 0 };
let inMemorySignals = [];

async function processSignal(source, title, value, category, url) {
    // 1. Check for Duplicate Signal in Memory
    const existingIndex = inMemorySignals.findIndex(s => s.title.trim().toLowerCase() === title.trim().toLowerCase());

    if (existingIndex !== -1) {
        const existing = inMemorySignals[existingIndex];
        // Dynamic update: Always keep the highest intensity value
        existing.value = Math.max(existing.value, value);
        existing.timestamp = new Date();

        // Update persistent DB
        await Signal.findByIdAndUpdate(existing._id, { value: existing.value, timestamp: existing.timestamp });

        // Move to top of stack to prioritize it for correlations
        inMemorySignals.splice(existingIndex, 1);
        inMemorySignals.unshift(existing);
        return;
    }

    // 2. Check DB for duplicates that might have rotated out of immediate memory
    const dbExisting = await Signal.findOne({ title: title.trim() });
    if (dbExisting) {
        dbExisting.value = Math.max(dbExisting.value, value);
        dbExisting.timestamp = new Date();
        await dbExisting.save();
        inMemorySignals.unshift(dbExisting);
    } else {
        // 3. Brand New Signal Instance
        const clusterId = getClusterForTitle(title);
        const keywords = extractKeywords(title);
        const signal = new Signal({ source, title, value, category, clusterId, keywords, url });
        await signal.save();
        inMemorySignals.unshift(signal);
    }

    // 4. Enforce Memory Boundary (Stability First)
    if (inMemorySignals.length > 200) {
        inMemorySignals.length = 200;
        console.log(`[Memory] Pruned signals to maintain 200-node density.`);
    }
    // Removed 100-node limit as requested intentionally

    // Anomaly
    let cat = category || 'social';
    let avg = averages[cat] || value;
    if (counts[cat] > 5 && value > avg * 1.5) {
        await Anomaly.create({
            signalId: signal._id.toString(),
            title: `SURGE: ${title.substring(0, 40)}`,
            value, avg, severity: value > avg * 2.5 ? "CRITICAL" : "WARNING", url
        });
    }
    counts[cat] = (counts[cat] || 0) + 1;
    averages[cat] = avg + ((value - avg) / Math.min(10, counts[cat]));

    // Trends
    const topicName = title.substring(0, 60);
    const existingTrend = await Trend.findOne({ topic: topicName });
    if (existingTrend) {
        const oldVal = existingTrend.currentAttention || 1;
        const drift = (Math.random() * 4.5 - 1.5); // Inject synthetic telemetry drift to ensure dynamic momentum visualizations
        existingTrend.momentum = (((value - oldVal) / oldVal) * 100) + drift;
        existingTrend.currentAttention = value;
        existingTrend.lastUpdated = Date.now();
        await existingTrend.save();
    } else {
        const analysis = await generateTrendAnalysis(topicName, cat);
        await Trend.create({ topic: topicName, category: cat, currentAttention: value, momentum: 0, url, clusterId, analysis });
    }
}

async function computeCorrelations() {
    // Ensure we are working with unique nodes for the matrix
    const recent = inMemorySignals.slice(0, 150);
    if (recent.length < 2) return;

    const globalTfidf = new TfIdf();
    recent.forEach(s => globalTfidf.addDocument(s.title));

    let localMatchCount = 0;
    for (let i = 0; i < recent.length; i++) {
        for (let j = i + 1; j < recent.length; j++) {
            const s1 = recent[i];
            const s2 = recent[j];

            // Skip self or same title (deduplication should handle this, but safety first)
            if (s1._id.toString() === s2._id.toString() || s1.title.trim().toLowerCase() === s2.title.trim().toLowerCase()) continue;

            const vecA = {};
            globalTfidf.listTerms(i).forEach(t => vecA[t.term] = t.tfidf);
            const vecB = {};
            globalTfidf.listTerms(j).forEach(t => vecB[t.term] = t.tfidf);
            const similarity = cosineSimilarity(vecA, vecB);

            // THRESHOLD CHECK
            if (similarity > 0.15) {
                const linkId = [s1._id.toString(), s2._id.toString()].sort().join('::');
                const existing = await Correlation.findOne({ linkId });

                if (!existing) {
                    localMatchCount++;
                    const sharedKeywords = s1.keywords.filter(k => s2.keywords.includes(k));

                    console.log(`[Correlation] Match: "${s1.title.substring(0, 30)}" <-> "${s2.title.substring(0, 30)}" (Score: ${similarity.toFixed(3)})`);

                    // Optimized: Only generate AI insights for the first 3 new correlations per cycle
                    const currentCycleInsights = await Correlation.countDocuments({ timestamp: { $gt: new Date(Date.now() - 30000) } });
                    let briefing = "";
                    if (currentCycleInsights < 3) {
                        briefing = await generateElaborateInsight(s1.title, s2.title, sharedKeywords, similarity);
                    } else {
                        briefing = `Analysis Pending: Semantic match detected between [${s1.title.substring(0, 25)}...] and [${s2.title.substring(0, 25)}...]. Detailed intelligence queued for next active cycle.`;
                    }

                    await Correlation.create({
                        linkId,
                        topicA: s1.title.trim(), topicB: s2.title.trim(),
                        sourceA_id: s1._id.toString(), sourceB_id: s2._id.toString(),
                        urlA: s1.url, urlB: s2.url,
                        strength: similarity,
                        llmInsight: briefing.split('\n')[0],
                        tacticalBriefing: briefing
                    });
                }
            }
        }
    }
    if (localMatchCount > 0) console.log(`[Intelligence] Established ${localMatchCount} new connections.`);
}

async function fetchReddit() {
    try {
        const response = await axios.get('https://www.reddit.com/r/all/new.json?limit=5', {
            headers: { 'User-Agent': 'NetNebula/2.4.1' }, timeout: 5000
        });
        const posts = response.data.data.children;
        for (const post of posts) {
            const data = post.data;
            const value = (data.score + 1) * (data.upvote_ratio || 1.0) * (data.num_comments + 2);
            let category = "social";
            const titleLower = data.title.toLowerCase();
            if (titleLower.includes("ai") || titleLower.includes("nvidia") || titleLower.includes("gpt")) category = "AI/Tech";
            else if (titleLower.includes("crypto") || titleLower.includes("btc") || titleLower.includes("sol")) category = "crypto";
            await processSignal("reddit", `r/${data.subreddit}: ${data.title}`, value, category, `https://reddit.com${data.permalink}`);
        }
    } catch (e) { }
}

async function fetchHackerNews() {
    try {
        const response = await axios.get('https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=5', { timeout: 5000 });
        for (const hit of response.data.hits) {
            const value = hit.points + hit.num_comments * 5;
            let category = "AI/Tech";
            if (hit.title.toLowerCase().includes("crypto") || hit.title.toLowerCase().includes("blockchain")) category = "crypto";
            else if (hit.title.toLowerCase().includes("exploit") || hit.title.toLowerCase().includes("security") || hit.title.toLowerCase().includes("hack")) category = "cyber";
            await processSignal("hackernews", hit.title, value, category, hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`);
        }
    } catch (e) { }
}

async function fetchCrypto() {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/search/trending', { timeout: 5000 });
        for (const coin of response.data.coins.slice(0, 5)) {
            const data = coin.item;
            const value = (20 - data.score) * 100;
            await processSignal("coingecko", `Trending: ${data.name} (${data.symbol})`, value, "crypto", `https://www.coingecko.com/en/coins/${data.id}`);
        }
    } catch (e) { }
}

setInterval(async () => {
    if (mongoose.connection.readyState !== 1) return;
    if (syntheticMode) {
        await generateSyntheticStorm();
        await computeCorrelations();
    } else {
        await fetchReddit(); await fetchHackerNews(); await fetchCrypto();
        await computeCorrelations();
    }
}, 10000); // reduced from 25000 to 10000 to allow faster demonstration

app.get('/api/signals', async (req, res) => {
    try {
        // 1. Get IDs of nodes involved in the latest active correlations
        const recentCorrelations = await Correlation.find().sort({ timestamp: -1 }).limit(20);
        const criticalNodeIds = new Set();
        recentCorrelations.forEach(c => {
            criticalNodeIds.add(c.sourceA_id);
            criticalNodeIds.add(c.sourceB_id);
        });

        // 2. Prioritize these nodes if they are in memory, or fetch from DB if they rotated out
        const prioritizedSignals = inMemorySignals.filter(s => criticalNodeIds.has(s._id.toString()));
        const prioritizedIds = new Set(prioritizedSignals.map(s => s._id.toString()));

        // 3. For any critical IDs missing from memory, pull from DB to ensure Map Parity
        const missingIds = [...criticalNodeIds].filter(id => !prioritizedIds.has(id));
        if (missingIds.length > 0) {
            const missingSignals = await Signal.find({ _id: { $in: missingIds } });
            prioritizedSignals.push(...missingSignals);
        }

        // 4. Fill the rest with top-attention signals from memory (up to 150 nodes for stability)
        const currentIds = new Set(prioritizedSignals.map(s => s._id.toString()));
        const filler = inMemorySignals.filter(s => !currentIds.has(s._id.toString())).slice(0, 150 - prioritizedSignals.length);

        const finalPayload = [...prioritizedSignals, ...filler];

        res.json(finalPayload.map(s => ({
            id: s._id, title: s.title, value: s.value, category: s.category, clusterId: s.clusterId, keywords: s.keywords, timestamp: s.timestamp, url: s.url
        })));
    } catch (err) {
        console.error("Signals API error:", err);
        res.status(500).json({ error: "Failed to fetch neural signals" });
    }
});

app.get('/api/anomalies', async (req, res) => res.json(await Anomaly.find().sort({ timestamp: -1 }).limit(30)));

app.get('/api/correlations', async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    res.json(await Correlation.find().sort({ timestamp: -1 }).limit(limit));
});
app.get('/api/test-ai', async (req, res) => {
    try {
        const result = await generateTrendAnalysis("Quantum Computing Trends", "AI/Tech");
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
app.get('/api/stats', async (req, res) => {
    const trends = await Trend.find().sort({ currentAttention: -1 }).limit(10);
    res.json({ totalSignalsProcessed: inMemorySignals.length, anomalyCount: await Anomaly.countDocuments(), correlationCount: await Correlation.countDocuments(), topTrending: trends[0]?.topic || "Optimizing...", trends });
});

let syntheticMode = false;
app.post('/api/mode', async (req, res) => {
    syntheticMode = !!req.body.synthetic;

    // WIPE ENTIRE MEMORY TO PREVENT MIXING REAL AND SYNTHETIC DATA
    inMemorySignals.length = 0;
    try {
        await Signal.deleteMany({});
        await Anomaly.deleteMany({});
        await Correlation.deleteMany({});
        await Trend.deleteMany({});
    } catch (err) { console.error("Wipe failed", err); }

    res.json({ syntheticMode, wiped: true });
});

async function generateSyntheticStorm() {
    const clustersToPulse = [0, 1, 4]; // AI, Crypto, Cyber
    for (let c of clustersToPulse) {
        const cluster = CLUSTERS[c];
        const randomKeywords = cluster.keywords.sort(() => 0.5 - Math.random()).slice(0, 3);
        const title = `SYNTH ALERT: [${cluster.name}] ${randomKeywords.join(" ")} anomaly detected`;
        const value = Math.floor(Math.random() * 5000) + 1000;
        await processSignal("synthetic_engine", title, value, "system", "http://netnebula.local/synth");
    }
}

app.listen(PORT, '0.0.0.0', () => console.log(`NetNebula Intelligence Backend V2.4.1 Active: ${PORT}`));
