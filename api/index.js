// Almacén temporal en memoria para el catálogo global
let repositorioGlobal = [];

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method } = req;

  // GET /api/index
  if (method === 'GET') {
    return res.status(200).json(repositorioGlobal);
  }

  // POST /api/index
  if (method === 'POST') {
    try {
      const { tema } = req.body;
      if (!tema) {
        return res.status(400).json({ error: 'Falta el parámetro "tema"' });
      }

      // Puedes cambiar la URL y el modelo según el proveedor que quieras usar (ej. DeepSeek u OpenAI)
      // Si usas DeepSeek, el endpoint suele ser 'https://api.deepseek.com/v1/chat/completions' o similar
      const apiKey = process.env.AI_API_KEY; // O usa process.env.DEEPSEEK_API_KEY
      
      if (!apiKey) {
        return res.status(500).json({ error: 'Falta configurar la llave de la IA en las variables de entorno.' });
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

      // Llamada estándar mediante fetch a una API compatible (como DeepSeek u OpenAI)
      const responseAI = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat", // Modelo oficial de DeepSeek
          messages: [
            { role: "system", content: "Eres un generador de contenidos educativos y técnicos experto. Responde ÚNICAMENTE con un objeto JSON válido, sin bloques de código markdown ni texto adicional." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }, // Forzar formato JSON en DeepSeek
          stream: false
        })
      });

      if (!responseAI.ok) {
        const errorData = await responseAI.text();
        throw new Error(`Error del proveedor de IA: ${errorData}`);
      }

      const dataAI = await responseAI.json();
      let textoRespuesta = dataAI.choices[0].message.content.trim();
      
      // Limpiar marcas de código si las hubiera
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
