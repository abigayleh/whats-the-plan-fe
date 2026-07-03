import { useContext } from 'react';
import AppContext from '../store/AppContext';

export default function useAppData() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppData must be used within an AppProvider');
  return ctx;
}
