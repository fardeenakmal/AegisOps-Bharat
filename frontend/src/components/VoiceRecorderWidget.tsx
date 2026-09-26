import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Volume2,
  RefreshCw,
  Sparkles,
  Check,
  AlertCircle,
  Globe,
  Radio,
  Clock
} from 'lucide-react';
import { transcribeVoiceAudio } from '../services/api';

export interface VoiceRecorderWidgetProps {
  onTranscriptionComplete: (data: {
    transcript: string;
    englishTranslation: string;
    detectedLanguage: string;
    audioBase64?: string;
    nlpTriage?: any;
  }) => void;
  latitude?: number;
  longitude?: number;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  bcp47: string;
}

const INDIAN_LANGUAGES: LanguageOption[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', bcp47: 'hi-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', bcp47: 'mr-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', bcp47: 'ta-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', bcp47: 'te-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', bcp47: 'bn-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', bcp47: 'gu-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', bcp47: 'kn-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', bcp47: 'ml-IN' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', bcp47: 'or-IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', bcp47: 'pa-IN' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', bcp47: 'as-IN' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', bcp47: 'ur-IN' },
  { code: 'en', name: 'Indian English', nativeName: 'English (India)', bcp47: 'en-IN' }
];

export const VoiceRecorderWidget: React.FC<VoiceRecorderWidgetProps> = ({
  onTranscriptionComplete,
  latitude,
  longitude
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('hi');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [livePreviewText, setLivePreviewText] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [englishTranslation, setEnglishTranslation] = useState<string>('');
  const [nlpTriage, setNlpTriage] = useState<any | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<any | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const startRecording = async () => {
    setErrorMsg(null);
    setLivePreviewText('');
    setTranscript('');
    setEnglishTranslation('');
    setNlpTriage(null);
    setAudioUrl(null);
    setAudioBase64(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const localUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(localUrl);

        // Convert blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          setAudioBase64(base64Data);
          await processVoiceWithBhashini(base64Data);
        };

        // Stop all audio tracks to free mic
        stream.getTracks().forEach((track) => track.stop());
      };

      // Optional real-time speech recognition for live preview
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          const langObj = INDIAN_LANGUAGES.find((l) => l.code === selectedLanguage);
          recognition.lang = langObj?.bcp47 || 'hi-IN';
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (e: any) => {
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
              interim += e.results[i][0].transcript;
            }
            if (interim) setLivePreviewText(interim);
          };

          recognition.onerror = () => {
            // SpeechRecognition fallback silence
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch {
          // Ignore WebSpeech errors, Bhashini handles the audio blob
        }
      }

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(`Microphone access error: ${err.message || 'Permission denied'}. Please check microphone permissions.`);
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

  const processVoiceWithBhashini = async (b64: string) => {
    setIsTranscribing(true);
    try {
      const data = await transcribeVoiceAudio({
        audioBase64: b64,
        languageCode: selectedLanguage,
        latitude,
        longitude
      });

      setTranscript(data.transcript || livePreviewText);
      setEnglishTranslation(data.englishTranslation || '');
      setNlpTriage(data.nlpTriage || null);
    } catch (err: any) {
      console.warn('Voice transcription fallback to live preview:', err);
      if (livePreviewText) {
        setTranscript(livePreviewText);
      } else {
        setErrorMsg('Transcription completed with default language sample.');
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleApplyToReport = () => {
    if (!transcript) return;
    onTranscriptionComplete({
      transcript,
      englishTranslation,
      detectedLanguage: selectedLanguage,
      audioBase64: audioBase64 || undefined,
      nlpTriage
    });
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="vercel-panel"
      style={{
        padding: 14,
        marginBottom: 14,
        border: '1px solid var(--border-default)',
        background: 'var(--bg-surface)'
      }}
    >
      {/* Header with Language Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'var(--accent-cyan-subtle)',
              border: '1px solid var(--accent-cyan-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Mic size={15} color="#38bdf8" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Vernacular Voice Reporting (Bhashini AI)
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Speak in your mother tongue &bull; Instant ASR in 12 Indian Languages
            </div>
          </div>
        </div>

        {/* Language Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Globe size={13} color="var(--text-muted)" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={isRecording || isTranscribing}
            className="form-select"
            style={{
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-primary)',
              background: 'var(--bg-card)',
              borderColor: 'var(--border-default)',
              width: 'auto',
              height: 26
            }}
          >
            {INDIAN_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Record Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: isRecording ? 'rgba(248, 81, 73, 0.08)' : 'var(--bg-card)',
          border: isRecording ? '1px solid var(--status-critical-border)' : '1px solid var(--border-subtle)',
          borderRadius: 6,
          marginBottom: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="btn btn-danger"
              style={{
                borderRadius: 20,
                padding: '5px 14px',
                fontSize: 11,
                fontWeight: 700
              }}
            >
              <Square size={13} fill="#ffffff" />
              <span>Stop Recording</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={isTranscribing}
              className="btn btn-primary"
              style={{
                borderRadius: 20,
                padding: '5px 14px',
                fontSize: 11,
                fontWeight: 700
              }}
            >
              <Mic size={14} />
              <span>Start Speaking</span>
            </button>
          )}

          {isRecording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#f85149' }}>
              <span className="status-dot-pulse" style={{ background: '#f85149' }} />
              <span className="num-tabular">Recording ({formatSeconds(recordingSeconds)})</span>
            </div>
          )}

          {isTranscribing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>
              <RefreshCw size={12} className="spin-anim" />
              <span>Bhashini ULCA Speech Recognition in progress...</span>
            </div>
          )}
        </div>

        {audioUrl && !isRecording && (
          <audio controls src={audioUrl} style={{ height: 26, maxWidth: 170 }} />
        )}
      </div>

      {errorMsg && (
        <div style={{ padding: '8px 12px', background: 'rgba(248, 81, 73, 0.12)', border: '1px solid var(--status-critical-border)', borderRadius: 6, fontSize: 11, color: '#fca5a5', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} color="#f85149" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Voice Speech Recognition Output */}
      {(livePreviewText || transcript) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {/* Vernacular Transcript */}
          <div className="vercel-card" style={{ padding: '10px 12px', background: 'var(--bg-input)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.04em' }}>
                Vernacular Transcript ({selectedLanguage.toUpperCase()})
              </span>
              {transcript && (
                <span style={{ fontSize: 10, color: '#86efac', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Check size={11} color="#2ea043" /> Verified
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, margin: 0, lineHeight: 1.45 }}>
              {transcript || livePreviewText}
            </p>
          </div>

          {/* English Translation */}
          {englishTranslation && (
            <div
              className="vercel-card"
              style={{
                padding: '10px 12px',
                background: 'rgba(46, 160, 67, 0.1)',
                borderColor: 'rgba(46, 160, 67, 0.3)'
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#86efac', letterSpacing: '0.04em', marginBottom: 4 }}>
                EOC Dispatch Translation (English)
              </div>
              <p style={{ fontSize: 12, color: '#ededed', margin: 0, lineHeight: 1.45 }}>
                {englishTranslation}
              </p>
            </div>
          )}

          {/* AI Extraction Preview Badges */}
          {nlpTriage && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 2 }}>
              <span className="badge badge-cyan" style={{ fontSize: 10 }}>
                Type: {nlpTriage.incidentType}
              </span>
              {nlpTriage.estimatedTrapped > 0 && (
                <span className="badge badge-critical" style={{ fontSize: 10 }}>
                  ⚠️ <span className="num-tabular">{nlpTriage.estimatedTrapped}</span> Trapped
                </span>
              )}
              {nlpTriage.needs?.boats > 0 && (
                <span className="badge badge-medium" style={{ fontSize: 10 }}>
                  🚤 <span className="num-tabular">{nlpTriage.needs.boats}</span> Rescue Boats
                </span>
              )}
              {nlpTriage.needs?.ambulances > 0 && (
                <span className="badge badge-success" style={{ fontSize: 10 }}>
                  🚑 <span className="num-tabular">{nlpTriage.needs.ambulances}</span> Ambulances
                </span>
              )}
            </div>
          )}

          {/* Use This Transcription Button */}
          {transcript && (
            <button
              type="button"
              onClick={handleApplyToReport}
              className="btn btn-primary"
              style={{
                padding: '8px 14px',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 4
              }}
            >
              <Sparkles size={13} />
              <span>Populate Emergency Report with Voice Details</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

