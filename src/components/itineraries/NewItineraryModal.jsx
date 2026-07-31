import { useState } from 'react';
import Modal from '../common/Modal';
import IconOptions from '../common/IconOptions';
import PillPicker from '../common/PillPicker';
import { scopeOptions } from '../../utils/scope';
import { SCHEDULE_OPTIONS, clampDayCount } from '../../constants/itinerary';
import { toDateInputValue } from '../../utils/tasks';

// Create an itinerary. Scope (personal or a group) is chosen here; a trip is either dated
// or "to be planned" with just an expected number of days.
function NewItineraryModal({
  groups, personalSpace, onClose, onCreate,
}) {
  const today = toDateInputValue(new Date());
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState(null);
  const [icon, setIcon] = useState(null);
  const [schedule, setSchedule] = useState('dates');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [dayCount, setDayCount] = useState('1');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (schedule === 'dates' && endDate < startDate) {
      setError('End date must be on or after the start date');
      return;
    }
    const when = schedule === 'dates'
      ? { startDate, endDate }
      : { dayCount: clampDayCount(dayCount) };
    setSaving(true);
    try {
      await onCreate({
        title: title.trim() || 'Untitled trip', groupId, icon, ...when,
      });
    } catch (err) {
      setError(err.message || 'Could not create itinerary');
      setSaving(false);
    }
  }

  return (
    <Modal title="New Itinerary" onClose={onClose} variant="full">
      <form className="modal__form" onSubmit={handleSubmit}>
        {error && <p className="auth-card__error">{error}</p>}

        <label className="modal__field">
          <span className="modal__label">Title</span>
          <input
            type="text"
            className="modal__input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Barcelona Trip"
            autoFocus
          />
        </label>

        <div className="modal__field">
          <span className="modal__label">Scope</span>
          <PillPicker
            options={scopeOptions(personalSpace, groups)}
            value={groupId}
            onChange={setGroupId}
            ariaLabel="Scope"
          />
        </div>

        <div className="modal__field">
          <span className="modal__label">Icon</span>
          <IconOptions icon={icon} onSelect={setIcon} />
        </div>

        <div className="modal__field">
          <span className="modal__label">When</span>
          <PillPicker options={SCHEDULE_OPTIONS} value={schedule} onChange={setSchedule} ariaLabel="When" />
        </div>

        {schedule === 'dates' ? (
          <div className="modal__field modal__field--row">
            <label className="modal__field">
              <span className="modal__label">Start date</span>
              <input
                type="date"
                className="modal__input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label className="modal__field">
              <span className="modal__label">End date</span>
              <input
                type="date"
                className="modal__input"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
          </div>
        ) : (
          <label className="modal__field">
            <span className="modal__label">Expected length (days)</span>
            <input
              type="number"
              className="modal__input"
              min="1"
              value={dayCount}
              onChange={(e) => setDayCount(e.target.value)}
            />
          </label>
        )}

        <div className="modal__footer">
          <div className="modal__footer-spacer" />
          <button type="button" className="button button--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default NewItineraryModal;
