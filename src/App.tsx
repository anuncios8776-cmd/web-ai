import React, { useState, useEffect } from 'react';

interface Minijuego {
  tipo: string;
  contexto_escenario: string;
  pregunta: string;
  opciones: string[];
  respuesta_correcta: string;
  explicacion: string;
}

interface Libro {
  titulo: string;
  autor: string;
  por_que_leerlo: string;
}

interface TemaData {
  titulo: string;
  resumen_conceptual: string;
  libros_recomendados: Libro[];
  minijuego: Minijuego;
}

export default function App() {
  const [temaInput, setTemaInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [datosActuales, setDatosActuales] = useState<TemaData | null>(null);
  const [historial, setHistorial] = useState<TemaData[]>([]);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string | null>(null);
  const [resultadoMinijuego, setResultadoMinijuego] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar historial al iniciar
  useEffect(() => {
    fetch('/api/index')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setHistorial(data);
      })
      .catch((err) => console.error('Error cargando historial:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!temaInput.trim()) return;

    setCargando(true);
    setError(null);
    setOpcionSeleccionada(null);
    setResultadoMinijuego(null);

    try {
      const response = await fetch('/api/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: temaInput }),
      });

      const textoRespuesta = await response.text();
      let resultado;

      try {
        resultado = JSON.parse(textoRespuesta);
      } catch {
        throw new Error(`Respuesta no válida del servidor: ${textoRespuesta.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(resultado.error || 'Error al procesar la solicitud');
      }

      setDatosActuales(resultado);
      setHistorial((prev) => [resultado, ...prev]);
      setTemaInput('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const verificarRespuesta = (opcion: string) => {
    setOpcionSeleccionada(opcion);
    if (!datosActuales) return;

    if (opcion.trim().toLowerCase() === datosActuales.minijuego.respuesta_correcta.trim().toLowerCase()) {
      setResultadoMinijuego('¡Correcto! Has dominado el escenario.');
    } else {
      setResultadoMinijuego('Incorrecto. Inténtalo de nuevo o revisa la explicación.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
      <h1>🧠 Mentor IA & Minijuegos</h1>
      <p>Introduce un tema que quieras aprender y la IA generará una guía con recomendación de libros y un minijuego interactivo.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={temaInput}
          onChange={(e) => setTemaInput(e.target.value)}
          placeholder="Ej. Ciberseguridad, Redes Neuraes, Historia..."
          style={{ flex: 1, padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
          disabled={cargando}
        />
        <button type="submit" disabled={cargando} style={{ padding: '10px 20px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {cargando ? 'Generando...' : 'Crear Aprendizaje'}
        </button>
      </form>

      {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>}

      {datosActuales && (
        <div style={{ background: '#f9f9f9', border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
          <h2>{datosActuales.titulo}</h2>
          <h3>Resumen Conceptual</h3>
          <p>{datosActuales.resumen_conceptual}</p>

          <h3>📚 Libros Recomendados</h3>
          <ul>
            {datosActuales.libros_recomendados?.map((libro, index) => (
              <li key={index} style={{ marginBottom: '10px' }}>
                <strong>{libro.titulo}</strong> por <em>{libro.autor}</em> <br />
                <small>{libro.por_que_leerlo}</small>
              </li>
            ))}
          </ul>

          <h3>🎮 Minijuego Interactivo</h3>
          <div style={{ background: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #ddd' }}>
            <p><strong>Escenario:</strong> {datosActuales.minijuego.contexto_escenario}</p>
            <p><strong>Pregunta:</strong> {datosActuales.minijuego.pregunta}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              {datosActuales.minijuego.opciones?.map((opcion, idx) => (
                <button
                  key={idx}
                  onClick={() => verificarRespuesta(opcion)}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    background: opcionSeleccionada === opcion ? '#e3f2fd' : '#fff',
                    border: '1px solid #90caf9',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {opcion}
                </button>
              ))}
            </div>
            {resultadoMinijuego && (
              <div style={{ marginTop: '15px', padding: '10px', background: resultadoMinijuego.includes('Correcto') ? '#e8f5e9' : '#ffebee', borderRadius: '4px' }}>
                <p><strong>{resultadoMinijuego}</strong></p>
                <p><small>{datosActuales.minijuego.explicacion}</small></p>
              </div>
            )}
          </div>
        </div>
      )}

      {historial.length > 0 && (
        <div>
          <h3>Historial de Temas Generados</h3>
          <ul>
            {historial.map((item, idx) => (
              <li key={idx} style={{ cursor: 'pointer', color: '#0070f3', marginBottom: '5px' }} onClick={() => setDatosActuales(item)}>
                {item.titulo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
