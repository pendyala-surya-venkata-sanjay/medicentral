import { useState, useRef } from 'react';
import { Mic, Square, Upload } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const VoiceRecorder = ({ patientId, onUploaded }) => {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [blob, setBlob] = useState(null);
  const [title, setTitle] = useState('Clinical voice note');
  const [category, setCategory] = useState('general');
  const [uploading, setUploading] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const b = new Blob(chunksRef.current, { type: 'audio/webm' });
        setBlob(b);
        setAudioUrl(URL.createObjectURL(b));
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const upload = async () => {
    if (!blob || !patientId) {
      toast.error('Record audio and ensure patient is selected');
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append('audio', blob, `voice-${Date.now()}.webm`);
    form.append('patientId', patientId);
    form.append('title', title);
    form.append('category', category);
    form.append('durationSeconds', '0');
    try {
      await api.post('/voice/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Voice note uploaded');
      setBlob(null);
      setAudioUrl(null);
      onUploaded?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5 space-y-4">
      <h4 className="text-white font-semibold flex items-center gap-2">
        <Mic className="w-5 h-5 text-red-400" /> Voice notes
      </h4>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
        placeholder="Note title"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
      >
        <option value="general">General</option>
        <option value="surgery">Surgery narration</option>
        <option value="emergency">Emergency</option>
        <option value="progress">Progress update</option>
      </select>
      <div className="flex flex-wrap gap-2">
        {!recording ? (
          <button type="button" onClick={startRecording} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            <Mic className="w-4 h-4" /> Record
          </button>
        ) : (
          <button type="button" onClick={stopRecording} className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            <Square className="w-4 h-4" /> Stop
          </button>
        )}
        {audioUrl && (
          <audio src={audioUrl} controls className="max-w-full h-10" />
        )}
        <button
          type="button"
          disabled={!blob || uploading}
          onClick={upload}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          <Upload className="w-4 h-4" /> {uploading ? 'Uploading…' : 'Save to timeline'}
        </button>
      </div>
    </div>
  );
};

export default VoiceRecorder;
