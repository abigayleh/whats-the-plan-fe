import { CloseIcon, FolderIcon, PlusIcon } from '../layout/icons';

function AttachmentUploader({ attachments, onChange, max = 5 }) {
  function handleFilesSelected(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const remaining = max - attachments.length;
    if (remaining <= 0 || files.length === 0) return;

    const added = files.slice(0, remaining).map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      mimeType: file.type,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    onChange([...attachments, ...added]);
  }

  function handleRemove(id) {
    const target = attachments.find((a) => a.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    onChange(attachments.filter((a) => a.id !== id));
  }

  return (
    <div className="attachment-uploader">
      <div className="attachment-uploader__grid">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="attachment-uploader__item">
            {attachment.previewUrl ? (
              <img src={attachment.previewUrl} alt={attachment.name} className="attachment-uploader__thumb" />
            ) : (
              <div className="attachment-uploader__file">
                <FolderIcon />
                <span className="attachment-uploader__filename">{attachment.name}</span>
              </div>
            )}
            <button
              type="button"
              className="attachment-uploader__remove"
              onClick={() => handleRemove(attachment.id)}
              aria-label={`Remove ${attachment.name}`}
            >
              <CloseIcon width={12} height={12} />
            </button>
          </div>
        ))}

        {attachments.length < max && (
          <label className="attachment-uploader__add">
            <PlusIcon width={16} height={16} />
            <input type="file" multiple onChange={handleFilesSelected} />
          </label>
        )}
      </div>
      <p className="attachment-uploader__count">{attachments.length}/{max} attached</p>
    </div>
  );
}

export default AttachmentUploader;
