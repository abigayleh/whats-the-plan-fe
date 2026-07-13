import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppData from '../../hooks/useAppData';
import useAuth from '../../hooks/useAuth';

function ProfileMenu({ onClose }) {
  const { currentUser, updateCurrentUser } = useAppData();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email ?? '');
  const [password, setPassword] = useState(currentUser.password ?? '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  function handleSave(e) {
    e.preventDefault();
    updateCurrentUser({ name: name.trim() || currentUser.name, email: email.trim(), password });
    onClose();
  }

  return (
    <>
      <div className="profile-menu__backdrop" onClick={onClose} />
      <div className="profile-menu" onClick={(e) => e.stopPropagation()}>
        <form className="profile-menu__form" onSubmit={handleSave}>
          <label className="modal__field">
            <span className="modal__label">Name</span>
            <input className="modal__input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="modal__field">
            <span className="modal__label">Email</span>
            <input
              type="email"
              className="modal__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="modal__field">
            <span className="modal__label">Password</span>
            <input
              type="password"
              className="modal__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit" className="button button--primary">Save</button>
        </form>
        <button type="button" className="button button--ghost" onClick={handleLogout}>
          Log out
        </button>
        <button
          type="button"
          className="profile-menu__delete-button"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete Account
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Delete account?</h2>
            </div>
            <p className="group-settings__warning-text">
              This is a demo prototype — account deletion isn&apos;t wired up to anything yet.
            </p>
            <div className="modal__footer">
              <div className="modal__footer-spacer" />
              <button type="button" className="button button--ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="button button--danger" onClick={() => setShowDeleteConfirm(false)}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProfileMenu;
