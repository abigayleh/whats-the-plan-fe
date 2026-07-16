import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon } from '../components/layout/icons';
import useAuth from '../hooks/useAuth';
import * as usersApi from '../api/users';
import { setTokens } from '../api/client';
import DeleteAccountModal from '../components/profile/DeleteAccountModal';

function ProfilePage() {
  const { user, updateUser, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user.name);
  const [nameBusy, setNameBusy] = useState(false);
  const [nameError, setNameError] = useState(null);
  const [nameSaved, setNameSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  async function handleNameSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Name cannot be empty');
      return;
    }
    setNameError(null);
    setNameSaved(false);
    setNameBusy(true);
    try {
      const { user: updated } = await usersApi.updateName(trimmed);
      updateUser(updated);
      setNameSaved(true);
    } catch (err) {
      setNameError(err.message || 'Could not update name');
    } finally {
      setNameBusy(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    setPasswordError(null);
    setPasswordSaved(false);
    setPasswordBusy(true);
    try {
      const result = await usersApi.changePassword(currentPassword, newPassword);
      if (result?.accessToken) setTokens(result);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err.code === 'INVALID_PASSWORD' ? 'Current password is incorrect' : (err.message || 'Could not update password'));
    } finally {
      setPasswordBusy(false);
    }
  }

  async function handleDeleteConfirm() {
    await usersApi.deleteAccount();
    deleteAccount();
    navigate('/login');
  }

  return (
    <section className="page">
      <div className="page__header">
        <span className="page__badge page__badge--primary"><UserIcon /></span>
        <h1 className="page__title">Profile</h1>
      </div>

      <div className="page__card">
        <h2 className="group-settings__section-title">Display name</h2>
        <form className="modal__form" onSubmit={handleNameSubmit}>
          {nameError && <p className="auth-card__error">{nameError}</p>}
          <label className="modal__field">
            <span className="modal__label">Name</span>
            <input
              className="modal__input"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameSaved(false); }}
            />
          </label>
          <div className="modal__footer">
            <div className="modal__footer-spacer" />
            {nameSaved && !nameBusy && <span className="modal__hint">Saved</span>}
            <button type="submit" className="button button--primary" disabled={nameBusy}>
              {nameBusy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      <div className="page__card">
        <h2 className="group-settings__section-title">Change password</h2>
        <form className="modal__form" onSubmit={handlePasswordSubmit}>
          {passwordError && <p className="auth-card__error">{passwordError}</p>}
          <label className="modal__field">
            <span className="modal__label">Current password</span>
            <input
              type="password"
              className="modal__input"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setPasswordSaved(false); }}
            />
          </label>
          <label className="modal__field">
            <span className="modal__label">New password</span>
            <input
              type="password"
              className="modal__input"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordSaved(false); }}
            />
          </label>
          <label className="modal__field">
            <span className="modal__label">Confirm new password</span>
            <input
              type="password"
              className="modal__input"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordSaved(false); }}
            />
          </label>
          <div className="modal__footer">
            <div className="modal__footer-spacer" />
            {passwordSaved && !passwordBusy && <span className="modal__hint">Password updated</span>}
            <button type="submit" className="button button--primary" disabled={passwordBusy}>
              {passwordBusy ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>

      <div className="page__card">
        <h2 className="group-settings__section-title">Delete account</h2>
        <p className="group-settings__warning-text">
          Permanently delete your account and all personal data. This cannot be undone.
        </p>
        <button type="button" className="button button--danger" onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </button>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          email={user.email}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </section>
  );
}

export default ProfilePage;
