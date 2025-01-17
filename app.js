const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;
const url = 'https://es.wikipedia.org/wiki/Categor%C3%ADa:M%C3%BAsicos_de_rap';

//! Función para realizar el scraping
const scrapeData = async () => {
  try {
    //* 1. Obtener el HTML de la página principal
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    //* 2. Recoger los enlaces dentro de #mw-pages
    const links = [];
    $('#mw-pages a').each((_, element) => {
      const relativeLink = $(element).attr('href');
      if (relativeLink) {
        links.push(`https://es.wikipedia.org${relativeLink}`);
      }
    });

    console.log(`Encontrados ${links.length} enlaces para procesar...`);

    //* 3. Recolectar los datos de cada página interna
    const results = [];
    for (const link of links) {
      try {
        const { data: pageData } = await axios.get(link);
        const $$ = cheerio.load(pageData);

        const title = $$('h1').text();
        const images = [];
        $$('img').each((_, img) => {
          const src = $(img).attr('src');
          if (src) {
            images.push(`https:${src}`);
          }
        });
        const texts = [];
        $$('p').each((_, paragraph) => {
          const text = $(paragraph).text().trim();
          if (text) {
            texts.push(text);
          }
        });

        results.push({ title, images, texts });
        console.log(`Datos recolectados de: ${title}`);
      } catch (error) {
        console.error(`Error procesando ${link}:`, error.message);
      }
    }

    return results;
  } catch (error) {
    console.error('Error accediendo a la página principal:', error.message);
    return [];
  }
};

//! Ruta para iniciar el scraping
app.get('/', async (req, res) => {
  const data = await scrapeData();
  res.json(data);
});

//! Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
