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
      const { tema, accion_usuario, estado_actual, historial, simulacion } = req.body;
      
      const apiKey = process.env.GROQ_API_KEY; 
      
      if (!apiKey) {
        return res.status(500).json({ error: 'Falta configurar la llave GROQ_API_KEY en las variables de entorno de Vercel.' });
      }

      let promptSistema = "";
      let promptUsuario = "";

      if (!accion_usuario) {
        // Prompt 1: Creador del mundo de la simulación
        promptSistema = "Eres el DISEÑADOR de una simulación educativa interactiva. Tu trabajo NO es crear un cuestionario, examen ni minijuego basado en preguntas, sino diseñar el MUNDO de una simulación práctica en la que el usuario pueda aprender haciendo. Devuelve ÚNICAMENTE JSON válido sin markdown, sin bloques de código y sin texto extra.";
        
        promptUsuario = `El usuario quiere aprender mediante la práctica el siguiente tema:
"${tema || 'Ciberseguridad'}"

Diseña el mundo completo utilizando exactamente la siguiente estructura JSON:
{
  "titulo": "",
  "tema": "",
  "resumen_conceptual": "",
  "objetivos_aprendizaje": [""],
  "nivel": "principiante",
  "rol_usuario": "",
  "tipo_simulacion": "",
  "descripcion_mundo": "",
  "objetivo_final": "",
  "reglas_mundo": [""],
  "variables": [
    {
      "id": "",
      "nombre": "",
      "tipo": "number|string|boolean",
      "valor_inicial": "",
      "descripcion": ""
    }
  ],
  "elementos": [
    {
      "id": "",
      "nombre": "",
      "tipo": "",
      "descripcion": "",
      "estado_inicial": ""
    }
  ],
  "personajes": [
    {
      "id": "",
      "nombre": "",
      "rol": "",
      "personalidad": "",
      "comportamiento": ""
    }
  ],
  "conceptos": [
    {
      "id": "",
      "nombre": "",
      "explicacion": "",
      "momento_aprendizaje": ""
    }
  ],
  "progresion": [
    {
      "nivel": 1,
      "titulo": "",
      "descripcion": "",
      "objetivo": "",
      "conceptos": []
    }
  ],
  "estado_inicial": {
    "narracion": "",
    "situacion": "",
    "objetivo_inmediato": "",
    "acciones_posibles": [
      {
        "id": "",
        "nombre": "",
        "descripcion": "",
        "tipo": ""
      }
    ]
  },
  "criterios_finalizacion": [""],
  "resumen_final": {
    "conceptos": [],
    "habilidades": []
  }
}`;
      } else {
        // Prompt 2: Director del mundo (procesa la acción del usuario)
        promptSistema = "Eres el MOTOR DE UNA SIMULACIÓN EDUCATIVA INTERACTIVA. Actúa como el DIRECTOR DEL MUNDO. No eres un profesor que hace preguntas ni un examinador. Tu trabajo es observar la acción del usuario, actualizar el mundo, mostrar consecuencias reales y continuar la simulación. Devuelve ÚNICAMENTE JSON válido sin markdown, sin bloques de código y sin texto extra.";
        
        promptUsuario = `CONFIGURACIÓN DEL MUNDO:
${JSON.stringify(simulacion || {})}

ESTADO ACTUAL:
${JSON.stringify(estado_actual || {})}

HISTORIAL DE LA SIMULACIÓN:
${JSON.stringify(historial || [])}

ACCIÓN DEL USUARIO:
${accion_usuario}

Devuelve el resultado actualizado utilizando exactamente esta estructura JSON:
{
  "resultado": {
    "narracion": "",
    "evento": "",
    "estado_situacion": ""
  },
  "cambios_estado": [
    {
      "variable": "",
      "valor_anterior": "",
      "valor_nuevo": "",
      "motivo": ""
    }
  ],
  "cambios_elementos": [
    {
      "elemento_id": "",
      "cambio": ""
    }
  ],
  "reacciones_personajes": [
    {
      "personaje_id": "",
      "reaccion": ""
    }
  ],
  "ensenanza": {
    "mostrar": true,
    "concepto_id": "",
    "titulo": "",
    "explicacion": ""
  },
  "siguiente_situacion": {
    "descripcion": "",
    "objetivo": "",
    "acciones_sugeridas": [
      {
        "id": "",
        "nombre": "",
        "descripcion": "",
        "tipo": ""
      }
    ],
    "permite_entrada_libre": true
  },
  "progreso": {
    "nivel_actual": 1,
    "avance": 0,
    "objetivo_completado": false,
    "simulacion_terminada": false
  },
  "evaluacion": {
    "habilidad_demostrada": "",
    "errores_cometidos": [],
    "conceptos_aplicados": []
  }
}`;
      }

      // --- LLAMADA A GROQ (Agente Creador o Director) ---
      const responseGroq = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: promptSistema },
            { role: "user", content: promptUsuario }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7
        })
      });

      if (!responseGroq.ok) {
        const errorData = await responseGroq.text();
        throw new Error(`Error en el motor de simulación de Groq: ${errorData}`);
      }

      const dataGroq = await responseGroq.json();
      let textoRespuesta = dataGroq.choices[0].message.content.trim();
      textoRespuesta = textoRespuesta.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const datosGenerados = JSON.parse(textoRespuesta);
      
      if (!accion_usuario) {
        repositorioGlobal.unshift(datosGenerados);
      }

      return res.status(200).json(datosGenerados);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al procesar la simulación: ' + error.message });
    }
  }

  res.status(404).json({ error: 'Ruta no encontrada' });
}
