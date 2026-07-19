import { ReactRenderer } from '@tiptap/react';
import SuggestionList from './SuggestionList';

// Builds a TipTap Suggestion render lifecycle backed by SuggestionList, positioned
// manually off the caret rect (no tippy/floating-ui dependency).
export default function suggestionRender(extraProps = {}) {
  let component = null;
  let el = null;

  const cleanup = () => {
    el?.remove();
    el = null;
    component?.destroy();
    component = null;
  };

  const place = (clientRect) => {
    const rect = clientRect?.();
    if (!rect || !el) return;
    el.style.left = `${rect.left}px`;
    el.style.top = `${rect.bottom + 4}px`;
  };

  return {
    onStart: (props) => {
      component = new ReactRenderer(SuggestionList, {
        props: { ...props, ...extraProps },
        editor: props.editor,
      });
      el = document.createElement('div');
      el.className = 'suggestion-popup';
      el.appendChild(component.element);
      document.body.appendChild(el);
      place(props.clientRect);
    },
    onUpdate: (props) => {
      component?.updateProps({ ...props, ...extraProps });
      place(props.clientRect);
    },
    onKeyDown: (props) => {
      if (props.event.key === 'Escape') { cleanup(); return true; }
      return component?.ref?.onKeyDown(props) ?? false;
    },
    onExit: cleanup,
  };
}
