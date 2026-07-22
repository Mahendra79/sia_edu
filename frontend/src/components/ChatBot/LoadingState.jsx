export default function LoadingState() {
  return (
    <div className="chat-skeleton-container" aria-label="Loading chat state" role="status">
      <div className="chat-skeleton-line short"></div>
      <div className="chat-skeleton-line medium"></div>
      <div className="chat-skeleton-line"></div>
    </div>
  );
}
