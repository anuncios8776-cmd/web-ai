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

  // GET /api/index (Historial)
  if (method === 'GET') {
    return res.status(200).json(repositorioGlobal);
  }

  // POST /api/index (Generación con doble IA colaborativa)
  if (method === 'POST') {
    try {
      const { tema } = req.body;
      if (!tema) {
        return res.status(400).json({ error: 'Falta el parámetro "tema"' });
      }

      const apiKey = process.env.GROQ_API_KEY; 
      
      if (!apiKey) {
        return res.status(500).json({ error: 'Falta configurar la llave GROQ_API_KEY en las variables de entorno de Vercel.' });
      }

      const promptInicial = `Genera un plan de aprendizaje estructurado sobre el tema: "${tema}". 
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

      // --- PASO 1: IA 1 (El Creador - gpt-oss-120b) genera la propuesta base ---
      const responseCreador = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: "Eres un generador experto de contenidos educativos. Responde ÚNICAMENTE en JSON válido." },
            { role: "user", content: promptInicial }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7
        })
      });

      if (!responseCreador.ok) {
        const errorData = await responseCreador.text();
        throw new Error(`Error en el Agente Creador: ${errorData}`);
      }

      const dataCreador = await responseCreador.json();
      const contenidoCreador = dataCreador.choices[0].message.content.trim();

      // --- PASO 2: IA 2 (El Validador - qwen/qwen3.8-27b) revisa, pule y garantiza la validez del JSON ---
      const promptValidacion = `Revisa el siguiente JSON educativo generado sobre "${tema}". Asegúrate de que las preguntas del minijuego tengan sentido lógico, que la respuesta correcta coincida exactamente con una de las opciones y devuelve el JSON final perfectamente estructurado y limpio:
      ${contenidoCreador}`;

      const responseValidador = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b",
          messages: [
            { role: "system", content: "Eres un validador estricto de calidad educativa. Devuelve estrictamente el objeto JSON corregido y validado, sin texto adicional." },
            { role: "user", content: promptValidacion }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3
        })
      });

      if (!responseValidador.ok) {
        // Si por algo fallara el validador, recurrimos directamente al contenido del creador
        console.warn("El validador no respondió, usando contenido base.");
      }

      const dataFinal = responseValidador.ok ? await responseValidador.json() : dataCreador;
      let textoRespuesta = dataFinal.choices[0].message.content.trim();
      
      // Limpiar marcas de código por seguridad
      textoRespuesta = textoRespuesta.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const datosGenerados = JSON.parse(textoRespuesta);
      repositorioGlobal.unshift(datosGenerados);

      return res.status(200).json(datosGenerados);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al procesar la solicitud con IA dual: ' + error.message });
    }
  }

  res.status(404).json({ error: 'Ruta no encontrada' });
}
