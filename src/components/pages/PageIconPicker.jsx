import { PagesIcon } from '../layout/icons';
import IconPicker from '../common/IconPicker';

// A page's icon picker: the shared IconPicker with the paper-page default and page wording.
function PageIconPicker({ icon, onChange, disabled }) {
  return (
    <IconPicker
      icon={icon}
      onChange={onChange}
      disabled={disabled}
      FallbackIcon={PagesIcon}
      ariaLabel="Change page icon"
    />
  );
}

export default PageIconPicker;