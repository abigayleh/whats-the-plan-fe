import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

function ProfileMenu({ onClose }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  return (
    <>
      <div className="profile-menu__backdrop" onClick={onClose} />
      <div className="profile-menu" onClick={(e) => e.stopPropagation()}>
        <Link to="/profile" className="button button--ghost" onClick={onClose}>
          Profile settings
        </Link>
        <button type="button" className="button button--ghost" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </>
  );
}

export default ProfileMenu;
