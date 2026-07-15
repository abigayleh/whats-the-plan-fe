import { useState, useEffect } from 'react';
import * as groupsApi from '../api/groups';

// Members of a group, or none for personal scope. Only the group detail route returns them.
export default function useGroupMembers(groupId) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!groupId) {
      setMembers([]);
      return undefined;
    }
    let cancelled = false;
    groupsApi.get(groupId)
      .then((g) => !cancelled && setMembers(g.members || []))
      .catch(() => !cancelled && setMembers([]));
    return () => { cancelled = true; };
  }, [groupId]);

  return members;
}
