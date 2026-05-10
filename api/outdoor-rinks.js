const OUTDOOR_URL = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/e51b5d31-a53c-4fc5-a204-36c43243dd3b/resource/2ae3625b-30f1-4470-bf80-ecc56ab2d674/download/outdoor-ice-rinks-4326.geojson';

module.exports = async function (req, res) {
    try {
        const r = await fetch(OUTDOOR_URL);
        if (!r.ok) throw new Error('Upstream ' + r.status);
        const data = await r.json();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        res.status(200).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch outdoor rinks', detail: err.message });
    }
};
