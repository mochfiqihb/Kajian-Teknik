import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Types ---

interface MaterialItem {
  component: string;
  specification: string;
  quantity: string;
  estimatedCost: string;
}

interface EstimationResult {
  refinedSummary: string;
  complexityLevel: string;
  billOfMaterials: MaterialItem[];
  totalEstimatedBudget: string;
  safetyNotes: string[];
}

// --- Components ---

const BlueprintBackground = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
    backgroundColor: '#0f172a',
    backgroundImage: `
      linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
  }} />
);

const InputField = ({ label, value, onChange, placeholder, multiline = false }: any) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <label style={{ 
      display: 'block', 
      color: '#94a3b8', 
      marginBottom: '0.5rem', 
      fontSize: '0.9rem',
      fontFamily: '"Fira Code", monospace',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    }}>
      {label}
    </label>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '4px',
          color: '#e2e8f0',
          minHeight: '100px',
          fontFamily: 'inherit',
          fontSize: '1rem',
          outline: 'none',
          resize: 'vertical'
        }}
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '4px',
          color: '#e2e8f0',
          fontFamily: 'inherit',
          fontSize: '1rem',
          outline: 'none'
        }}
      />
    )}
  </div>
);

const App = () => {
  const [formData, setFormData] = useState({
    name: '',
    function: '',
    description: '',
    budget: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!formData.name || !formData.description) {
      setError("Mohon isi setidaknya Nama dan Deskripsi alat.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const prompt = `
        Saya membutuhkan estimasi biaya dan material yang mendetail untuk membuat mesin atau alat kustom.
        
        Nama Proyek: ${formData.name}
        Fungsi Utama: ${formData.function}
        Deskripsi: ${formData.description}
        Anggaran/Batasan: ${formData.budget || "Tidak ditentukan"}

        Bertindaklah sebagai insinyur mekanik ahli dan inspektur keselamatan. 
        Pecah proyek ini menjadi Daftar Material (Bill of Materials/BOM).
        
        INSTRUKSI KRITIS:
        1. Gunakan Bahasa Indonesia.
        2. Estimasi biaya dalam Rupiah (IDR). Hitung harga pasar rata-rata di Indonesia, lalu TAMBAHKAN MARGIN 35% pada setiap harga komponen dan total anggaran (markup) untuk mengantisipasi fluktuasi harga dan biaya tak terduga.
        3. JANGAN berikan rencana fabrikasi atau langkah-langkah pembuatan.
        4. Berikan catatan keselamatan yang EKSTENSIF dan MENDETAIL, termasuk:
           - Alat Pelindung Diri (APD) yang wajib.
           - Bahaya Listrik/Mekanik spesifik.
           - Peringatan operasional.
           - Persyaratan perawatan kritis untuk keselamatan.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refinedSummary: { type: Type.STRING, description: "Ringkasan teknis tentang apa yang akan dibuat dalam Bahasa Indonesia." },
              complexityLevel: { type: Type.STRING, description: "Rendah, Sedang, atau Tinggi" },
              billOfMaterials: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    component: { type: Type.STRING, description: "Nama komponen dalam Bahasa Indonesia" },
                    specification: { type: Type.STRING, description: "Spesifikasi, jenis material, atau dimensi" },
                    quantity: { type: Type.STRING },
                    estimatedCost: { type: Type.STRING, description: "Biaya (termasuk margin 35%) dalam format Rp X.XXX.XXX" }
                  }
                }
              },
              totalEstimatedBudget: { type: Type.STRING, description: "Total biaya (termasuk margin 35%) dalam format Rp X.XXX.XXX" },
              safetyNotes: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Daftar komprehensif peringatan keselamatan, bahaya, APD, dan catatan kritis dalam Bahasa Indonesia."
              }
            }
          }
        }
      });

      if (response.text) {
        const parsedResult = JSON.parse(response.text) as EstimationResult;
        setResult(parsedResult);
      } else {
        throw new Error("Tidak ada data yang diterima dari model.");
      }

    } catch (err: any) {
      console.error(err);
      setError("Terjadi kesalahan saat membuat estimasi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      fontFamily: '"Inter", sans-serif',
      color: '#e2e8f0',
      minHeight: '100vh',
      padding: '2rem',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      <BlueprintBackground />
      
      <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <header style={{ marginBottom: '3rem', textAlign: 'center', borderBottom: '1px solid #334155', paddingBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            margin: '0 0 0.5rem 0', 
            color: '#38bdf8',
            fontFamily: '"Fira Code", monospace',
            textTransform: 'uppercase'
          }}>
            Kajian Teknis
          </h1>
          <p style={{ color: '#94a3b8' }}>
            Masukkan ide Anda. Dapatkan rencana material dan estimasi biaya mendetail.
          </p>
        </header>

        <div style={{
          backgroundColor: '#1e293b',
          padding: '2rem',
          borderRadius: '8px',
          border: '1px solid #334155',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
        }}>
          <InputField 
            label="Nama Mesin / Alat" 
            value={formData.name} 
            onChange={(v: string) => setFormData({...formData, name: v})}
            placeholder="Contoh: Sistem Hidroponik Otomatis"
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             <InputField 
              label="Fungsi Utama" 
              value={formData.function} 
              onChange={(v: string) => setFormData({...formData, function: v})}
              placeholder="Contoh: Monitor pH dan pompa nutrisi"
            />
            <InputField 
              label="Anggaran / Batasan (Opsional)" 
              value={formData.budget} 
              onChange={(v: string) => setFormData({...formData, budget: v})}
              placeholder="Contoh: Di bawah Rp 2.000.000"
            />
          </div>

          <InputField 
            label="Deskripsi & Spesifikasi" 
            value={formData.description} 
            onChange={(v: string) => setFormData({...formData, description: v})}
            placeholder="Jelaskan cara kerjanya, batasan ukuran, material yang disukai, dll."
            multiline={true}
          />

          {error && (
            <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '4px', marginBottom: '1.5rem', border: '1px solid #ef4444' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: loading ? '#334155' : '#38bdf8',
              color: loading ? '#94a3b8' : '#0f172a',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontFamily: '"Fira Code", monospace',
              textTransform: 'uppercase'
            }}
          >
            {loading ? 'Menganalisis Bahaya & Material...' : 'Hitung Estimasi'}
          </button>
        </div>

        {result && (
          <div style={{ marginTop: '3rem', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1rem',
              borderLeft: '4px solid #38bdf8',
              paddingLeft: '1rem'
            }}>
              <div>
                <h2 style={{ margin: 0, color: '#f8fafc' }}>Laporan Estimasi</h2>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Kompleksitas: <strong style={{ color: '#38bdf8' }}>{result.complexityLevel}</strong></span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Total Est.</div>
                <div style={{ fontSize: '2rem', color: '#38bdf8', fontWeight: 'bold', fontFamily: '"Fira Code", monospace' }}>
                  {result.totalEstimatedBudget}
                </div>
              </div>
            </div>

            <p style={{ color: '#cbd5e1', lineHeight: '1.6', marginBottom: '2rem', backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '4px' }}>
              {result.refinedSummary}
            </p>

            <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#94a3b8', fontFamily: '"Fira Code", monospace' }}>
              DAFTAR MATERIAL (BOM)
            </h3>
            <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f172a', textAlign: 'left' }}>
                    <th style={{ padding: '12px', border: '1px solid #334155', color: '#38bdf8' }}>Komponen</th>
                    <th style={{ padding: '12px', border: '1px solid #334155', color: '#38bdf8' }}>Spesifikasi</th>
                  </tr>
                </thead>
                <tbody>
                  {result.billOfMaterials.map((item, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#1e293b' : '#172033' }}>
                      <td style={{ padding: '12px', border: '1px solid #334155', color: '#f8fafc' }}>{item.component}</td>
                      <td style={{ padding: '12px', border: '1px solid #334155', color: '#e2e8f0' }}>{item.specification}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '2rem', backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '4px', border: '1px solid rgba(252, 165, 165, 0.2)' }}>
              <h3 style={{ 
                borderBottom: '1px solid rgba(252, 165, 165, 0.3)', 
                paddingBottom: '0.5rem', 
                marginBottom: '1rem', 
                color: '#fca5a5', 
                fontFamily: '"Fira Code", monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>⚠️</span> PROTOKOL KESELAMATAN, BAHAYA & CATATAN KRITIS
              </h3>
              <ul style={{ paddingLeft: '1.5rem', color: '#fca5a5', lineHeight: '1.7', fontSize: '1rem', margin: 0 }}>
                {result.safetyNotes.map((note, i) => (
                  <li key={i} style={{ marginBottom: '0.8rem' }}>{note}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
              <button
                onClick={() => {
                  const text = `Halo, saya ingin konsultasi mengenai kajian teknis ini:\n\n*Nama Proyek:* ${formData.name}\n*Total Estimasi:* ${result.totalEstimatedBudget}\n\n*Ringkasan:* ${result.refinedSummary}\n\nMohon informasi lebih lanjut.`;
                  window.open(`https://wa.me/6281339381191?text=${encodeURIComponent(text)}`, '_blank');
                }}
                style={{
                  backgroundColor: '#25D366',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '16px 32px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  fontFamily: '"Fira Code", monospace',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#22c55e'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#25D366'}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Konsultasi Sekarang
              </button>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&family=Inter:wght@400;600&display=swap');
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);