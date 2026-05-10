const INDOOR_URL = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/96e9989d-eca5-4e0b-824b-9789a39aea58/resource/3732a863-a629-4d71-8629-f331a83fd61f/download/indoor-ice-rinks-4326.geojson';

module.exports = async function (req, res) {
    try {
        const r = await fetch(INDOOR_URL);
        if (!r.ok) throw new Error('Upstream ' + r.status);
        const data = await r.json();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        res.status(200).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch indoor rinks', detail: err.message });
    }
};
