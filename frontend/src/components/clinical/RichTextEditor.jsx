/**
 * Stable clinical notes editor (ReactQuill is incompatible with React 19).
 */
const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Clinical notes, surgery updates, treatment plans…',
}) => (
  <div className="clinical-editor rounded-xl overflow-hidden border border-slate-200 bg-white">
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={5}
      className="w-full px-4 py-3 text-sm text-slate-800 resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
    />
  </div>
);

export default RichTextEditor;
