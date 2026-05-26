import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, Image as ImageIcon } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const SurgeryCapture = ({ patientId, onUploaded }) => {
  const webcamRef = useRef(null);
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('Surgery update');
  const [showCam, setShowCam] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadFiles = useCallback(
    async (files) => {
      if (!patientId || !files?.length) return;
      setUploading(true);
      const form = new FormData();
      Array.from(files).forEach((f) => form.append('images', f));
      form.append('patientId', patientId);
      form.append('title', title);
      form.append('caption', caption);
      try {
        await api.post('/surgery/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Surgery media uploaded');
        onUploaded?.();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [patientId, title, caption, onUploaded]
  );

  const capture = useCallback(async () => {
    const shot = webcamRef.current?.getScreenshot();
    if (!shot) return;
    const res = await fetch(shot);
    const blob = await res.blob();
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    await uploadFiles([file]);
  }, [uploadFiles]);

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5 space-y-4">
      <h4 className="text-white font-semibold flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-purple-400" /> Surgery & operation media
      </h4>
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white" placeholder="Title" />
      <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white" placeholder="Caption / procedure notes" />
      {showCam && (
        <div className="rounded-xl overflow-hidden border border-slate-600">
          <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full" />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setShowCam(!showCam)} className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-semibold">
          {showCam ? 'Hide camera' : 'Open camera'}
        </button>
        {showCam && (
          <button type="button" onClick={capture} disabled={uploading} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold">
            <Camera className="w-4 h-4" /> Capture
          </button>
        )}
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold cursor-pointer">
          <Upload className="w-4 h-4" /> Upload images
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
        </label>
      </div>
    </div>
  );
};

export default SurgeryCapture;
