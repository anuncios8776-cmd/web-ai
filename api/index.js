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

      // Token de Hugging Face (puedes crear uno gratis en huggingface.co/settings/tokens)
      const apiKey = process.env.HUGGINGFACE_API_KEY; 
      
      if (!apiKey) {
        return res.status(500).json({ error: 'Falta configurar la llave HUGGINGFACE_API_KEY en las variables de entorno de Vercel.' });
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

      // Usamos un modelo gratuito y potente de Hugging Face
      const responseAI = await fetch('https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-72B-Instruct",
          messages: [
            { role: "system", content: "Eres un generador de contenidos educativos. Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni marcas markdown." },
            { role: "user", content: prompt }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      });

      if (!responseAI.ok) {
        const errorData = await responseAI.text();
        throw new Error(`Error de Hugging Face: ${errorData}`);
      }

      const dataAI = await responseAI.json();
      let textoRespuesta = dataAI.choices[0].message.content.trim();
      
      // Limpiar marcas de código si el modelo llega a incluirlas
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
