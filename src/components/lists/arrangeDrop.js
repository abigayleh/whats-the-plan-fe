import { arrayMove } from '@dnd-kit/sortable';

// Flattens the resulting tree into the arrangement payload the API/store expect.
function buildPayload(loose, folders, childMap) {
  const lists = [
    ...loose.map((l, i) => ({ listId: l.id, folderId: null, position: i })),
    ...folders.flatMap((f) => (childMap.get(f.id) || []).map((l, i) => ({ listId: l.id, folderId: f.id, position: i }))),
  ];
  return { lists, folders: folders.map((f, i) => ({ id: f.id, position: i })) };
}

// Resolves a drag drop into a full arrangement payload, or null for a no-op. Drag ids
// are prefixed (`list:`, `folder:`) and drop zones are `loose` / `foldzone:<id>`.
export function computeArrangement({
  activeId, overId, looseLists, folders, childrenByFolder,
}) {
  if (!overId || activeId === overId) return null;
  const loose = [...looseLists];
  const folderArr = [...folders];
  const childMap = new Map(folderArr.map((f) => [f.id, [...(childrenByFolder.get(f.id) || [])]]));

  // Folders only reorder among themselves.
  if (activeId.startsWith('folder:')) {
    if (!overId.startsWith('folder:')) return null;
    const from = folderArr.findIndex((f) => `folder:${f.id}` === activeId);
    const to = folderArr.findIndex((f) => `folder:${f.id}` === overId);
    if (from === -1 || to === -1) return null;
    return buildPayload(loose, arrayMove(folderArr, from, to), childMap);
  }

  if (!activeId.startsWith('list:')) return null;
  const listId = activeId.slice(5);
  const moved = [...loose, ...folderArr.flatMap((f) => childMap.get(f.id))].find((l) => l.id === listId);
  if (!moved) return null;

  // Remove from its source container first, so same-container indexes stay correct.
  const removeFrom = (arr) => {
    const i = arr.findIndex((l) => l.id === listId);
    if (i >= 0) arr.splice(i, 1);
  };
  if (moved.folderId) removeFrom(childMap.get(moved.folderId)); else removeFrom(loose);

  // Resolve the destination container and index from what we dropped over.
  let destArr;
  let destFolderId;
  let destIndex;
  if (overId === 'loose') {
    destArr = loose; destFolderId = null; destIndex = loose.length;
  } else if (overId.startsWith('foldzone:') || overId.startsWith('folder:')) {
    destFolderId = overId.slice(overId.indexOf(':') + 1);
    destArr = childMap.get(destFolderId);
    destIndex = destArr ? destArr.length : -1;
  } else if (overId.startsWith('list:')) {
    const overListId = overId.slice(5);
    if (loose.some((l) => l.id === overListId)) { destArr = loose; destFolderId = null; } else {
      destFolderId = folderArr.find((f) => childMap.get(f.id).some((l) => l.id === overListId))?.id ?? null;
      destArr = destFolderId ? childMap.get(destFolderId) : loose;
    }
    destIndex = destArr.findIndex((l) => l.id === overListId);
    if (destIndex === -1) destIndex = destArr.length;
  } else {
    return null;
  }
  if (!destArr) return null;

  destArr.splice(Math.min(destIndex, destArr.length), 0, { ...moved, folderId: destFolderId });
  return buildPayload(loose, folderArr, childMap);
}
