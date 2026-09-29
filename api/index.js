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

      // Prompt enfocado 100% en simulación y toma de decisiones (Cero preguntas)
      const promptInicial = `Genera un plan de aprendizaje sobre el tema: "${tema}". 
      ATENCIÓN: El minijuego NO debe ser una pregunta ni un cuestionario. Debe ser estrictamente una SIMULACIÓN PRÁCTICA de un problema real del tema.
      Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta (sin markdown ni texto extra):
      {
        "titulo": "Título del tema",
        "resumen_conceptual": "Resumen claro y profundo...",
        "libros_recomendados": [{"titulo": "...", "autor": "...", "por_que_leerlo": "..."}],
        "minijuego": {
          "tipo": "simulacion_practica",
          "rol_usuario": "Define claramente el rol profesional que asume el usuario (Ej: Ingeniero DevOps, Arquitecto de Software, Auditor de Seguridad...)",
          "contexto_escenario": "Descripción detallada de la situación crítica, incidente o reto técnico al que se enfrenta el usuario en este momento.",
          "reto": "La instrucción exacta de la decisión táctica que debe tomar para resolver el dilema.",
          "opciones": [
            "Acción técnica 1 a tomar...",
            "Acción técnica 2 a tomar...",
            "Acción técnica 3 a tomar..."
          ],
          "respuesta_correcta": "Copia exacta del texto de la opción que resuelve correctamente el problema técnico",
          "consecuencia_exito": "Explicación detallada de qué ocurre en el sistema/escenario al aplicar esta decisión correcta.",
          "explicacion_teorica": "Fundamento teórico y técnico de por qué esta era la estrategia adecuada."
        }
      }`;

      // --- PASO 1: IA 1 (El Creador - gpt-oss-120b) ---
      const responseCreador = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: "Eres un experto diseñador de simulaciones profesionales. Cero preguntas de opción múltiple; solo simulaciones de casos reales. Responde ÚNICAMENTE en JSON válido." },
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

      // --- PASO 2: IA 2 (El Validador - qwen/qwen3.8-27b) ---
      const promptValidacion = `Revisa esta simulación sobre "${tema}". Verifica que NO sea una pregunta, sino un caso de simulación con opciones de decisión técnica, y que la respuesta correcta coincida exactamente con una de las opciones. Devuelve el JSON puro corregido:
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
            { role: "system", content: "Eres un validador estricto. Asegúrate de que el formato sea una simulación basada en decisiones y devuelve solo el JSON." },
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
