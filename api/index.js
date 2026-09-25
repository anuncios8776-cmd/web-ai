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

      const apiKey = process.env.GROQ_API_KEY; 
      
      if (!apiKey) {
        return res.status(500).json({ error: 'Falta configurar la llave GROQ_API_KEY en las variables de entorno de Vercel.' });
      }

      // Prompt mejorado para exigir una simulación teórica y práctica avanzada
      const promptInicial = `Genera un plan de aprendizaje estructurado y avanzado sobre el tema: "${tema}". 
      El minijuego debe ser una SIMULACIÓN TÉCNICA/PRÁCTICA inmersiva (no una simple pregunta aislada).
      Debe tener este formato exacto de objeto JSON (sin markdown extra ni bloques de código, solo el JSON puro):
      {
        "titulo": "Título del tema",
        "resumen_conceptual": "Resumen claro y profundo...",
        "libros_recomendados": [{"titulo": "...", "autor": "...", "por_que_leerlo": "..."}],
        "minijuego": {
          "tipo": "simulacion_tecnica",
          "rol_usuario": "Ej: Eres un ingeniero de sistemas / analista...",
          "contexto_escenario": "Descripción detallada de la situación o problema técnico a resolver...",
          "reto": "¿Qué acción técnica o decisión debes tomar para resolver el caso?",
          "opciones": [
            "Opción A detallada...",
            "Opción B detallada...",
            "Opción C detallada..."
          ],
          "respuesta_correcta": "Copia exacta del texto de la opción correcta",
          "consecuencia_exito": "Qué sucede a nivel técnico al tomar la decisión correcta...",
          "explicacion_teorica": "Fundamento teórico detallado del por qué esta es la solución correcta..."
        }
      }`;

      // --- PASO 1: IA 1 (El Creador - gpt-oss-120b) diseña la simulación ---
      const responseCreador = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: "Eres un experto diseñador instruccional y simuladores técnicos. Responde ÚNICAMENTE en JSON válido." },
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

      // --- PASO 2: IA 2 (El Validador - qwen/qwen3.8-27b) verifica la coherencia de la simulación ---
      const promptValidacion = `Revisa el siguiente JSON educativo y de simulación sobre "${tema}". Asegúrate de que el escenario sea realista, que la respuesta correcta sea técnicamente impecable y que coincida de forma exacta con una de las opciones del array. Devuelve el JSON final limpio y estructurado:
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
            { role: "system", content: "Eres un validador estricto de simulaciones técnicas. Devuelve estrictamente el objeto JSON corregido y validado, sin texto adicional." },
            { role: "user", content: promptValidacion }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3
        })
      });

      const dataFinal = responseValidador.ok ? await responseValidador.json() : dataCreador;
      let textoRespuesta = dataFinal.choices[0].message.content.trim();
      
      textoRespuesta = textoRespuesta.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const datosGenerados = JSON.parse(textoRespuesta);
      repositorioGlobal.unshift(datosGenerados);

      return res.status(200).json(datosGenerados);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al procesar la simulación: ' + error.message });
    }
  }

  res.status(404).json({ error: 'Ruta no encontrada' });
}
