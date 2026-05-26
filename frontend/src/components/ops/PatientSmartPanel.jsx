import { FileText, Pill, AlertCircle } from 'lucide-react';
import { resolveUploadUrl } from '../../utils/media';

const PatientSmartPanel = ({ patient, documents = [], children }) => {
  if (!patient) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500 text-sm">
        Select a patient from the queue
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b bg-gradient-to-r from-slate-50 to-blue-50">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Active patient</p>
        <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
        <p className="font-mono text-blue-700 font-semibold">{patient.patientId}</p>
        {patient.visit?.tokenNumber && (
          <p className="text-sm text-slate-600 mt-1">Token {patient.visit.tokenNumber}</p>
        )}
      </div>

      <div className="p-5 grid grid-cols-2 gap-3 text-sm">
        {patient.bloodGroup && (
          <div>
            <p className="text-slate-500 text-xs">Blood</p>
            <p className="font-semibold">{patient.bloodGroup}</p>
          </div>
        )}
        {patient.age && (
          <div>
            <p className="text-slate-500 text-xs">Age</p>
            <p className="font-semibold">{patient.age}</p>
          </div>
        )}
        {patient.visit?.vitals?.bp && (
          <div className="col-span-2">
            <p className="text-slate-500 text-xs">Vitals</p>
            <p className="font-semibold">
              BP {patient.visit.vitals.bp}
              {patient.visit.vitals.pulse ? ` · ${patient.visit.vitals.pulse} bpm` : ''}
              {patient.visit.vitals.spo2 ? ` · SpO₂ ${patient.visit.vitals.spo2}` : ''}
            </p>
          </div>
        )}
      </div>

      {patient.allergies?.length > 0 && (
        <div className="px-5 pb-3 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Allergies:</strong> {patient.allergies.join(', ')}
          </span>
        </div>
      )}

      {patient.ongoingMedications?.length > 0 && (
        <div className="px-5 pb-3 flex items-start gap-2 text-sm text-slate-700">
          <Pill className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{patient.ongoingMedications.join(', ')}</span>
        </div>
      )}

      {documents.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
            <FileText className="w-3 h-3" /> Uploaded files
          </p>
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {documents.slice(0, 8).map((d) => (
              <li key={d._id}>
                <a
                  href={resolveUploadUrl(d.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  {d.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {children && <div className="p-5 border-t bg-slate-50/50">{children}</div>}
    </div>
  );
};

export default PatientSmartPanel;
