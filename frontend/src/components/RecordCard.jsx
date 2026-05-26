import { FileText, Calendar } from 'lucide-react';
import { resolveUploadUrl } from '../utils/media';

const RecordCard = ({ record }) => {
  const date = new Date(record.dateOfVisit || record.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const doctorName = record.doctor?.user?.name;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3 gap-2">
        <h4 className="font-bold text-slate-800">{record.diagnosis}</h4>
        <span className="text-xs text-slate-500 font-medium flex items-center bg-slate-50 px-2 py-1 rounded-md shrink-0">
          <Calendar className="w-3 h-3 mr-1" />
          {date}
        </span>
      </div>

      {doctorName && (
        <p className="text-xs text-slate-500 mb-2">Attending: Dr. {doctorName}</p>
      )}

      {record.symptoms?.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {record.symptoms.map((sym, idx) => (
            <span
              key={idx}
              className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md capitalize"
            >
              {sym}
            </span>
          ))}
        </div>
      )}

      {record.doctorNotes && (
        <p className="text-sm text-slate-600 line-clamp-3 mb-4">{record.doctorNotes}</p>
      )}

      {record.labReports?.length > 0 && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          {record.labReports.map((report, idx) => {
            const url = resolveUploadUrl(report.reportUrl);
            if (!url) return null;
            return (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
              >
                <FileText className="w-4 h-4 mr-1.5 shrink-0" />
                {report.testName || 'View Document'}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecordCard;
