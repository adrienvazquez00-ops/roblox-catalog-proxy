// Proxy simple para el catálogo de Roblox.
// Roblox bloquea HttpService -> *.roblox.com directamente, así que este servidor
// (que vive fuera de Roblox) hace la petición real y le regresa el resultado a tu juego.

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Endpoint que tu juego va a llamar: /catalog/search?category=11&subcategory=9&keyword=&limit=30
app.get('/catalog/search', async (req, res) => {
	try {
		const { category, subcategory, keyword, limit, cursor } = req.query;

		// Armamos la URL real hacia el catálogo de Roblox
		const params = new URLSearchParams();
		if (category) params.append('Category', category);
		if (subcategory) params.append('Subcategory', subcategory);
		if (keyword) params.append('Keyword', keyword);
		params.append('Limit', limit || '30');
		params.append('SortType', '6'); // 6 = RecentlyCreated (más variedad que MostFavorited/Price)
		if (cursor) params.append('Cursor', cursor);

		const targetUrl = `https://catalog.roblox.com/v1/search/items/details?${params.toString()}`;

		const response = await fetch(targetUrl, {
			headers: { 'Accept': 'application/json' }
		});

		if (!response.ok) {
			const errorBody = await response.text();
			console.error('Roblox respondió con error:', response.status, errorBody);
			return res.status(response.status).json({
				error: 'Roblox catalog request failed',
				status: response.status,
				robloxMessage: errorBody,
				requestedUrl: targetUrl
			});
		}

		const data = await response.json();
		res.json(data);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Internal proxy error' });
	}
});

// Endpoint de diagnóstico: devuelve las categorías y subcategorías válidas actuales,
// directo de Roblox, para no depender de números desactualizados de foros viejos.
app.get('/catalog/categories', async (req, res) => {
	try {
		const response = await fetch('https://catalog.roblox.com/v1/categories', {
			headers: { 'Accept': 'application/json' }
		});
		const data = await response.json();
		res.json(data);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Internal proxy error' });
	}
});

app.get('/catalog/subcategories', async (req, res) => {
	try {
		const response = await fetch('https://catalog.roblox.com/v1/subcategories', {
			headers: { 'Accept': 'application/json' }
		});
		const data = await response.json();
		res.json(data);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Internal proxy error' });
	}
});

// Endpoint de salud, para confirmar que el servidor está vivo
app.get('/', (req, res) => {
	res.send('Proxy de catálogo Roblox funcionando correctamente.');
});

app.listen(PORT, () => {
	console.log(`Proxy escuchando en puerto ${PORT}`);
});
