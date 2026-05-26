import { useState, useEffect } from 'react';
import { FileText, Download, FolderOpen } from 'lucide-react';
import api from '../../api/axios';
import { resolveUploadUrl } from '../../utils/media';
import { formatDateIN } from '../../utils/format';

const categoryLabel = (v) =>
  ({
    prescription: 'Prescription',
    scan: 'Scan',
    lab_report: 'Lab Report',
    surgery_record: 'Surgery',
    discharge_summary: 'Discharge',
    insurance: 'Insurance',
    other: 'Other',
  }[v] || v);

const PatientDocumentsList = ({ patientId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId?.trim()) {
      setDocuments([]);
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/patient-documents/patient/${patientId.trim()}`);
        setDocuments(Array.isArray(data) ? data : []);
      } catch {
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  if (!patientId?.trim()) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
        <FolderOpen className="w-5 h-5 text-cyan-600" />
        Patient-uploaded records
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Documents the patient added from past visits — review before treatment.
      </p>
      {loading ? (
        <div className="animate-pulse h-20 bg-slate-100 rounded-xl" />
      ) : documents.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center bg-slate-50 rounded-xl border border-dashed">
          No patient uploads yet for this ID.
        </p>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {documents.map((doc) => (
            <li
              key={doc._id}
              className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{doc.title}</p>
                  <p className="text-xs text-slate-500">
                    {categoryLabel(doc.category)} · {formatDateIN(doc.createdAt)}
                  </p>
                </div>
              </div>
              <a
                href={resolveUploadUrl(doc.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="View / download"
              >
                <Download className="w-4 h-4" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PatientDocumentsList;
