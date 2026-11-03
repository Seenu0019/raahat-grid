import { statusBadgeClass } from '../utils/helpers';

export default function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <span className={`badge badge-${statusBadgeClass(status)}`}>
      {status}
    </span>
  );
}
