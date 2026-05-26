import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  Download,
  FolderOpen,
  Loader2,
} from 'lucide-react';
import api from '../../api/axios';
import { resolveUploadUrl } from '../../utils/media';
import toast from 'react-hot-toast';
import { formatDateIN } from '../../utils/format';

const CATEGORIES = [
  { value: 'prescription', label: 'Prescription' },
  { value: 'scan', label: 'Scan / X-Ray / MRI' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'surgery_record', label: 'Surgery Record' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
];

const categoryLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label || v;

const PatientUploadCenter = ({ onUploaded }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [category, setCategory] = useState('prescription');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);

  const loadDocs = useCallback(async () => {
    try {
      const { data } = await api.get('/patient-documents/my');
      setDocuments(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Could not load your uploaded records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const uploadFile = async (selectedFile) => {
    if (!selectedFile) return;
    const form = new FormData();
    form.append('document', selectedFile);
    form.append('category', category);
    if (title.trim()) form.append('title', title.trim());

    setUploading(true);
    setProgress(0);
    try {
      await api.post('/patient-documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      toast.success('Your medical record was uploaded safely');
      setFile(null);
      setTitle('');
      await loadDocs();
      onUploaded?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed — try PDF or image under 15MB');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      if (!title) setTitle(dropped.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this document from your health vault?')) return;
    try {
      await api.delete(`/patient-documents/${id}`);
      toast.success('Document removed');
      await loadDocs();
      onUploaded?.();
    } catch {
      toast.error('Could not delete document');
    }
  };

  const isImage = (mime) => mime?.startsWith('image/');

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-5 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Your Medical History Vault</h3>
            <p className="text-blue-100 text-sm mt-0.5">
              Upload past prescriptions, lab reports, scans & discharge papers — your doctor can
              view them during care.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Document type</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-premium w-full"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2024 blood test report"
              className="input-premium w-full"
            />
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragOver
              ? 'border-cyan-500 bg-cyan-50/50'
              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/50'
          }`}
        >
          <Upload className="w-10 h-10 text-blue-500 mx-auto mb-3" />
          <p className="font-semibold text-slate-800">Drag & drop your file here</p>
          <p className="text-sm text-slate-500 mt-1">PDF, JPG, PNG — up to 15 MB</p>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
                }
              }}
            />
            Choose file
          </label>
          {file && (
            <p className="mt-3 text-sm text-slate-600 flex items-center justify-center gap-2">
              {file.type?.startsWith('image/') ? (
                <ImageIcon className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {file.name}
            </p>
          )}
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Uploading securely… {progress}%
            </p>
          </div>
        )}

        <button
          type="button"
          disabled={!file || uploading}
          onClick={() => uploadFile(file)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/25 transition"
        >
          {uploading ? 'Uploading…' : 'Save to my health vault'}
        </button>

        <div>
          <h4 className="text-sm font-bold text-slate-800 mb-3">Your uploaded records</h4>
          {loading ? (
            <div className="animate-pulse h-24 bg-slate-100 rounded-xl" />
          ) : documents.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No uploads yet. Add your existing medical papers so your care team has the full
              picture.
            </p>
          ) : (
            <ul className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              <AnimatePresence>
                {documents.map((doc) => (
                  <motion.li
                    key={doc._id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group"
                  >
                    <div className="shrink-0 w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                      {isImage(doc.mimeType) ? (
                        <img
                          src={resolveUploadUrl(doc.fileUrl)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{doc.title}</p>
                      <p className="text-xs text-slate-500">
                        {categoryLabel(doc.category)} · {formatDateIN(doc.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <a
                        href={resolveUploadUrl(doc.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                        title="Download / view"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc._id)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default PatientUploadCenter;
