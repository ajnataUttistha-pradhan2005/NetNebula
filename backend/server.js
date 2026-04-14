const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const natural = require('natural');
const TfIdf = natural.TfIdf;

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ethermind';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

const expireAfterSeconds = 86400; // 24 hours
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434';

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
    urlA: String, // Store original source URL for vector A
    urlB: String, // Store original source URL for vector B
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
    try {
        const prompt = `System: You are EtherMind Tactical Intelligence. Analyze connection.
Topic A: ${topicA}
Topic B: ${topicB}
Shared Vectors: ${keywords.join(', ')}
Confidence: ${(strength * 100).toFixed(1)}%
Provide a detailed multi-paragraph intelligence briefing (Origin, Impact Analysis, Strategy).`;

        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
            model: "phi3:mini",
            prompt: prompt,
            stream: false
        }, { timeout: 12000 });

        return response.data.response.trim();
    } catch (e) {
        return `Condition: Latent semantic bridge identified. \nImpact: Significant domain overlap suggests a unified narrative trajectory. \nStrategy: Intensify signal monitoring.`;
    }
}

async function generateTrendAnalysis(topic, category) {
    try {
        const prompt = `System: You are EtherMind Insight. Analyze trending topic: ${topic}. 
Explain its momentum and outlook in 3 informative sentences using tactical terminology.`;
        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
            model: "phi3:mini",
            prompt: prompt,
            stream: false
        }, { timeout: 10000 });
        return response.data.response.trim();
    } catch (e) {
        return `Analysis current unavailable. Momentum indicates sustained sectoral growth.`;
    }
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
    if(inMemorySignals.length > 100) {
        const countsByCluster = {};
        inMemorySignals.forEach(s => countsByCluster[s.clusterId] = (countsByCluster[s.clusterId] || 0) + 1);
        const maxClusterId = Object.keys(countsByCluster).reduce((a, b) => countsByCluster[a] > countsByCluster[b] ? a : b);
        const idxToRemove = inMemorySignals.findLastIndex(s => s.clusterId === parseInt(maxClusterId));
        if (idxToRemove !== -1) inMemorySignals.splice(idxToRemove, 1);
        else inMemorySignals.pop();
    }

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
        existingTrend.currentAttention = value;
        existingTrend.lastUpdated = Date.now();
        await existingTrend.save();
    } else {
        const analysis = await generateTrendAnalysis(topicName, cat);
        await Trend.create({ topic: topicName, category: cat, currentAttention: value, momentum: 0, url, clusterId, analysis });
    }
}

async function computeCorrelations() {
    const recent = inMemorySignals.slice(0, 25);
    if (recent.length < 2) return;
    const globalTfidf = new TfIdf();
    recent.forEach(s => globalTfidf.addDocument(s.title));

    for (let i = 0; i < recent.length; i++) {
        for (let j = i + 1; j < recent.length; j++) {
            const s1 = recent[i];
            const s2 = recent[j];
            if (s1.clusterId !== s2.clusterId) continue; 
            const vecA = {};
            globalTfidf.listTerms(i).forEach(t => vecA[t.term] = t.tfidf);
            const vecB = {};
            globalTfidf.listTerms(j).forEach(t => vecB[t.term] = t.tfidf);
            const similarity = cosineSimilarity(vecA, vecB);
            
            if (similarity > 0.25) {
                const linkId = [s1.title.trim(), s2.title.trim()].sort().join('::');
                const existing = await Correlation.findOne({ linkId });
                if (!existing) {
                    const sharedKeywords = s1.keywords.filter(k => s2.keywords.includes(k));
                    const briefing = await generateElaborateInsight(s1.title, s2.title, sharedKeywords, similarity);
                    await Correlation.create({
                        linkId, topicA: s1.title.trim(), topicB: s2.title.trim(), 
                        urlA: s1.url, urlB: s2.url, // PERSIST SOURCES
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
            headers: { 'User-Agent': 'EtherMind/1.3.1' }, timeout: 5000
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
            const value = (20 - data.score) * 100; // Trending rank weight
            await processSignal("coingecko", `Trending: ${data.name} (${data.symbol})`, value, "crypto", `https://www.coingecko.com/en/coins/${data.id}`);
        }
    } catch (e) {}
}

setInterval(async () => {
    if (mongoose.connection.readyState !== 1) return;
    await fetchReddit();
    await fetchHackerNews();
    await fetchCrypto();
    await computeCorrelations();
}, 25000);

app.get('/api/signals', (req, res) => {
    res.json(inMemorySignals.map(s => ({
        id: s._id, title: s.title, value: s.value, category: s.category, clusterId: s.clusterId, keywords: s.keywords, timestamp: s.timestamp, url: s.url
    })));
});
app.get('/api/anomalies', async (req, res) => res.json(await Anomaly.find().sort({ timestamp: -1 }).limit(30)));
app.get('/api/correlations', async (req, res) => res.json(await Correlation.find().sort({ timestamp: -1 }).limit(10)));
app.get('/api/stats', async (req, res) => {
    const trends = await Trend.find().sort({ currentAttention: -1 }).limit(10);
    // SYNC COUNT WITH MEMORY BUFFER
    res.json({ totalSignalsProcessed: inMemorySignals.length, anomalyCount: await Anomaly.countDocuments(), correlationCount: await Correlation.countDocuments(), topTrending: trends[0]?.topic || "Optimizing...", trends });
});

app.listen(PORT, '0.0.0.0', () => console.log(`Neural Backend V1.3.1 Active: ${PORT}`));
