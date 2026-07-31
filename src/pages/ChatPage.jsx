import { ChatIcon } from '../components/layout/icons';
import useDocumentTitle from '../hooks/useDocumentTitle';

function ChatPage() {
  useDocumentTitle('Chat');
  return (
    <section className="page">
      <div className="page__header">
        <span className="page__badge page__badge--blue">
          <ChatIcon />
        </span>
        <h1 className="page__title">Chat</h1>
        <span className="page__badge-tag">Coming soon</span>
      </div>
      <div className="page__card">
        <p className="page__placeholder">
          Chat is on the way — you&apos;ll be able to message anyone you share a group with.
        </p>
      </div>
    </section>
  );
}

export default ChatPage;
