import { useEffect, useRef, useState } from 'react';
import * as itinerariesApi from '../../api/itineraries';
import RichTextEditor from '../common/RichTextEditor';

// One shared TipTap notes doc per itinerary. Content is fetched here (the list omits it)
// and autosaved without a refresh, so the editor keeps its cursor — same as Pages.
function ItineraryNotes({ itinerary, editable }) {
  const [content, setContent] = useState(undefined); // undefined = loading
  const [status, setStatus] = useState('');
  const timer = useRef();

  useEffect(() => {
    setContent(undefined);
    let active = true;
    itinerariesApi.get(itinerary.id)
      .then((it) => { if (active) setContent(it.content ?? null); })
      .catch(() => { if (active) setContent(null); });
    return () => { active = false; };
  }, [itinerary.id]);

  function handleChange(json) {
    if (!editable) return;
    setStatus('Saving…');
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await itinerariesApi.update(itinerary.id, { content: json });
        setStatus('Saved');
      } catch {
        setStatus('Save failed');
      }
    }, 600);
  }

  if (content === undefined) return <p className="itinerary-detail__placeholder">Loading notes…</p>;

  return (
    <div className="itinerary-notes">
      <RichTextEditor key={itinerary.id} content={content} editable={editable} onChange={handleChange} />
      {status && <p className="itinerary-notes__status">{status}</p>}
    </div>
  );
}

export default ItineraryNotes;