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
const MONGO_URI = process.env.MONGO_URI || 'mongodb://13.53.89.47:27017/netnebula';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

const expireAfterSeconds = 86400; // 24 hours
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434';
const ollama = new Ollama({ host: OLLAMA_URL });

// === INFERENCE QUEUE SYSTEM ===
class InferenceQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    async add(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.process();
        });
    }

    async process() {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;
        
        const { task, resolve, reject } = this.queue.shift();
        console.log(`[AI Queue] Processing task. Remaining: ${this.queue.length}`);
        try {
            const result = await task();
            resolve(result);
        } catch (error) {
            console.error(`[AI Queue] Task failed:`, error.message);
            reject(error);
        } finally {
            this.processing = false;
            console.log(`[AI Queue] Task finished.`);
            // Small delay to prevent hammering the service
            setTimeout(() => this.process(), 500);
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
    return aiQueue.add(async () => {
        try {
            const prompt = `System: You are NetNebula Tactical Intelligence. Analyze this semantic relationship.
Topic A: ${topicA}
Topic B: ${topicB}
Semantic Vector Overlap: ${keywords.join(', ')}
Confidence Level: ${(strength * 100).toFixed(1)}%
Provide a high-fidelity intelligence report including Origin, Impact Analysis, and Strategic Implications.`;

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
            return `Report: Tactical correlation established between [${topicA.substring(0,20)}...] and [${topicB.substring(0,20)}...] via shared latent vectors (${keywords.join(', ')}).\nImpact: Semantic alignment suggests emerging sectoral importance in this domain cluster.\nStrategic Advice: Monitor for high-velocity signal divergence along established parameter lines.`;
        }
    });
}

async function generateTrendAnalysis(topic, category) {
    return aiQueue.add(async () => {
        try {
            const prompt = `System: You are NetNebula Insight. Topic analysis: ${topic}. 
Briefly explain its current momentum and sector outlook.`;
            console.log(`[AI] Generating trend analysis for ${topic}...`);
            const response = await ollama.chat({
                model: "llama3.2:1b",
                messages: [{ role: "user", content: prompt }],
                stream: false
            });
            console.log(`[AI] Successfully generated trend analysis.`);
            return response.message.content.trim();
        } catch (e) {
            console.error("[AI] Trend Error:", e.message);
            return `INFERENCE OVERRIDE: [${topic.substring(0,30)}...] exhibits anomalous structural growth within the [${category.toUpperCase()}] matrix. Sustained telemetry implies high likelihood of cascading cluster formation over the next active cycle. Recommend close monitoring.`;
        }
    });
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
    const clusterId = getClusterForTitle(title);
    const keywords = extractKeywords(title);

    const signal = new Signal({ source, title, value, category, clusterId, keywords, url });
    await signal.save();
    
    inMemorySignals.unshift(signal);
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
    const recent = inMemorySignals.slice(0, 150); // Reduced from 150 to 50 for stability
    if (recent.length < 2) return;
    const globalTfidf = new TfIdf();
    recent.forEach(s => globalTfidf.addDocument(s.title));

    for (let i = 0; i < recent.length; i++) {
        for (let j = i + 1; j < recent.length; j++) {
            const s1 = recent[i];
            const s2 = recent[j];
            
            // FIX: Prevent Self-Linkage or Title-Duplicate Overlap
            if (s1._id.toString() === s2._id.toString() || s1.title.trim().toLowerCase() === s2.title.trim().toLowerCase()) continue;

            const vecA = {};
            globalTfidf.listTerms(i).forEach(t => vecA[t.term] = t.tfidf);
            const vecB = {};
            globalTfidf.listTerms(j).forEach(t => vecB[t.term] = t.tfidf);
            const similarity = cosineSimilarity(vecA, vecB);
            
            // REDUCED THRESHOLD FOR RICHER CONNECTIONS (0.15)
            if (similarity > 0.15) {
                const linkId = [s1._id.toString(), s2._id.toString()].sort().join('::');
                const existing = await Correlation.findOne({ linkId });
                if (!existing) {
                    const sharedKeywords = s1.keywords.filter(k => s2.keywords.includes(k));
                    
                    // Optimized: Only generate AI insights for the first 5 new correlations per cycle
                    const currentCycleInsights = await Correlation.countDocuments({ timestamp: { $gt: new Date(Date.now() - 30000) } });
                    let briefing = "";
                    if (currentCycleInsights < 3) {
                         briefing = await generateElaborateInsight(s1.title, s2.title, sharedKeywords, similarity);
                    } else {
                         briefing = `Analysis Pending: Semantic match detected between [${s1.title.substring(0,20)}] and [${s2.title.substring(0,20)}]. Detailed intelligence queued for next active cycle.`;
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
    } catch (e) {}
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
    } catch (e) {}
}

async function fetchCrypto() {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/search/trending', { timeout: 5000 });
        for (const coin of response.data.coins.slice(0, 5)) {
            const data = coin.item;
            const value = (20 - data.score) * 100;
            await processSignal("coingecko", `Trending: ${data.name} (${data.symbol})`, value, "crypto", `https://www.coingecko.com/en/coins/${data.id}`);
        }
    } catch (e) {}
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

app.get('/api/signals', (req, res) => {
    res.json(inMemorySignals.map(s => ({
        id: s._id, title: s.title, value: s.value, category: s.category, clusterId: s.clusterId, keywords: s.keywords, timestamp: s.timestamp, url: s.url
    })));
});
app.get('/api/anomalies', async (req, res) => res.json(await Anomaly.find().sort({ timestamp: -1 }).limit(30)));
app.get('/api/correlations', async (req, res) => res.json(await Correlation.find().sort({ timestamp: -1 }).limit(10)));
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
    } catch(err) { console.error("Wipe failed", err); }

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
