import {
  useState, useEffect, useCallback, useRef,
} from 'react';
import * as pollsApi from '../api/polls';
import { adaptPoll } from '../api/adapters';
import useSocketEvents from './useSocketEvents';

const EVENTS = ['poll:created', 'poll:vote', 'poll:deleted'];

// Polls are only listed per group, so they're gathered across the user's groups and
// sorted newest-first. Broadcasts omit the viewer's own vote, so changes refetch instead.
export default function usePolls(groups) {
  const [polls, setPolls] = useState([]);
  const groupKey = groups.map((g) => g.id).join(',');
  const latest = useRef(0);

  const refetch = useCallback(async () => {
    // A vote refetches twice (own response + its own broadcast echo), so results are
    // ticketed: a slower earlier fetch must never overwrite a newer one.
    const ticket = latest.current + 1;
    latest.current = ticket;
    const ids = groupKey ? groupKey.split(',') : [];
    if (!ids.length) {
      setPolls([]);
      return;
    }
    try {
      const perGroup = await Promise.all(ids.map((id) => pollsApi.listForGroup(id).catch(() => [])));
      if (ticket !== latest.current) return;
      setPolls(perGroup.flat().map(adaptPoll).sort((a, b) => b.createdAt - a.createdAt));
    } catch {
      // ignore — a failed refresh leaves the last known polls in place
    }
  }, [groupKey]);

  useEffect(() => { refetch(); }, [refetch]);
  useSocketEvents(EVENTS, refetch);

  return { polls, refetch };
}
