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

      const promptInicial = `Genera una experiencia de aprendizaje interactiva basada en el tema: "${tema}".

OBJETIVO PRINCIPAL:
No debes crear un cuestionario, examen, lista de preguntas ni un minijuego basado en seleccionar respuestas correctas.
Debes crear una SIMULACIÓN PRÁCTICA E INTERACTIVA en la que el usuario asuma un rol dentro de un escenario relacionado directamente con "${tema}".
La experiencia debe sentirse como un videojuego/simulador educativo (con contexto, estado inicial, personajes, recursos, etapas y acciones que modifican el estado).

Devuelve ÚNICAMENTE un objeto JSON válido (sin markdown, sin bloques de código, sin texto extra) con esta estructura exacta:
{
  "titulo": "Título atractivo de la experiencia",
  "resumen_conceptual": "Explicación clara y profunda de los conceptos fundamentales que el usuario aprenderá.",
  "objetivos_aprendizaje": [
    "Objetivo práctico 1",
    "Objetivo práctico 2",
    "Objetivo práctico 3",
    "Objetivo práctico 4"
  ],
  "nivel": "principiante",
  "duracion_estimada": "10-15 minutos",
  "libros_recomendados": [
    {
      "titulo": "Título",
      "autor": "Autor",
      "por_que_leerlo": "Motivo relacionado directamente con el aprendizaje."
    }
  ],
  "minijuego": {
    "tipo": "simulacion_practica",
    "rol_usuario": "Rol que asume el usuario dentro de la experiencia.",
    "introduccion": "Narración inicial que coloca al usuario dentro del escenario.",
    "objetivo_final": "Qué debe conseguir el usuario para completar la simulación.",
    "estado_inicial": {
      "descripcion": "Estado inicial del escenario.",
      "recursos": ["Recurso 1"],
      "variables": [
        {
          "nombre": "Variable",
          "valor_inicial": "Valor",
          "descripcion": "Qué representa."
        }
      ]
    },
    "personajes": [
      {
        "nombre": "Nombre",
        "rol": "Rol",
        "descripcion": "Descripción",
        "comportamiento": "Comportamiento"
      }
    ],
    "conceptos_clave": [
      {
        "concepto": "Concepto",
        "explicacion": "Explicación",
        "momento_para_ensenarlo": "Momento"
      }
    ],
    "etapas": [
      {
        "id": 1,
        "titulo": "Nombre de la etapa",
        "contexto": "Qué está ocurriendo.",
        "objetivo": "Objetivo de la etapa.",
        "estado": {
          "descripcion": "Estado actual.",
          "variables": [{"nombre": "Var", "valor": "Val"}]
        },
        "acciones_sugeridas": [
          {
            "id": "accion_1",
            "texto": "Acción sugerida 1.",
            "tipo": "decision",
            "consecuencia_si_se_ejecuta": "Consecuencia.",
            "concepto_ensenado": "Concepto"
          },
          {
            "id": "accion_2",
            "texto": "Acción sugerida 2.",
            "tipo": "decision",
            "consecuencia_si_se_ejecuta": "Consecuencia.",
            "concepto_ensenado": "Concepto"
          }
        ],
        "acciones_libres": true,
        "respuesta_a_accion": {
          "exito": "Qué ocurre si acierta.",
          "error": "Qué ocurre si falla.",
          "explicacion": "Explicación teórica."
        },
        "evento_siguiente": "Siguiente cambio."
      }
    ],
    "evento_final": {
      "descripcion": "Situación final.",
      "condicion_exito": "Condición de éxito.",
      "consecuencia": "Consecuencia final."
    },
    "evaluacion_final": {
      "tipo": "evaluacion_practica",
      "criterios": ["Criterio 1"],
      "conceptos_dominados": ["Concepto 1"],
      "errores_posibles": [
        {
          "error": "Error",
          "por_que_ocurre": "Motivo",
          "como_mejorarlo": "Mejora"
        }
      ]
    }
  }
}`;

      // --- AGENTE 1: Creador (gpt-oss-120b) ---
      const responseCreador = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: "Eres un diseñador experto de simulaciones interactivas por etapas. Cero cuestionarios. Responde únicamente en JSON válido." },
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

      // --- AGENTE 2: Validador (qwen/qwen3.8-27b) ---
      const responseValidador = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b",
          messages: [
            { role: "system", content: "Validador estricto de estructuras de simulación. Asegúrate de que el JSON sea impecable y devuélvelo limpio." },
            { role: "user", content: `Revisa y valida este JSON:\n${contenidoCreador}` }
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
