const STATUS_URL = 'https://www.toronto.ca/data/parks/live/skate_allupdates.json';

module.exports = async function (req, res) {
    try {
        const r = await fetch(STATUS_URL);
        if (!r.ok) throw new Error('Upstream ' + r.status);
        const data = await r.json();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        res.status(200).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch live status', detail: err.message });
    }
};
