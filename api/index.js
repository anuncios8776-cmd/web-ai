let repositorioGlobal = [];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method } = req;

  if (method === 'GET') {
    return res.status(200).json(repositorioGlobal);
  }

  if (method === 'POST') {
    try {
      const { tema } = req.body;
      if (!tema) {
        return res.status(400).json({ error: 'Falta el parámetro "tema"' });
      }

      const apiKey = process.env.HUGGINGFACE_API_KEY; 
      
      if (!apiKey) {
        return res.status(500).json({ error: 'Falta configurar la llave HUGGINGFACE_API_KEY en Vercel.' });
      }

      const prompt = `Genera un plan de aprendizaje estructurado en JSON estricto sobre el tema: "${tema}". 
      Debe tener este formato exacto de objeto JSON (sin markdown extra ni bloques de código, solo el JSON puro):
      {
        "titulo": "Título del tema",
        "resumen_conceptual": "Resumen claro...",
        "libros_recomendados": [{"titulo": "...", "autor": "...", "por_que_leerlo": "..."}],
        "minijuego": {
          "tipo": "simulador",
          "contexto_escenario": "...",
          "pregunta": "...",
          "opciones": ["a", "b", "c"],
          "respuesta_correcta": "...",
          "explicacion": "..."
        }
      }`;

      // Nueva URL oficial del router de Hugging Face
      const responseAI = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "meta-llama/Meta-Llama-3-8B-Instruct",
          messages: [
            { role: "system", content: "Eres un generador de contenidos educativos expertos. Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni marcas markdown." },
            { role: "user", content: prompt }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      });

      if (!responseAI.ok) {
        const errorData = await responseAI.text();
        throw new Error(`Error del enrutador: ${errorData}`);
      }

      const dataAI = await responseAI.json();
      let textoRespuesta = dataAI.choices[0].message.content.trim();
      
      textoRespuesta = textoRespuesta.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const datosGenerados = JSON.parse(textoRespuesta);
      repositorioGlobal.unshift(datosGenerados);

      return res.status(200).json(datosGenerados);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al procesar la solicitud: ' + error.message });
    }
  }

  res.status(404).json({ error: 'Ruta no encontrada' });
}
