import { useState, useEffect, useRef } from 'react';
import { CloseIcon, FolderIcon, PlusIcon } from '../layout/icons';
import * as attachmentsApi from '../../api/attachments';

// Both limits mirror the API, so an over-limit pick fails here instead of on upload.
const MAX_PER_TYPE = 5; // 5 photos + 5 files per task
const MAX_BYTES = 10 * 1024 * 1024;
const isImage = (attachment) => (attachment.mimeType || '').startsWith('image/');

// Already-uploaded files sit behind Bearer auth, so their previews are fetched as blobs.
function useStoredPreviews(attachments) {
  const [urls, setUrls] = useState({});
  const requested = useRef(new Set());
  const created = useRef([]);
  const unmounted = useRef(false);

  useEffect(() => {
    attachments
      .filter((a) => a.existing && isImage(a) && !requested.current.has(a.id))
      .forEach((a) => {
        requested.current.add(a.id);
        attachmentsApi.objectUrl(a.id)
          .then((url) => {
            // A preview that resolves after unmount still owns a blob, so revoke it here.
            if (unmounted.current) {
              URL.revokeObjectURL(url);
              return;
            }
            created.current.push(url);
            setUrls((prev) => ({ ...prev, [a.id]: url }));
          })
          .catch(() => requested.current.delete(a.id));
      });
  }, [attachments]);

  useEffect(() => () => {
    unmounted.current = true;
    created.current.forEach(URL.revokeObjectURL);
  }, []);

  return urls;
}

function AttachmentUploader({ attachments, onChange }) {
  const storedUrls = useStoredPreviews(attachments);
  const [notice, setNotice] = useState(null);
  const photos = attachments.filter(isImage);
  const files = attachments.filter((a) => !isImage(a));

  function handleFilesSelected(e) {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (selected.length === 0) return;

    const tooBig = selected.filter((f) => f.size > MAX_BYTES);
    setNotice(tooBig.length ? `Skipped (over 10 MB): ${tooBig.map((f) => f.name).join(', ')}` : null);

    // Photos and files fill separate quotas, so count each as it's added.
    let photoRoom = MAX_PER_TYPE - photos.length;
    let fileRoom = MAX_PER_TYPE - files.length;
    const added = [];
    selected.filter((f) => f.size <= MAX_BYTES).forEach((file) => {
      const image = file.type.startsWith('image/');
      if (image ? photoRoom <= 0 : fileRoom <= 0) return;
      if (image) photoRoom -= 1;
      else fileRoom -= 1;
      added.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        mimeType: file.type,
        previewUrl: image ? URL.createObjectURL(file) : null,
      });
    });
    if (added.length) onChange([...attachments, ...added]);
  }

  function handleRemove(id) {
    const target = attachments.find((a) => a.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    onChange(attachments.filter((a) => a.id !== id));
  }

  const full = photos.length >= MAX_PER_TYPE && files.length >= MAX_PER_TYPE;

  return (
    <div className="attachment-uploader">
      <div className="attachment-uploader__attachment-grid">
        {attachments.map((attachment) => {
          const preview = attachment.previewUrl || storedUrls[attachment.id];
          return (
            <div key={attachment.id} className="attachment-uploader__attachment">
              {preview ? (
                <img
                  src={preview}
                  alt={attachment.name}
                  className="attachment-uploader__thumbnail-image"
                />
              ) : (
                <div className="attachment-uploader__file-preview">
                  <FolderIcon />
                  <span className="attachment-uploader__filename">{attachment.name}</span>
                </div>
              )}
              <button
                type="button"
                className="attachment-uploader__remove-button"
                onClick={() => handleRemove(attachment.id)}
                aria-label={`Remove ${attachment.name}`}
              >
                <CloseIcon width={12} height={12} />
              </button>
            </div>
          );
        })}

        {!full && (
          <label className="attachment-uploader__add-attachment-button">
            <PlusIcon width={16} height={16} />
            <input type="file" multiple onChange={handleFilesSelected} />
          </label>
        )}
      </div>
      <p className="attachment-uploader__count-label">
        {photos.length}/{MAX_PER_TYPE} photos · {files.length}/{MAX_PER_TYPE} files
      </p>
      {notice && <p className="modal__hint">{notice}</p>}
    </div>
  );
}

export default AttachmentUploader;
