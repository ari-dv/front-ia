import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000';

export default function FruitClassifier() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('predict');
  const [history, setHistory] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/stats`);
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = (file) => {
    if (file.type.startsWith('image/')) {
      setFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setError('Por favor selecciona un archivo de imagen válido');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handlePredict = async () => {
    if (!file) {
      setError('Por favor selecciona una imagen');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error en la predicción');
      }

      setResult(data);
      addToHistory(data);
      fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = (data) => {
    const newEntry = {
      id: Date.now(),
      fruit: data.prediction.fruit,
      confidence: data.prediction.confidence,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      image: preview,
    };
    setHistory([newEntry, ...history.slice(0, 4)]);
  };

  const downloadResults = () => {
    if (!result) return;
    const dataStr = JSON.stringify(result, null, 2);
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/json;charset=utf-8,' + encodeURIComponent(dataStr)
    );
    element.setAttribute('download', `prediccion-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadAsImage = () => {
    if (!result || !preview) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 500;
      canvas.height = 350;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(img, 15, 15, 150, 150);
      
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#1f2937';
      ctx.fillText('Clasificación:', 180, 50);
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 32px Arial';
      ctx.fillText(result.prediction.fruit, 180, 90);
      
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Confianza: ${(result.prediction.confidence * 100).toFixed(1)}%`, 180, 120);
      ctx.fillText(`Tiempo: ${result.processing_time}`, 180, 145);
      
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `resultado-${Date.now()}.png`;
      link.click();
    };
    
    img.src = preview;
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const resetImage = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-neutral">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="px-6 py-6">
            <h1 className="text-3xl font-bold text-gray-900">FruitAI Classifier</h1>
            <p className="text-gray-500 text-sm mt-1">Análisis inteligente de clasificación de frutas</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('predict')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'predict'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Clasificar
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Historial
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Estadísticas
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Predict Tab */}
          {activeTab === 'predict' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Section */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Cargar Imagen</h2>
                  
                  {!preview && (
                    <label className="cursor-pointer block w-full">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
                          dragActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-gray-50 hover:border-blue-400'
                        }`}
                      >
                        <div className="text-4xl mb-3 text-gray-400">▲</div>
                        <p className="text-gray-700 font-semibold text-lg mb-1">
                          Arrastra tu imagen aquí
                        </p>
                        <p className="text-gray-500 text-sm mb-4">O haz clic para seleccionar</p>
                        <p className="text-gray-400 text-xs">Formatos soportados: PNG, JPG, GIF, WEBP</p>
                      </div>
                    </label>
                  )}

                  {preview && (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <img
                          src={preview}
                          alt="Preview"
                          className="max-h-96 rounded-lg border border-gray-200 shadow-md"
                        />
                      </div>
                      <button
                        onClick={resetImage}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition"
                      >
                        Cambiar Imagen
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm font-medium">{error}</p>
                    </div>
                  )}
                </div>

                {/* Classify Button */}
                <button
                  onClick={handlePredict}
                  disabled={loading || !file}
                  className="w-full px-6 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  {loading ? 'Analizando...' : 'Clasificar Imagen'}
                </button>
              </div>

              {/* Results Sidebar */}
              {result && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-fit">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Resultado</h3>

                  <div className="space-y-6">
                    {/* Fruit Classification */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-gray-600 text-sm font-medium mb-2">Fruta Identificada</p>
                      <p className="text-3xl font-bold text-green-700">
                        {result.prediction.fruit}
                      </p>
                    </div>

                    {/* Confidence Bar */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-sm font-semibold text-gray-700">Nivel de Confianza</p>
                        <p className="text-sm font-bold text-green-600">
                          {(result.prediction.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all duration-500"
                          style={{
                            width: `${result.prediction.confidence * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Tiempo de Procesamiento</p>
                      <p className="text-lg font-mono font-bold text-gray-700">{result.processing_time}</p>
                    </div>

                    {/* Alternatives */}
                    {result.prediction.alternatives && result.prediction.alternatives.length > 0 && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Alternativas</p>
                        <div className="space-y-3">
                          {result.prediction.alternatives.map((alt, idx) => (
                            <div key={idx}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm text-gray-700">{alt.fruit}</span>
                                <span className="text-sm font-semibold text-gray-600">
                                  {(alt.confidence * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-orange-400 h-full rounded-full"
                                  style={{ width: `${alt.confidence * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Download Options */}
                    <div className="border-t pt-4 space-y-2">
                      <button
                        onClick={downloadResults}
                        className="w-full py-2 px-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
                      >
                        Descargar JSON
                      </button>
                      <button
                        onClick={downloadAsImage}
                        className="w-full py-2 px-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition text-sm"
                      >
                        Descargar Imagen
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Historial de Predicciones</h2>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition text-sm"
                  >
                    Limpiar Historial
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No hay predicciones aún</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {history.map((item) => (
                    <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.fruit}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <p className="font-bold text-gray-900 text-lg mb-2">{item.fruit}</p>
                        <p className="text-sm text-green-600 font-semibold mb-2">
                          {(item.confidence * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Estadísticas del Sistema</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <p className="text-gray-600 text-sm font-medium mb-2">Predicciones Totales</p>
                  <p className="text-4xl font-bold text-blue-600">{stats.total_predictions}</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <p className="text-gray-600 text-sm font-medium mb-2">Tiempo Activo</p>
                  <p className="text-2xl font-mono font-bold text-purple-600">{stats.uptime_formatted}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <p className="text-gray-600 text-sm font-medium mb-2">Fecha Inicio</p>
                  <p className="text-sm font-mono text-green-600">{stats.start_time.split('T')[0]}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <p className="text-gray-600 text-sm font-medium mb-2">Estado</p>
                  <p className="text-lg font-bold text-green-600">Activo</p>
                </div>

                {Object.entries(stats.predictions_by_class || {}).map(([fruit, count]) => (
                  <div key={fruit} className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <p className="text-gray-600 text-sm font-medium mb-2">{fruit}</p>
                    <p className="text-3xl font-bold text-orange-600">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}