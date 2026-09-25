import React, { useState, useEffect } from 'react';

interface MinijuegoSimulacion {
  tipo: string;
  rol_usuario: string;
  contexto_escenario: string;
  reto: string;
  opciones: string[];
  respuesta_correcta: string;
  consecuencia_exito: string;
  explicacion_teorica: string;
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
  minijuego: MinijuegoSimulacion;
}

export default function App() {
  const [temaInput, setTemaInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [datosActuales, setDatosActuales] = useState<TemaData | null>(null);
  const [historial, setHistorial] = useState<TemaData[]>([]);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string | null>(null);
  const [resultadoSimulacion, setResultadoSimulacion] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setResultadoSimulacion(null);

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

  const verificarDecision = (opcion: string) => {
    setOpcionSeleccionada(opcion);
    if (!datosActuales) return;

    const esCorrecta = opcion.trim().toLowerCase() === datosActuales.minijuego.respuesta_correcta.trim().toLowerCase();
    setResultadoSimulacion(esCorrecta);
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
      <h1>🚀 Simulador Técnico & Mentor IA</h1>
      <p>Introduce cualquier área o tecnología que quieras dominar. Las IA duales generarán una simulación práctica basada en retos reales.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={temaInput}
          onChange={(e) => setTemaInput(e.target.value)}
          placeholder="Ej. Auditoría de Redes, Arquitectura Microservicios..."
          style={{ flex: 1, padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }}
          disabled={cargando}
        />
        <button type="submit" disabled={cargando} style={{ padding: '12px 24px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          {cargando ? 'Generando simulación...' : 'Iniciar Simulación'}
        </button>
      </form>

      {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>{error}</div>}

      {datosActuales && (
        <div style={{ background: '#fdfdfd', border: '1px solid #e0e0e0', padding: '25px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#111', marginTop: 0 }}>{datosActuales.titulo}</h2>
          
          <h3>💡 Resumen Conceptual</h3>
          <p style={{ lineHeight: '1.6' }}>{datosActuales.resumen_conceptual}</p>

          <h3>📚 Lecturas Recomendadas</h3>
          <ul style={{ paddingLeft: '20px' }}>
            {datosActuales.libros_recomendados?.map((libro, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>
                <strong>{libro.titulo}</strong> — <em>{libro.autor}</em> <br />
                <small style={{ color: '#555' }}>{libro.por_que_leerlo}</small>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: '30px', padding: '20px', background: '#f0f4f8', borderRadius: '8px', border: '1px solid #d0e1fd' }}>
            <h3 style={{ marginTop: 0, color: '#0056b3' }}>⚙️ Simulación Práctica de Escenario</h3>
            <p><strong>Tu Rol:</strong> {datosActuales.minijuego.rol_usuario}</p>
            <p><strong>Contexto:</strong> {datosActuales.minijuego.contexto_escenario}</p>
            <p style={{ fontWeight: 'bold', color: '#333' }}>Reto: {datosActuales.minijuego.reto}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
              {datosActuales.minijuego.opciones?.map((opcion, idx) => {
                let estiloBoton = { padding: '12px 15px', textAlign: 'left' as const, background: '#fff', border: '1px solid #b0c4de', borderRadius: '6px', cursor: 'pointer', fontSize: '15px' };
                if (opcionSeleccionada === opcion) {
                  estiloBoton.background = opcion === datosActuales.minijuego.respuesta_correcta ? '#d4edda' : '#f8d7da';
                  estiloBoton.border = opcion === datosActuales.minijuego.respuesta_correcta ? '1px solid #28a745' : '1px solid #dc3545';
                }

                return (
                  <button key={idx} onClick={() => verificarDecision(opcion)} style={estiloBoton}>
                    {opcion}
                  </button>
                );
              })}
            </div>

            {resultadoSimulacion !== null && (
              <div style={{ marginTop: '20px', padding: '15px', background: resultadoSimulacion ? '#d4edda' : '#f8d7da', borderRadius: '6px', border: resultadoSimulacion ? '1px solid #c3e6cb' : '1px solid #f5c6cb' }}>
                <h4 style={{ margin: '0 0 5px 0', color: resultadoSimulacion ? '#155724' : '#721c24' }}>
                  {resultadoSimulacion ? '✅ ¡Decisión Exitosa!' : '❌ ¡Error en la Decisión!'}
                </h4>
                <p style={{ margin: '5px 0' }}><strong>Consecuencia:</strong> {datosActuales.minijuego.consecuencia_exito}</p>
                <p style={{ margin: '5px 0 0 0' }}><strong>Fundamento Teórico:</strong> <small>{datosActuales.minijuego.explicacion_teorica}</small></p>
              </div>
            )}
          </div>
        </div>
      )}

      {historial.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h3>📂 Historial de Simulaciones</h3>
          <ul style={{ paddingLeft: '20px' }}>
            {historial.map((item, idx) => (
              <li key={idx} style={{ cursor: 'pointer', color: '#0070f3', marginBottom: '8px' }} onClick={() => setDatosActuales(item)}>
                {item.titulo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
